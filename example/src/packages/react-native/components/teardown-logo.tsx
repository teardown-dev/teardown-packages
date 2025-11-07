import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import Svg, {Path, SvgProps} from "react-native-svg";

export type TeardownLogoProps = SvgProps


export const TeardownLogo: FunctionComponent<TeardownLogoProps> = (props) => {
    const {} = props;
    return (
        <Svg width="350" height="350" viewBox="0 0 350 350" fill="none" {...props}>
            <Path fillRule="evenodd" clipRule="evenodd"
                  d="M175.09 345L300 218.574L256.859 174.909L299.821 131.426L174.91 5.00001L50 131.426L93.141 175.091L50.179 218.574L175.09 345ZM114.879 197.093L93.656 218.574L175.09 300.995L256.523 218.574L235.12 196.911L174.91 257.853L114.879 197.093ZM213.382 174.909L174.91 213.848L136.618 175.091L175.09 136.152L213.382 174.909ZM235.12 152.907L175.09 92.147L114.879 153.089L93.477 131.426L174.91 49.005L256.344 131.426L235.12 152.907Z"
                  fill="white"/>
        </Svg>

    );
}
