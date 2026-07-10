uniform float uTime;
uniform float uOpacity;
uniform vec3 uColor;

varying vec2 vUv;

#include <common>
#include <fog_pars_fragment>

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  vec2 uv = vUv;

  // Bruit qui defile vers le haut pour donner l'impression que la fumee monte
  vec2 flow = uv * vec2(3.0, 2.0) + vec2(0.0, -uTime * 0.6);
  float n = fbm(flow);

  // Forme de trainee : fine en largeur, qui se dissipe en haut et en bas
  float widthMask = 1.0 - smoothstep(0.0, 0.5, abs(uv.x - 0.5) + n * 0.15);
  float lengthMask = smoothstep(0.0, 0.15, uv.y) * (1.0 - smoothstep(0.6, 1.0, uv.y));

  float alpha = widthMask * lengthMask * n * uOpacity;

  gl_FragColor = vec4(uColor, alpha);

  #include <fog_fragment>
}
