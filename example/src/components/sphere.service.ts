import React, {createContext, useContext} from 'react';
import {SharedValue, useSharedValue} from 'react-native-reanimated';
import {
  Canvas,
  SkiaDomView,
  SkPath,
  useCanvasRef,
} from '@shopify/react-native-skia';
import {useWindowDimensions} from 'react-native';

export type SphereServiceContextType = {
  rotateX: SharedValue<number>;
  rotateY: SharedValue<number>;
  scale: SharedValue<number>;
  centerX: SharedValue<number>;
  centerY: SharedValue<number>;
  baseRadius: number;
  canvasRef: React.MutableRefObject<SkiaDomView | null>;
};

const Context = createContext<SphereServiceContextType | null>(null);

export const SphereService = {
  Context,
  Provider: Context.Provider,

  useState() {
    const state = useContext(Context);
    if (state == null) {
      throw new Error('SphereService not found');
    }
    return state;
  },

  useProvidedState(): SphereServiceContextType {
    const {width, height} = useWindowDimensions();
    const centerX = useSharedValue(width / 2);
    const centerY = useSharedValue(height / 2);
    const baseRadius = Math.min(width, height) * 0.2;
    const canvasRef = useCanvasRef();
    const rotateX = useSharedValue(0);
    const rotateY = useSharedValue(0);
    const scale = useSharedValue(1);

    return {
      rotateX,
      rotateY,
      scale,
      centerX,
      centerY,
      baseRadius,
      canvasRef,
    };
  },
};
