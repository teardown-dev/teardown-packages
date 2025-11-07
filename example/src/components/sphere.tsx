import React from 'react';
import {SphereGestures} from './sphere-gesture.tsx';
import {SphereCanvas} from './sphere-canvas.tsx';
import {SphereContainer} from './sphere.container.tsx';

export const Sphere: React.FC = () => {
  return (
    <SphereContainer>
      <SphereGestures>
        <SphereCanvas />
      </SphereGestures>
    </SphereContainer>
  );
};
