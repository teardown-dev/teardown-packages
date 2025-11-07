import * as React from "react";
import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgArrive = (props: SvgProps) => (
  <Svg viewBox="0 0 20 20" {...props}>
    <Path d="M10 5a2 2 0 1 1 2-2 2 2 0 0 1-2 2m4.913 8.351-4.904-6.343-4.904 6.343a.387.387 0 0 0 .41.624l2.952-1.344a.355.355 0 0 1 .54.369H9v5.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-5.492h.01a.358.358 0 0 1 .542-.377l2.951 1.344a.387.387 0 0 0 .41-.624" />
  </Svg>
);
export default SvgArrive;
