import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {AbsoluteFill, Easing, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FotoMovimento, type Enquadre} from './midia';

// Foto com movimento de câmera em 3D (parallax 2.5D): o que está perto se desloca mais que o fundo, e a câmera
// parece andar dentro da foto. Precisa do mapa de profundidade gerado antes pelo comando
//   npm run estudio -- <NNN> profundidade "1_brutos/sala.jpg"
// que grava 5_trabalho/midia/profundidade/1_brutos/sala.png. Sem o mapa, ou sem WebGL, cai para a <FotoMovimento>
// com o mesmo enquadramento, e o vídeo não quebra.
//
// Funciona melhor em fotos com janela e vista ou com móveis à frente da parede; em unidade vazia e foto aérea o
// efeito fica fraco (teste de 26/10/2026). `intensidade` é o deslocamento máximo em fração da largura da foto:
// 0,035 é o padrão testado; acima de ~0,05 os contornos de objetos próximos começam a esticar.
// A escala sobe sozinha o mínimo necessário para a borda da foto nunca aparecer.

const suave = Easing.inOut(Easing.cubic);

const mapaPadrao = (src: string) => `5_trabalho/midia/profundidade/${src.replace(/\.[^./]+$/, '')}.png`;

const VERTICE = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

// Para cada pixel da tela: desfaz a escala/translação (como o CSS da FotoMovimento) e o recorte "cover",
// lê a profundidade nesse ponto e busca a cor deslocada em proporção a ela.
const FRAGMENTO = `
precision highp float;
uniform sampler2D foto, mapa;
uniform vec2 tela, foto_px, origem, desloc, translacao;
uniform float k, escala;
void main() {
  vec2 q = vec2(gl_FragCoord.x, tela.y - gl_FragCoord.y);
  vec2 p = tela * 0.5 + (q - tela * 0.5) / escala - translacao;
  vec2 uv = (p - origem) / k / foto_px;
  float d = texture2D(mapa, uv).r;
  gl_FragColor = texture2D(foto, clamp(uv - desloc * d, 0.0, 1.0));
}`;

type Gl = {gl: WebGLRenderingContext; u: (nome: string) => WebGLUniformLocation | null};

const carregar = (src: string) =>
  new Promise<HTMLImageElement>((ok, erro) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => erro(new Error(`não carregou ${src}`));
    img.src = staticFile(src);
  });

const textura = (gl: WebGLRenderingContext, img: HTMLImageElement, unidade: number) => {
  gl.activeTexture(gl.TEXTURE0 + unidade);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  for (const [p, v] of [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE],
    [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]]) gl.texParameteri(gl.TEXTURE_2D, p, v);
};

const iniciar = (canvas: HTMLCanvasElement, foto: HTMLImageElement, mapa: HTMLImageElement): Gl | null => {
  const gl = canvas.getContext('webgl', {preserveDrawingBuffer: true, premultipliedAlpha: false});
  if (!gl) return null;
  const max = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  if (Math.max(foto.naturalWidth, foto.naturalHeight) > max) return null;
  const prog = gl.createProgram()!;
  for (const [tipo, codigo] of [[gl.VERTEX_SHADER, VERTICE], [gl.FRAGMENT_SHADER, FRAGMENTO]] as const) {
    const s = gl.createShader(tipo)!;
    gl.shaderSource(s, codigo);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    gl.attachShader(prog, s);
  }
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const p = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(p);
  gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
  textura(gl, foto, 0);
  textura(gl, mapa, 1);
  const u = (nome: string) => gl.getUniformLocation(prog, nome);
  gl.uniform1i(u('foto'), 0);
  gl.uniform1i(u('mapa'), 1);
  return {gl, u};
};

// `duracao` em quadros: a da <Sequence> que a contém. `direcao`: para onde a câmera anda ({x: 1} = da esquerda
// para a direita; y positivo = de cima para baixo). `de`/`para` e `foco` funcionam como na <FotoMovimento>.
export const Foto3D: React.FC<{
  src: string;
  duracao: number;
  intensidade?: number;
  direcao?: {x?: number; y?: number};
  de?: Enquadre;
  para?: Enquadre;
  foco?: {x?: number; y?: number};
  mapa?: string;
  fundo?: string;
}> = ({src, duracao, intensidade = 0.035, direcao = {x: 1, y: 0.2}, de = {escala: 1}, para = {escala: 1.04}, foco = {}, mapa, fundo = '#000'}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [imagens, setImagens] = useState<{foto: HTMLImageElement; mapa: HTMLImageElement} | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [espera] = useState(() => delayRender(`Foto3D ${src}`));
  const gl = useRef<Gl | null>(null);

  useEffect(() => {
    Promise.all([carregar(src), carregar(mapa ?? mapaPadrao(src))])
      .then(([f, m]) => setImagens({foto: f, mapa: m}))
      .catch((e) => {
        console.warn(`Foto3D: ${e.message}. Usando a FotoMovimento (rode o comando profundidade).`);
        setFalhou(true);
        continueRender(espera);
      });
  }, [src, mapa, espera]);

  useLayoutEffect(() => {
    if (!imagens || !canvas.current || falhou) return;
    if (!gl.current) gl.current = iniciar(canvas.current, imagens.foto, imagens.mapa);
    if (!gl.current) {
      console.warn('Foto3D: WebGL indisponível. Usando a FotoMovimento.');
      setFalhou(true);
      continueRender(espera);
      return;
    }
    const {gl: g, u} = gl.current;
    const iw = imagens.foto.naturalWidth;
    const ih = imagens.foto.naturalHeight;
    const k = Math.max(width / iw, height / ih);
    const t = interpolate(frame, [0, Math.max(1, duracao - 1)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: suave});
    const v = (a = 0, b = a) => a + (b - a) * t;
    const dx = intensidade * (direcao.x ?? 0);
    const dy = intensidade * (direcao.y ?? 0) * (iw / ih);
    // Escala mínima para o deslocamento não puxar pixels de fora da foto.
    const minimo = Math.max(width / (iw * k) / (1 - 2 * Math.abs(dx)), height / (ih * k) / (1 - 2 * Math.abs(dy)));
    const escala = Math.max(minimo, v(de.escala ?? 1, para.escala ?? de.escala ?? 1));
    const a = t * 2 - 1;
    g.viewport(0, 0, width, height);
    g.uniform2f(u('tela'), width, height);
    g.uniform2f(u('foto_px'), iw, ih);
    g.uniform2f(u('origem'), (width - iw * k) * (foco.x ?? 0.5), (height - ih * k) * (foco.y ?? 0.5));
    g.uniform2f(u('translacao'), v(de.x, para.x ?? de.x), v(de.y, para.y ?? de.y));
    g.uniform2f(u('desloc'), a * dx, a * dy);
    g.uniform1f(u('k'), k);
    g.uniform1f(u('escala'), escala);
    g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
    continueRender(espera);
  }, [imagens, falhou, frame, duracao, width, height, intensidade, direcao.x, direcao.y, de, para, foco.x, foco.y, espera]);

  if (falhou) return <FotoMovimento src={src} duracao={duracao} de={de} para={para} foco={foco} fundo={fundo} />;
  return (
    <AbsoluteFill style={{background: fundo}}>
      <canvas ref={canvas} width={width} height={height} style={{width: '100%', height: '100%'}} />
    </AbsoluteFill>
  );
};
