// ref
// https://qiita.com/nemutas/items/b40baa2a1f33fae6b20d
// https://qiita.com/uma6661/items/20accc9b5fb9845fc73a

import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer';
import positionFragmentShader from '~/shaders/position.frag';
import velocityFragmentShader from '~/shaders/velocity.frag';

export class Simulator {
  constructor(gl, width, height) {
    this._gpuCompute = new GPUComputationRenderer(width, height, gl);

    // GPUComputationRendererが持つ「Variable」という概念。
    this._variables = [];
    this._positionVariable = null;
    this._velocityVariable = null;

    this._setTexture();
    this._setVariableDependencies();
    this._gpuCompute.init();
  }

  _setTexture = () => {
    // テクスチャを作成
    // 一旦取り出して参照渡し
    const dtPosition = this._gpuCompute.createTexture(); // 内部でTHREE.DataTextureが作成される。
    const posArray = dtPosition.image.data; // テクスチャからデータを取り出す

    const dtVelocity = this._gpuCompute.createTexture(); // 内部でTHREE.DataTextureが作成される。
    const velArray = dtVelocity.image.data; // テクスチャからデータを取り出す

    // ランダムな散り具合。
    // GPGPUしないけど、Attribute的な使い道をする
    const dtDiffuse = this._gpuCompute.createTexture();
    const diffArray = dtDiffuse.image.data;

    // 4次元ベクトルを一次元配列で処理する
    for (let i = 0; i < posArray.length; i += 4) {
      // パーティクルの初期位置をいい感じに決める
      const offset = 1;
      const x = Math.random() - 0.5;
      const y = Math.random() - 0.5;
      const z = Math.random() - 0.5;
      const pos = new THREE.Vector3(x, y, z);
      pos.normalize();
      pos.multiplyScalar(offset);
      posArray[i + 0] = 0;
      posArray[i + 1] = 0;
      posArray[i + 2] = 0;
      posArray[i + 3] = Math.random(); // life

      // 速度
      velArray[i + 0] = 0;
      velArray[i + 1] = 0;
      velArray[i + 2] = 0;
      velArray[i + 3] = Math.random(); // ランダムで激しいものを混ぜるための閾値

      // ランダムなばらつきベクトル
      const diffPower = 4;
      const diffX = Math.random() - 0.5;
      const diffY = Math.random() - 0.5;
      const diffZ = Math.random() - 0.5;
      const diffVel = new THREE.Vector3(diffX, diffY, diffZ).normalize();
      diffVel.multiplyScalar((Math.random() + 0.5) * diffPower);
      diffArray[i + 0] = diffVel.x;
      diffArray[i + 1] = diffVel.y;
      diffArray[i + 2] = diffVel.z;
      diffArray[i + 3] = 0;
    }

    // シェーダープログラムをアタッチ
    // 「texturePosition」という名前でGLSLで参照する
    this._positionVariable = this._gpuCompute.addVariable(
      'texturePosition',
      positionFragmentShader,
      dtPosition
    );

    this._velocityVariable = this._gpuCompute.addVariable(
      'textureVelocity',
      velocityFragmentShader,
      dtVelocity
    );

    // ？ おまじない
    this._positionVariable.wrapS = THREE.RepeatWrapping;
    this._positionVariable.wrapT = THREE.RepeatWrapping;
    this._velocityVariable.wrapS = THREE.RepeatWrapping;
    this._velocityVariable.wrapT = THREE.RepeatWrapping;

    // uniformsをセットする場合はこんな感じで positionVariable からmaterialを取り出して、
    // 参照を維持してセットしてく
    /**
     * position
     */
    this._positionVariable.material.uniforms.uDefaultTexture = {
      value: dtPosition.clone(),
    };
    this._positionVariable.material.uniforms.uOrigin = {
      value: new THREE.Vector3(),
    };
    // マウス座標差分
    this._positionVariable.material.uniforms.uMouseDelta = {
      value: new THREE.Vector2(),
    };
    // 放出力をlifeに適用する
    this._positionVariable.material.uniforms.uPower = {
      value: 0,
    };

    /**
     * velocity
     */
    this._velocityVariable.material.uniforms.uDefaultTexture = {
      value: dtVelocity.clone(),
    };
    // パーティクルごとのばらつきをテクスチャで入れる
    this._velocityVariable.material.uniforms.uDiffuseTexture = {
      value: dtDiffuse,
    };
    // 放出方向
    this._velocityVariable.material.uniforms.uDirection = {
      value: new THREE.Vector3(),
    };
    // 放出力
    this._velocityVariable.material.uniforms.uPower = {
      value: 0,
    };
    // マウス座標差分
    this._velocityVariable.material.uniforms.uMouseDelta = {
      value: new THREE.Vector2(),
    };

    // variableの配列に入れておく
    this._variables.push(this._positionVariable);
    this._variables.push(this._velocityVariable);
  };

  _setVariableDependencies = () => {
    // setVariableDependencies っていう依存関係を登録する？関数を variablesごとに実行する必要がある
    this._variables.forEach((variable) => {
      this._gpuCompute.setVariableDependencies(variable, this._variables);
    });
  };

  update = ({ power, origin, direction, mouseDelta }) => {
    /**
     * position
     */
    this._positionVariable.material.uniforms.uOrigin.value.set(
      origin.x,
      origin.y,
      origin.z
    );
    this._positionVariable.material.uniforms.uMouseDelta.value.set(
      mouseDelta.x,
      mouseDelta.y
    );
    this._positionVariable.material.uniforms.uPower.value = power;

    /**
     * velocity
     */
    this._velocityVariable.material.uniforms.uDirection.value.set(
      direction.x,
      direction.y,
      direction.z
    );
    this._velocityVariable.material.uniforms.uMouseDelta.value.set(
      mouseDelta.x,
      mouseDelta.y
    );
    this._velocityVariable.material.uniforms.uPower.value = power;

    // 計算用テクスチャを更新
    this._gpuCompute.compute();
  };

  get texturePosition() {
    // 計算した結果が格納されたテクスチャを渡す。描画用のパーティクルシェーダーに渡す目的で使う
    const target = this._gpuCompute.getCurrentRenderTarget(
      this._positionVariable
    );

    return target.texture;
  }

  get textureVelocity() {
    // 計算した結果が格納されたテクスチャを渡す。描画用のパーティクルシェーダーに渡す目的で使う
    const target = this._gpuCompute.getCurrentRenderTarget(
      this._velocityVariable
    );

    return target.texture;
  }
}
