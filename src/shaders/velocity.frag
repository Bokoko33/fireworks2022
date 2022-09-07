uniform sampler2D uDefaultTexture;
uniform sampler2D uDiffuseTexture;
uniform vec3 uDirection;
uniform vec2 uMouseDelta;
uniform float uPower;

const float friction = 0.96;
const float powerLevel = 24.0;
const float bigPowerLevel = 8.0;
const float bigFlagRatio = 0.99;
const vec3 gravity = vec3(0.0, -1.0, 0.0) * 0.3;

float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
}

void main()	{
	vec2 uv = gl_FragCoord.xy / resolution.xy;
	vec4 tmpPos = texture2D(texturePosition, uv);
	vec4 tmpVel = texture2D(textureVelocity, uv);
	vec3 position = tmpPos.xyz;
	vec3 velocity = tmpVel.xyz;

	// 方向にばらつきを持たせる
	vec4 diffuseVel = texture2D(uDiffuseTexture, uv);

	// ランダムで大きいものを混ぜるための閾値
	float bigFlag = tmpVel.w;

	float life = tmpPos.w;
	// lifeが0.1未満になったとき、デフォルトのテクスチャを参照して
    // 初期位置に戻る
	if (life < 0.1) {
		vec4 defVel = texture2D(uDefaultTexture, uv);
		velocity = uDirection * uPower * powerLevel + diffuseVel.xyz;

		// ランダムで大きいものを混ぜる
		float randomBurst = random(vec2(tmpVel.w, tmpVel.x));
		bigFlag = step(bigFlagRatio, randomBurst); // 1.0 or 0.0 でフラグにする
		velocity += normalize(velocity) * bigFlag * bigPowerLevel; // フラグ合格した大きいものは、初速も大きくする

		// マウス移動による慣性をかける
		float mouseDeltaLevel = 0.2;
		float mouseDeltaMax = 10.0;
		float mouseDeltaX = clamp(uMouseDelta.x * mouseDeltaLevel, -mouseDeltaMax, mouseDeltaMax);
		float mouseDeltaY = clamp(uMouseDelta.y * mouseDeltaLevel, -mouseDeltaMax, mouseDeltaMax);
		vec3 mouseDeltaVec = vec3(-mouseDeltaX, -mouseDeltaY, 0.0);
		velocity += mouseDeltaVec;
	}

    vec3 newVel = velocity * friction + gravity;
	
	gl_FragColor = vec4(newVel, bigFlag);
}