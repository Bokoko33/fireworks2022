import { useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { Effects } from '@react-three/drei';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';

extend({ EffectComposer, UnrealBloomPass, RenderPass });

export const EffectedScene = ({ children }) => {
  const composerRef = useRef(null);

  useFrame(({ gl, camera }) => {
    // post processing をかけるlayerのレンダリング
    gl.autoClear = false;
    gl.clearDepth();
    camera.layers.set(1);
    composerRef.current.render();
  }, 1);

  return (
    <>
      {children}
      <Effects ref={composerRef} disableRender>
        {/* <renderPass attach="passes-0" args={[scene, camera]} /> */}
        <unrealBloomPass
          // attach="passes-1"
          // exposure={2}
          threshold={0}
          strength={2}
          radius={1}
        />
      </Effects>
    </>
  );
};
