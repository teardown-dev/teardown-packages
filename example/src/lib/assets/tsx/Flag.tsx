import * as React from "react";
import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgFlag = (props: SvgProps) => (
  <Svg viewBox="0 0 20 20" {...props}>
    <Path d="M3.5 18a.5.5 0 0 1-.5-.5v-14a.5.5 0 0 1 .5-.5.5.5 0 0 1 .5.5v14a.5.5 0 0 1-.5.5m9.833-11L17 3H6v8h11Z" />
  </Svg>
);
export default SvgFlag;
