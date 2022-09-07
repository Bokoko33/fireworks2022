// Quaternion ref: https://qiita.com/aa_debdeb/items/c34a3088b2d8d3731813
struct Quaternion {
  float x;
  float y;
  float z;
  float w;
};

Quaternion identity() {
  return Quaternion(0.0, 0.0, 0.0, 1.0);
}

Quaternion axisAngle(vec3 axis, float radian) {
  vec3 naxis = normalize(axis);
  float h = 0.5 * radian;
  float s = sin(h);
  return Quaternion(naxis.x * s, naxis.y * s, naxis.z * s, cos(h));
}

Quaternion conjugate(Quaternion q) {
  return Quaternion(-q.x, -q.y, -q.z, q.w);
}

Quaternion mul(Quaternion q, float f) {
  return Quaternion(f * q.x, f * q.y, f * q.z, f * q.w);
}

Quaternion mul(Quaternion q1, Quaternion q2) {
  return Quaternion(
    q2.w * q1.x - q2.z * q1.y + q2.y * q1.z + q2.x * q1.w,
    q2.z * q1.x + q2.w * q1.y - q2.x * q1.z + q2.y * q1.w,
    -q2.y * q1.x + q2.x * q1.y + q2.w * q1.z + q2.z * q1.w,
    -q2.x * q1.x - q2.y * q1.y - q2.z * q1.z + q2.w * q1.w
  );
}

vec3 rotate(vec3 v, Quaternion q) {
  // norm of q must be 1.
  Quaternion vq = Quaternion(v.x, v.y, v.z, 0.0);
  Quaternion cq = conjugate(q);
  Quaternion mq = mul(mul(cq, vq), q);
  return vec3(mq.x, mq.y, mq.z);
}

uniform sampler2D uPositionTexture;
uniform sampler2D uVelocityTexture;
uniform vec3 uDirection;

attribute vec2 simulatorUv; 

void main() {
  vec4 positionInfo = texture2D(uPositionTexture, simulatorUv);
	vec4 vlocityInfo = texture2D(uVelocityTexture, simulatorUv);

  vec3 pos = position;

  // 大きさ調整
  float bigFlag = vlocityInfo.w; // 1.0 or 0.0
  float defaultFlag = 1.0 - bigFlag;
  pos.y *= 1.0 + defaultFlag * 18.0; // 縦だけ引き伸ばす通常パターン
  pos *= 1.0 + bigFlag * 2.0; // 全体を大きくする特殊パターン
  
  // lifeを大きさに反映（ただし、0の代わりにbigFlagを使うことで、特殊パターンには反映しないようにする）
  float life = positionInfo.w;
  float bigScale = step(0.1, life);
  float lifeScale = mix(0.0, 1.0, life);
  pos *= mix(lifeScale, bigScale, bigFlag);

	// 進行方向をもとに回転をかけて向きを整える
	vec3 dir = normalize(vec3(0.0, 1.0, 0.0)); // デフォルトの向き
	vec3 velDir = normalize(vlocityInfo.xyz); // 速度方向
	vec3 crossed = cross(dir, velDir); // ↑2つに直行するベクトル（回転軸）
	crossed = normalize(crossed);
	float cosine = dot(dir, velDir); // 内積でコサインを取り出す
	float rad = acos(cosine); // 2ベクトルのなす角が取れる
	Quaternion qtn = axisAngle(crossed, rad); // クォータニオン生成

	pos = rotate(pos, qtn) + positionInfo.xyz;

	vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

	gl_Position = projectionMatrix * mvPosition;
}