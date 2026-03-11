export const vertexShader = `
  precision highp float;
  attribute vec2 aVertexPosition;
  attribute vec4 aColor;
  uniform mat3 projectionMatrix;
  uniform mat3 translationMatrix;
  uniform float uResolution;
  varying vec4 vColor;
  void main() {
    vColor = aColor;
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    gl_PointSize = uResolution;
  }
`;

export const fragmentShader = `
  precision highp float;
  varying vec4 vColor;
  void main() {
    // PixiJS expects premultiplied alpha
    gl_FragColor = vec4(vColor.rgb * vColor.a, vColor.a);
  }
`;
