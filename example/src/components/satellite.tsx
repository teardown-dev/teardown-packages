import React, {memo} from 'react';
import {Circle} from '@shopify/react-native-skia';
import {useDerivedValue} from 'react-native-reanimated';
import {SphereService} from './sphere.service';
import {StarlinkSatellite} from '../modules/spacex/api/starlink.client.ts';

interface SatelliteProps {
  baseRadius: number;
  satellite: StarlinkSatellite;
}

export const Satellite: React.FC<SatelliteProps> = memo(
  ({baseRadius, satellite}) => {
    const {rotateX, rotateY, scale, centerX, centerY} =
      SphereService.useState();

    const position = useDerivedValue(() => {
      const rotateXValue = rotateX.value;
      const rotateYValue = rotateY.value;
      const scaleValue = scale.value;
      const radius = (baseRadius + 20) * scaleValue; // Slightly larger radius for satellites

      const rotatePoint = (x: number, y: number, z: number) => {
        // Rotate around Y-axis
        const cosY = Math.cos(rotateYValue);
        const sinY = Math.sin(rotateYValue);
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;

        // Rotate around X-axis
        const cosX = Math.cos(rotateXValue);
        const sinX = Math.sin(rotateXValue);
        const y1 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX;

        return {x: x1, y: y1, z: z2};
      };

      // Convert latitude and longitude to 3D coordinates
      const lat = satellite.latitude ?? 0;
      const lon = satellite.longitude ?? 0;
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);

      const x = -radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      const rotated = rotatePoint(x, y, z);

      return {
        x: centerX.value + rotated.x,
        y: centerY.value + rotated.y,
        z: rotated.z,
      };
    });

    const xPosition = useDerivedValue(() => {
      return position.value.x;
    });

    const yPosition = useDerivedValue(() => {
      return position.value.y;
    });

    const zPosition = useDerivedValue(() => {
      return position.value.z;
    });

    return (
      <Circle
        cx={xPosition}
        cy={yPosition}
        r={2}
        color={zPosition.value > 0 ? 'red' : 'rgba(255, 0, 0, 0.3)'}
      />
    );
  },
);
