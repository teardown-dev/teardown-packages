import React from 'react';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {withDecay} from 'react-native-reanimated';
import {SphereService} from './sphere.service';

export const SphereGestures: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const {rotateX, rotateY, scale} = SphereService.useState();

  const SPEED = -0.002;

  const panGestureX = Gesture.Pan()
    .minDistance(10)
    .activeOffsetY(10)
    .onUpdate(e => {
      rotateX.value += e.translationY * SPEED;
    })
    .onEnd(e => {
      rotateX.value = withDecay({
        velocity: e.velocityY * SPEED,
        deceleration: 0.997,
      });
    });

  const panGestureY = Gesture.Pan()
    .minDistance(10)
    .activeOffsetY(10)
    .onUpdate(e => {
      rotateY.value += e.x * SPEED;
    })
    .onEnd(e => {
      rotateY.value = withDecay({
        velocity: e.velocityX * SPEED,
        deceleration: 0.997,
      });
    });

  const pinchGesture = Gesture.Pinch().onUpdate(e => {
    scale.value = Math.max(0.1, Math.min(3, scale.value * e.scale));
  });

  const combinedGesture = Gesture.Simultaneous(
    panGestureX,
    panGestureY,
    pinchGesture,
  );

  return (
    <GestureDetector gesture={combinedGesture}>{children}</GestureDetector>
  );
};
