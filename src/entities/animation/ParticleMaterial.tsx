import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";

const MagicParticleMaterial = shaderMaterial(
  {
    uTime: 0,
    uTexture: null,
    uColor: new THREE.Color(5.0, 3.5, 1.0), // Твій насичений HDR колір
  },
  // Vertex Shader
  `
  varying vec2 vUv;
  varying float vInstanceId;
  void main() {
    vUv = uv;
    vInstanceId = float(gl_InstanceID);
    
    // Передаємо матрицю інстансу
    vec4 instancePosition = instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * instancePosition;
  }
  `,
  // Fragment Shader
  `
  uniform float uTime;
  uniform sampler2D uTexture;
  uniform vec3 uColor;
  varying vec2 vUv;
  varying float vInstanceId;

  void main() {
    vec4 tex = texture2D(uTexture, vUv);
    
    // Додаємо динамічне мерехтіння на основі часу та ID частинки
    float noise = sin(uTime * 5.0 + vInstanceId) * 0.2 + 0.8;
    
    // Створюємо HDR ефект: посилюємо яскравість центру текстури
    vec3 finalColor = uColor * tex.rgb * noise * 2.0;
    
    // М'яка прозорість
    float alpha = tex.a * noise;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
  `
);

extend({ MagicParticleMaterial });

// Типізація для JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      magicParticleMaterial: any;
    }
  }
}