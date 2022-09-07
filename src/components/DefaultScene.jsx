import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export const DefaultScene = ({ children }) => {
  const sceneRef = useRef(null);

  useFrame(({ gl, camera }) => {
    gl.autoClear = false;
    gl.clearDepth();
    camera.layers.set(0);
    // hooksのsceneはグローバルなシーンなので、effectをかける方も含まれてしまうってことかしら
    gl.render(sceneRef.current, camera);
  }, 2);

  return (
    <scene ref={sceneRef}>
      <directionalLight intensity={0.1} position={[1, 1, 1]} />
      {children}
    </scene>
  );
};
