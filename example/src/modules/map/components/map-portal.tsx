import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import {View} from "react-native";
import {Portal} from "@gorhom/portal";

export type MapPortalProps = PropsWithChildren<{}>

export const MapPortal: FunctionComponent<MapPortalProps> = (props) => {
    const { children } = props;
    return (
        <Portal name={"map"}>
            {children}
        </Portal>
    );
}
