import * as THREE from "three";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

// Original color-edge treatment. Unlike the reference's ID/depth/normal pipeline,
// this lightweight pass needs only the existing color buffer and five samples.
export function createIllustrationPass() {
  return new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uResolution: { value: new THREE.Vector2(1280, 720) },
    },
    vertexShader: `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    fragmentShader: `uniform sampler2D tDiffuse;
uniform vec2 uResolution;
varying vec2 vUv;
vec3 compressed(vec3 color) { return color / (vec3(1.0) + color); }
void main() {
  vec2 pixel = 1.15 / max(uResolution, vec2(1.0));
  vec3 color = texture2D(tDiffuse, vUv).rgb;
  vec3 north = compressed(texture2D(tDiffuse, vUv + vec2(0.0, pixel.y)).rgb);
  vec3 south = compressed(texture2D(tDiffuse, vUv - vec2(0.0, pixel.y)).rgb);
  vec3 east = compressed(texture2D(tDiffuse, vUv + vec2(pixel.x, 0.0)).rgb);
  vec3 west = compressed(texture2D(tDiffuse, vUv - vec2(pixel.x, 0.0)).rgb);
  float difference = length(north - south) + length(east - west);
  float ink = smoothstep(0.12, 0.52, difference) * 0.65;
  vec3 paperColor = color * vec3(1.015, 1.0, 0.97);
  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  vec3 illustrated = mix(paperColor, vec3(0.035, 0.065, 0.068), ink);
  gl_FragColor = vec4(max(illustrated + grain * 0.008, vec3(0.0)), 1.0);
}`,
  });
}
