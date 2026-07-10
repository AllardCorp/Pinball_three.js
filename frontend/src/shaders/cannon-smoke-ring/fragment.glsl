uniform float uElapsed;
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
  // Coordonnees centrees sur le plane, -0.5..0.5
  vec2 p = vUv - 0.5;
  float d = length(p);

  // L'anneau s'agrandit rapidement puis continue de deriver lentement vers l'exterieur
  float expand = clamp(uElapsed / 0.6, 0.0, 1.0);
  float eased = 1.0 - pow(1.0 - expand, 3.0);
  float radius = 0.08 + eased * 0.35 + uElapsed * 0.05;
  float thickness = 0.03 + eased * 0.12;

  float band = 1.0 - smoothstep(0.0, thickness, abs(d - radius));

  // Turbulence pour un aspect fumee sur la bande de l'anneau
  float angle = atan(p.y, p.x);
  vec2 flow = vec2(angle * 2.0, d * 4.0) + vec2(0.0, -uElapsed * 0.4);
  float n = fbm(flow);
  band *= 0.5 + 0.5 * n;

  float alpha = band * uOpacity;

  gl_FragColor = vec4(uColor, alpha);

  #include <fog_fragment>
}
