import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stats } from '@react-three/drei'; // ← Enable when testing
import { Fireworks } from '~/components/Fireworks';

export const WebGLCanvas = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 1], fov: 45, far: 5000 }}
      gl={{ alpha: true, autoClear: false }}
    >
      <color attach="background" args={[0x000000]} />
      {/* Enable when testing ↓ */}
      <Stats />
      <Suspense fallback={null}>
        <Fireworks />
      </Suspense>
    </Canvas>
  );
};
