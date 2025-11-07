import React from 'react';
import {Canvas, Path, Skia} from '@shopify/react-native-skia';
import {StyleSheet} from 'react-native';
import {SphereService} from './sphere.service';
import {useDerivedValue} from 'react-native-reanimated';
import {useQuery} from '@tanstack/react-query';
import {Satellite} from './satellite.tsx';

const NUM_LATS = 12;
const NUM_LONGS = 24;

export const SphereCanvas: React.FC = () => {
  const state = SphereService.useState();

  const {canvasRef, rotateX, rotateY, scale, centerX, centerY, baseRadius} =
    state;

  const {data: satellites} = useQuery({
    queryKey: ['spacex', 'starlink', 'satellites'],
    queryFn: async () => {
      const satellites = await spacex.starlink.getSatellites();
      return satellites.data.slice(0, 100);
    },
  });

  const spherePath = useDerivedValue(() => {
    const path = Skia.Path.Make();
    const rotateXValue = rotateX.value;
    const rotateYValue = rotateY.value;
    const scaleValue = scale.value;
    const radius = baseRadius * scaleValue;

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

    // Draw latitude lines
    for (let i = 0; i <= NUM_LATS; i++) {
      const phi = (Math.PI * i) / NUM_LATS;
      const y = radius * Math.cos(phi);
      const r = radius * Math.sin(phi);

      for (let j = 0; j <= NUM_LONGS; j++) {
        const theta = (2 * Math.PI * j) / NUM_LONGS;
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);

        const rotated = rotatePoint(x, y, z);

        if (j === 0) {
          path.moveTo(centerX.value + rotated.x, centerY.value + rotated.y);
        } else {
          path.lineTo(centerX.value + rotated.x, centerY.value + rotated.y);
        }
      }
    }

    // Draw longitude lines
    for (let j = 0; j < NUM_LONGS; j++) {
      const theta = (2 * Math.PI * j) / NUM_LONGS;

      for (let i = 0; i <= NUM_LATS; i++) {
        const phi = (Math.PI * i) / NUM_LATS;
        const y = radius * Math.cos(phi);
        const r = radius * Math.sin(phi);
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);

        const rotated = rotatePoint(x, y, z);

        if (i === 0) {
          path.moveTo(centerX.value + rotated.x, centerY.value + rotated.y);
        } else {
          path.lineTo(centerX.value + rotated.x, centerY.value + rotated.y);
        }
      }
    }
    return path;
  }, [satellites]);

  return (
    <Canvas style={styles.canvas} ref={canvasRef}>
      <Path path={spherePath} color="black" style="stroke" strokeWidth={1} />
      <SphereService.Provider value={state}>
        {satellites?.map((satellite, index) => (
          <Satellite
            key={index}
            baseRadius={baseRadius}
            satellite={satellite}
          />
        ))}
      </SphereService.Provider>
    </Canvas>
  );
};

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
});
