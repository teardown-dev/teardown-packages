import * as React from "react";
import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgInvalidUturn = (props: SvgProps) => (
  <Svg viewBox="0 0 20 20" {...props}>
    <Path d="M17.01 8v9.497a.503.503 0 0 1-.504.503h-.993a.503.503 0 0 1-.504-.503V8a3.5 3.5 0 1 0-7 0v4H8a.358.358 0 0 0 .542.377l2.952-1.343a.387.387 0 0 1 .41.623L7 18l-4.904-6.343a.387.387 0 0 1 .41-.623l2.952 1.343A.358.358 0 0 0 6 12h.01V8a5.5 5.5 0 1 1 11 0" />
  </Svg>
);
export default SvgInvalidUturn;
