precision mediump float;

uniform float uTime;
uniform float uOpacity;

// ref: https://qiita.com/keim_at_si/items/c2d1afd6443f3040e900
vec3 hsv2rgb(float h, float s, float v) {
	return ((clamp(abs(fract(h+vec3(0,2,1)/3.)*6.-3.)-1.,0.,1.)-1.)*s+1.)*v;
}

void main() {
	// hsvで周期的に色を変える
	float colorChangeSpeed = 0.001;
	float h = fract(uTime * colorChangeSpeed); 
	vec3 color = hsv2rgb(h, 0.5, 1.0);
	
	gl_FragColor = vec4(color, 1.0);
}