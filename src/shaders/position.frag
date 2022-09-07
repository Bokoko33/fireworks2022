uniform sampler2D uDefaultTexture;
uniform vec3 uOrigin;
uniform vec2 uMouseDelta;
uniform float uPower;

const float dieSpeed = 0.96;

float random (vec2 st) {
	return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main()	{
	vec2 uv = gl_FragCoord.xy / resolution.xy;
	vec4 tmpPos = texture2D(texturePosition, uv);
	vec3 position = tmpPos.xyz;
	vec4 tmpVel = texture2D(textureVelocity, uv);
	vec3 velocity = tmpVel.xyz;

	float life = tmpPos.w;

    // lifeが0.1未満になったとき、デフォルトのテクスチャを参照して
    // 初期位置に戻る
	if (life < 0.1) {
		vec4 defPos = texture2D(uDefaultTexture, uv);
		position = uOrigin + vec3(uMouseDelta, 0.0) * random(uv); // マウス位置の差分をもとにランダムに発生位置をずらす
		// position = uOrigin;
		life = defPos.w + 0.2; // デフォルトのlifeが閾値以下だと固まってしまうので、少し足しておく
		life *= uPower; // powerが小さくなるにつれて噴出させないようにする
	}

	vec3 pos = position + velocity;
	
	gl_FragColor = vec4(pos, life * dieSpeed);
}