import { useState, useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Simulator } from '~/lib/simulator';
import vertexShader from '~/shaders/particle.vert';
import fragmentShader from '~/shaders/particle.frag';
import { Mouse2D } from '~/vendors/Mouse2D';
import { DefaultScene } from '~/components/DefaultScene';
import { EffectedScene } from '~/components/EffectedScene';
import { Handle } from '~/components/Handle';
import { useDevice } from '~/hooks/Device';

const WIDTH = 32;
const HEIGHT = 32;
const amount = WIDTH * HEIGHT;

export const Fireworks = () => {
  const { gl, camera, size } = useThree();
  const fireRef = useRef(null);
  const handleRef = useRef(null);

  const { isTouch } = useDevice();

  // windowピッタリのカメラ距離
  const fovRad = (camera.fov / 2) * (Math.PI / 180);
  const cameraDist = size.height / 2 / Math.tan(fovRad);
  camera.position.z = cameraDist;

  const simulator = useMemo(() => new Simulator(gl, WIDTH, HEIGHT), [gl]);

  // Textureからデータを取るためのUVを作成
  // UVなので、WIDTH, HEIGHTで割って正規化（0.0 〜 1.0 に収める）
  const simulatorUv = useMemo(() => {
    const array = [];
    for (let ix = 0; ix < WIDTH; ix++) {
      for (let iy = 0; iy < HEIGHT; iy++) {
        array.push(ix / WIDTH, iy / HEIGHT);
      }
    }

    // 2次元配列から1次元のfloat32arrayを作る
    return Float32Array.from(array);
  }, []);

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uPositionTexture: { value: null },
        uVelocityTexture: { value: null },
        uDirection: { value: new THREE.Vector3() },
        uTime: { value: 0 },
        uOpacity: { value: 0 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    });

    return mat;
  }, []);

  // create geometry
  // r3fのコンポーネント形式だと動かなかった...
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry();
    // geo.applyMatrix4(new THREE.Matrix4().makeScale(1, 10, 1));
    geo.setAttribute(
      'simulatorUv',
      new THREE.InstancedBufferAttribute(simulatorUv, 2)
    );
    return geo;
  }, [simulatorUv]);

  // 持ち手の長さの半分を計算し、パーティクルの放出点をずらす
  const [handleHeight, setHandleHeight] = useState(0);

  // マウスの初期化
  const mouseRef = useRef(null);
  const prevVec2Ref = useRef(null);
  useEffect(() => {
    mouseRef.current = Mouse2D.instance;
    prevVec2Ref.current = mouseRef.current.relativePositionForGL;

    return () => {
      mouseRef.current.dispose();
    };
  }, []);

  // 押している間だけ噴出
  const powerRef = useRef(0); // 現在の噴出度合い
  const buffGrade = 0.02; // 押している間それくらいのスピードで強くなるか
  const deBuffGrade = 0.03; // 離している間それくらいのスピードで弱くなるか
  const isHold = useRef(false);
  const updatePower = () => {
    // powerを0~1で上下させる
    if (isHold.current) {
      powerRef.current = Math.min(powerRef.current + buffGrade, 1);
    } else {
      powerRef.current = Math.max(powerRef.current - deBuffGrade, 0);
    }
  };
  useEffect(() => {
    const holdOn = () => (isHold.current = true);
    const holdOut = () => (isHold.current = false);

    window.addEventListener('mousedown', holdOn);
    window.addEventListener('mouseup', holdOut);
    window.addEventListener('touchstart', holdOn);
    window.addEventListener('touchend', holdOut);
    window.addEventListener('blur', holdOut);

    return () => {
      window.removeEventListener('mousedown', holdOn);
      window.removeEventListener('mouseup', holdOut);
      window.removeEventListener('touchstart', holdOn);
      window.removeEventListener('touchend', holdOut);
      window.removeEventListener('blur', holdOut);
    };
  }, []);

  useFrame(() => {
    if (!(mouseRef.current && prevVec2Ref.current)) return;

    // マウス操作
    const mouseDelta = { x: 0, y: 0 };
    if (!isTouch) {
      const mouseX = mouseRef.current?.relativePositionForGL.x || 0;
      const mouseY = mouseRef.current?.relativePositionForGL.y || 0;

      // 前フレームとのマウス位置差分
      mouseDelta.x = mouseX - prevVec2Ref.current.x;
      mouseDelta.y = mouseY - prevVec2Ref.current.y;

      // 持ち手オブジェクトを動かす
      handleRef.current.position.set(mouseX, -mouseY, 0);
      handleRef.current.rotation.z = -mouseX * 0.001;
    } else {
      handleRef.current.position.set(0, -window.innerHeight * 0.3, 0);
    }

    // 持ち手の方向を計算
    const direction = new THREE.Vector4(0, 1, 0, 0); // y方向が持ち手の先頭
    direction.applyMatrix4(handleRef.current.matrix).normalize();

    // 放出箇所の位置をとるため、放出方向に持ち手の半分をかけた長さから、位置ベクトルを取得
    const originOffset = direction.clone().multiplyScalar(handleHeight / 2);
    const particleOrigin = handleRef.current.position.clone().add(originOffset);

    // 噴出量を更新
    updatePower();

    simulator.update({
      power: powerRef.current,
      origin: particleOrigin,
      direction: direction,
      mouseDelta: mouseDelta,
    });

    // 計算結果をパーティクルのシェーダーに適用
    material.uniforms.uPositionTexture.value = simulator.texturePosition;
    material.uniforms.uVelocityTexture.value = simulator.textureVelocity;

    // その他のuniformsを適用
    material.uniforms.uTime.value++;
    material.uniforms.uOpacity.value = powerRef.current;
    prevVec2Ref.current = mouseRef.current.relativePositionForGL;
  });

  useEffect(() => {
    // instanced mesh を使うときは、ダミーでもmatrixの設定が必要っぽい
    const dummy = new THREE.Object3D();
    for (let i = 0; i < amount; i++) {
      fireRef.current?.setMatrixAt(i, dummy.matrix);
    }
  });

  return (
    <>
      <EffectedScene>
        <instancedMesh
          layers={1}
          ref={fireRef}
          args={[geometry, material, amount]}
        />
      </EffectedScene>
      <DefaultScene>
        <Handle
          ref={handleRef}
          powerRef={powerRef}
          setHeight={setHandleHeight}
        />
      </DefaultScene>
      {/* <Handle ref={handleRef} /> */}
    </>
  );
};
