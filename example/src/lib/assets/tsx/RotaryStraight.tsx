import * as React from "react";
import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgRotaryStraight = (props: SvgProps) => (
  <Svg viewBox="0 0 20 20" {...props}>
    <Path d="M10 8.2A3.8 3.8 0 1 1 6.2 12 3.804 3.804 0 0 1 10 8.2m0 7A3.2 3.2 0 1 0 6.8 12a3.204 3.204 0 0 0 3.2 3.2M10 8a4 4 0 1 0 4 4 4.005 4.005 0 0 0-4-4m0 7a3 3 0 1 1 3-3 3.003 3.003 0 0 1-3 3m2.83-5.827a3.971 3.971 0 0 0-2.33-1.142V5.004a.179.179 0 0 1 .271-.189l1.476.672a.193.193 0 0 0 .205-.311L10 2.004 7.548 5.176a.193.193 0 0 0 .205.311l1.476-.672a.179.179 0 0 1 .271.19V9h.5a3 3 0 1 1 0 6h-.5v3h1v-2.03a4 4 0 0 0 2.33-6.797" />
  </Svg>
);
export default SvgRotaryStraight;
