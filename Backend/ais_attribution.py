"""
God's Eye - vessel attribution via aisstream.io.

Matches detected oil slicks against vessels currently broadcasting AIS
position reports inside the scene's bounding box, and guesses which vessel
(if any) is the likely source of each slick.

This is inherently a LIVE match: aisstream.io is a real-time feed with no
historical archive, so a vessel is only attributable if it is transmitting
AIS *right now*, near the scene's footprint. That's a fit for a live-camera
/ live-upload workflow, not for attributing a slick in an old archival
scene - there is nothing to match against for a vessel that has since
moved on or a scene from last month.

    wss://stream.aisstream.io/v0/stream

Get a free API key at https://aisstream.io/authenticate, then set:

    export AISSTREAM_API_KEY=...
"""

import asyncio
import json
import math

import websockets

AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream"

# A discharge trail a few hundred meters to a couple km long is common; a
# vessel more than this far from a slick's centroid is not a realistic
# source for it.
MAX_MATCH_DISTANCE_KM = 8.0

# How far off a vessel's course-over-ground the slick's long axis (mod 180,
# since a fitted ellipse has no directionality) may sit and still count as
# "trailing behind the vessel".
MAX_HEADING_MISALIGNMENT_DEG = 45.0


def bbox_from_scene(transform, shape):
    """Scene's lat/lon bounding box as aisstream's nested-array format:
    [[[lat_min, lon_min], [lat_max, lon_max]]].

    transform is the rasterio Affine for the scene; shape is (rows, cols).
    """
    h, w = shape
    corners = [transform * (0, 0), transform * (w, 0),
               transform * (0, h), transform * (w, h)]
    lons = [c[0] for c in corners]
    lats = [c[1] for c in corners]
    return [[[min(lats), min(lons)], [max(lats), max(lons)]]]


def _haversine_km(lat1, lon1, lat2, lon2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _bearing_deg(lat1, lon1, lat2, lon2):
    """Compass bearing from point 1 to point 2, 0-360."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dl = math.radians(lon2 - lon1)
    y = math.sin(dl) * math.cos(p2)
    x = math.cos(p1) * math.sin(p2) - math.sin(p1) * math.cos(p2) * math.cos(dl)
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def _angle_diff(a, b):
    """Smallest difference between two angles in degrees, 0-180."""
    d = abs(a - b) % 360
    return min(d, 360 - d)


async def collect_vessels(bbox, api_key, duration_s=20.0):
    """Listen to aisstream.io for `duration_s` seconds and return the latest
    position report seen for each vessel (by MMSI) inside `bbox`.

    Returns a list of {mmsi, name, lat, lon, cog_deg, sog_knots}.
    """
    vessels = {}
    try:
        async with websockets.connect(AISSTREAM_URL, open_timeout=10) as ws:
            await ws.send(json.dumps({
                "APIKey": api_key,
                "BoundingBoxes": bbox,
                "FilterMessageTypes": ["PositionReport", "ShipStaticData"],
            }))

            async def _consume():
                async for raw in ws:
                    msg = json.loads(raw)
                    body = msg.get("Message", {})
                    meta = msg.get("MetaData", {})
                    mmsi = meta.get("MMSI")
                    if mmsi is None:
                        continue

                    if "PositionReport" in body:
                        pr = body["PositionReport"]
                        entry = vessels.setdefault(mmsi, {"mmsi": mmsi, "name": None})
                        entry["lat"] = pr.get("Latitude")
                        entry["lon"] = pr.get("Longitude")
                        entry["cog_deg"] = pr.get("Cog")
                        entry["sog_knots"] = pr.get("Sog")
                    elif "ShipStaticData" in body:
                        name = body["ShipStaticData"].get("ShipName")
                        if name:
                            vessels.setdefault(mmsi, {"mmsi": mmsi})["name"] = name.strip()

            try:
                await asyncio.wait_for(_consume(), timeout=duration_s)
            except asyncio.TimeoutError:
                pass
    except Exception as exc:
        # Network/auth failure shouldn't fail the whole detection job - the
        # caller degrades to "no attribution available" instead.
        return [], str(exc)

    complete = [v for v in vessels.values()
                if v.get("lat") is not None and v.get("cog_deg") is not None]
    return complete, None


def attribute_detection(detection, vessels):
    """Pick the best-matching vessel for one detection, or None.

    A vessel is a candidate if it's within MAX_MATCH_DISTANCE_KM of the
    slick's centroid AND the slick's long axis roughly trails behind the
    vessel along its course-over-ground. Ranked by a blend of proximity and
    heading alignment; the single best candidate is returned.
    """
    geometry = detection.get("geometry")
    orientation = detection.get("orientation_deg")
    if not geometry or orientation is None or not vessels:
        return None

    lons = [pt[0] for pt in geometry["coordinates"][0]]
    lats = [pt[1] for pt in geometry["coordinates"][0]]
    centroid_lon, centroid_lat = sum(lons) / len(lons), sum(lats) / len(lats)

    # cv2.fitEllipse's angle is clockwise from vertical; compass bearing is
    # clockwise from north - they're the same convention, so this is a
    # direct axis (mod 180, an ellipse has no forward/backward sense).
    axis_bearing = orientation % 180

    best, best_score = None, -1.0
    for v in vessels:
        dist_km = _haversine_km(centroid_lat, centroid_lon, v["lat"], v["lon"])
        if dist_km > MAX_MATCH_DISTANCE_KM:
            continue

        bearing_to_slick = _bearing_deg(v["lat"], v["lon"], centroid_lat, centroid_lon)
        # The trail should sit roughly along the vessel's heading, whether
        # the vessel is quoted at the trail's near or far end.
        heading_misalign = min(
            _angle_diff(bearing_to_slick, v["cog_deg"]),
            _angle_diff(bearing_to_slick, (v["cog_deg"] + 180) % 360),
        )
        axis_misalign = _angle_diff(axis_bearing, v["cog_deg"] % 180)
        if heading_misalign > MAX_HEADING_MISALIGNMENT_DEG:
            continue

        proximity_score = 1 - dist_km / MAX_MATCH_DISTANCE_KM
        alignment_score = 1 - (
            (heading_misalign + axis_misalign) / 2
        ) / MAX_HEADING_MISALIGNMENT_DEG
        score = 0.5 * proximity_score + 0.5 * max(alignment_score, 0)

        if score > best_score:
            best_score = score
            best = {
                "mmsi": v["mmsi"],
                "name": v.get("name"),
                "lat": v["lat"],
                "lon": v["lon"],
                "distance_km": round(dist_km, 2),
                "cog_deg": v["cog_deg"],
                "sog_knots": v.get("sog_knots"),
                "confidence": round(max(min(score, 1.0), 0.0), 2),
            }

    return best


def attribute_vessels_sync(detections, transform, scene_shape, api_key,
                           duration_s=20.0):
    """Blocking entry point for the sync worker in server.py.

    Mutates nothing; returns (detections_with_attribution, warning_or_None).
    Each detection gets an "attributed_vessel" key: a match dict, or None
    when no vessel in the live feed matched.
    """
    bbox = bbox_from_scene(transform, scene_shape)
    vessels, error = asyncio.run(collect_vessels(bbox, api_key, duration_s))

    if error:
        for d in detections:
            d["attributed_vessel"] = None
        return detections, f"AIS lookup failed: {error}"

    for d in detections:
        d["attributed_vessel"] = attribute_detection(d, vessels)

    return detections, None
