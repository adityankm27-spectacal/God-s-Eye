$css = @'
@import "tailwindcss";

/* ===========================================================
   GOD'S EYE - OCEAN DESIGN SYSTEM
   Phase 1: Design token foundation
   Palette: ocean / maritime / SAR intelligence
   =========================================================== */

:root {
  /* Core palette */
  --deep-ocean:   #061A2B;
  --ocean-blue:   #0B4F71;
  --marine-blue:  #087EA4;
  --aqua:         #28B8D8;
  --soft-cyan:    #78DCE8;
  --ocean-white:  #F4FAFC;
  --light-ocean:  #EAF6F8;
  --muted-text:   #66808D;

  /* Semantic tokens */
  --background:    #EAF6F8;
  --surface:       #FFFFFF;
  --surface-2:     #F4FAFC;
  --border:        #C8E0E8;
  --foreground:    #061A2B;
  --muted:         #66808D;
  --accent:        #28B8D8;
  --accent-2:      #087EA4;
  --accent-orange: #E07B39;
  --danger:        #DC3545;
  --warning:       #E07B39;

  /* Sidebar / nav tokens */
  --nav-bg:          #061A2B;
  --nav-border:      #0B4F71;
  --nav-text:        #A8C4CE;
  --nav-text-active: #F4FAFC;
  --nav-active-bg:   #0B4F71;
  --nav-hover-bg:    rgba(11,79,113,0.45);

  /* Shape */
  --radius-card:  18px;
  --radius-btn:   12px;
  --radius-input: 12px;

  /* Shadow */
  --shadow-card:  0 2px 12px rgba(6,26,43,0.08);
  --shadow-hover: 0 6px 24px rgba(6,26,43,0.13);
}

@theme inline {
  --color-background:    var(--background);
  --color-surface:       var(--surface);
  --color-surface-2:     var(--surface-2);
  --color-border:        var(--border);
  --color-foreground:    var(--foreground);
  --color-muted:         var(--muted);
  --color-accent:        var(--accent);
  --color-accent-2:      var(--accent-2);
  --color-accent-orange: var(--accent-orange);
  --color-danger:        var(--danger);
  --color-warning:       var(--warning);
  --font-sans:    var(--font-inter);
  --font-display: var(--font-source-serif);
  --font-mono:    var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}

::-webkit-scrollbar       { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: var(--accent-2); }

/* MapLibre overrides */
.maplibregl-ctrl-attrib {
  font-size: 10px !important;
  background: rgba(6,26,43,0.65) !important;
  color: var(--muted) !important;
}
.maplibregl-ctrl-attrib a { color: var(--soft-cyan) !important; }
.maplibregl-popup-content {
  background: var(--surface) !important;
  color: var(--foreground) !important;
  border: 1px solid var(--border);
  border-radius: 12px !important;
  box-shadow: var(--shadow-hover);
}
.maplibregl-popup-tip {
  border-top-color:    var(--surface) !important;
  border-bottom-color: var(--surface) !important;
}
.maplibregl-ctrl-group {
  background: var(--surface) !important;
  border: 1px solid var(--border) !important;
  border-radius: 10px !important;
  box-shadow: var(--shadow-card) !important;
}

/* Animations */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-up   { animation: fade-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
.animate-fade-up-1 { animation-delay: 0.05s; }
.animate-fade-up-2 { animation-delay: 0.15s; }
.animate-fade-up-3 { animation-delay: 0.25s; }
.animate-fade-up-4 { animation-delay: 0.35s; }

@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.animate-fade-in { animation: fade-in 0.6s ease both; }

@keyframes scale-in {
  from { opacity: 0; transform: scale(1.04); }
  to   { opacity: 1; transform: scale(1); }
}
.animate-scale-in { animation: scale-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }

@keyframes pulse-ring {
  0%   { transform: scale(0.6); opacity: 0.9; }
  70%  { transform: scale(2.4); opacity: 0; }
  100% { transform: scale(2.4); opacity: 0; }
}
.pulse-ring { animation: pulse-ring 2.2s cubic-bezier(0.2, 0.6, 0.4, 1) infinite; }

@keyframes scan {
  0%   { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}
.scan-line { animation: scan 3s linear infinite; }

@keyframes dash {
  to { stroke-dashoffset: -20; }
}
.dash-flow { stroke-dasharray: 4 4; animation: dash 1s linear infinite; }

/* Utility: ocean card */
.ocean-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  transition: box-shadow 250ms ease, border-color 250ms ease;
}
.ocean-card:hover {
  box-shadow: var(--shadow-hover);
  border-color: var(--aqua);
}

/* Utility: primary button */
.btn-ocean {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--ocean-blue);
  color: var(--ocean-white);
  border-radius: var(--radius-btn);
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  transition: background 220ms ease, box-shadow 220ms ease;
}
.btn-ocean:hover {
  background: var(--marine-blue);
  box-shadow: 0 4px 16px rgba(8,126,164,0.30);
}

/* Utility: ghost button */
.btn-ocean-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ocean-blue);
  border: 1.5px solid var(--ocean-blue);
  border-radius: var(--radius-btn);
  padding: 0.5rem 1.125rem;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background 220ms ease, color 220ms ease;
}
.btn-ocean-ghost:hover {
  background: var(--ocean-blue);
  color: var(--ocean-white);
}

/* Utility: sidebar nav item */
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  border-radius: 10px;
  font-size: 0.875rem;
  color: var(--nav-text);
  transition: background 200ms ease, color 200ms ease;
  border: 1px solid transparent;
}
.sidebar-item:hover {
  background: var(--nav-hover-bg);
  color: var(--nav-text-active);
}
.sidebar-item.active {
  background: var(--nav-active-bg);
  color: var(--nav-text-active);
  border-color: rgba(40,184,216,0.25);
}

/* Accessibility: focus ring */
:focus-visible {
  outline: 2px solid var(--aqua);
  outline-offset: 2px;
}
'@

Set-Content -Path "src\app\globals.css" -Encoding UTF8 -Value $css
Write-Host "Done."
