import * as React from "react";
import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgClose = (props: SvgProps) => (
  <Svg viewBox="0 0 20 20" {...props}>
    <Path d="m17.356 4.059-5.59 5.59a.497.497 0 0 0 0 .702l5.59 5.59a.497.497 0 0 1 0 .703l-.711.711a.497.497 0 0 1-.703 0l-5.59-5.59a.497.497 0 0 0-.703 0l-5.59 5.59a.497.497 0 0 1-.703 0l-.711-.71a.497.497 0 0 1 0-.703l5.59-5.59a.497.497 0 0 0 0-.703l-5.59-5.59a.497.497 0 0 1 0-.703l.71-.711a.497.497 0 0 1 .703 0l5.59 5.59a.497.497 0 0 0 .703 0l5.59-5.59a.497.497 0 0 1 .703 0l.711.71a.497.497 0 0 1 0 .704" />
  </Svg>
);
export default SvgClose;
