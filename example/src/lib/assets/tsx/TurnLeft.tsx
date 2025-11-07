import * as React from "react";
import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgTurnLeft = (props: SvgProps) => (
  <Svg viewBox="0 0 20 20" {...props}>
    <Path d="m10 5.98.011.002A6.06 6.06 0 0 1 16 12.055V16h-.003l.002 1.503a.496.496 0 0 1-.496.497h-1.007a.496.496 0 0 1-.496-.496v-5.45a4.058 4.058 0 0 0-3.989-4.072H8.012a.358.358 0 0 0-.377.542l1.344 2.952a.387.387 0 0 1-.624.41L2.008 7l6.347-4.922a.387.387 0 0 1 .624.41L7.635 5.438a.358.358 0 0 0 .377.543H10" />
  </Svg>
);
export default SvgTurnLeft;
