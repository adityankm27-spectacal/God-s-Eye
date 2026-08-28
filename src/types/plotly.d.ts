declare module "plotly.js-dist-min";

declare module "react-plotly.js" {
  import { Component } from "react";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export default class Plot extends Component<any> {}
}
