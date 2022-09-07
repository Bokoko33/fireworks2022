import { forwardRef, useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

export const Handle = forwardRef(({ powerRef, setHeight }, ref) => {
  const { nodes, scene } = useGLTF('/models/fireworks.glb');
  const lightRef1 = useRef(null);
  const lightRef2 = useRef(null);
  const lightPower = 0.5;

  const scale = 50;

  const objectHeight = useMemo(() => {
    let height = 0;
    nodes.root.children.forEach((mesh) => {
      height += mesh.geometry.boundingBox.max.y;
    });

    return height;
  }, [nodes]);

  useEffect(() => {
    const hight = objectHeight * scale;
    setHeight(hight);
  }, [setHeight, objectHeight]);

  useFrame(() => {
    lightRef1.current.intensity = powerRef.current * lightPower;
    lightRef2.current.intensity = powerRef.current * lightPower;
  });

  return (
    <group ref={ref} scale={scale} rotation={[-Math.PI / 4, 0, 0]}>
      <pointLight
        ref={lightRef1}
        args={[0xffffff, 0, 0, 1]}
        position={[-1, objectHeight * 0.6, 0]}
      />
      <pointLight
        ref={lightRef2}
        args={[0xffffff, 0, 0, 1]}
        position={[1, objectHeight * 0.6, 0]}
      />
      {/* <directionalLight ref={lightRef} /> */}
      <primitive object={scene} />
    </group>
  );
});

Handle.displayName = 'Handle';

useGLTF.preload('/models/fireworks.glb');
