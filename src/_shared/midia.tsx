import {Video} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// Peças para vídeos montados a partir de material bruto (clipes e fotos), sem ninguém falando.
// Arquivos sempre relativos à pasta do projeto: '1_brutos/sala.mp4'.

export type Enquadre = {escala?: number; x?: number; y?: number};
const suave = Easing.inOut(Easing.cubic);

const movimento = (frame: number, duracao: number, de: Enquadre, para: Enquadre) => {
  const p = interpolate(frame, [0, Math.max(1, duracao - 1)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: suave});
  const v = (a = 0, b = a) => a + (b - a) * p;
  return `scale(${v(de.escala ?? 1, para.escala ?? de.escala ?? 1)}) translate(${v(de.x, para.x ?? de.x)}px, ${v(de.y, para.y ?? de.y)}px)`;
};

// Foto em tela cheia com movimento lento de câmera (Ken Burns). `duracao` em quadros: a da <Sequence> que a contém.
// foco: ponto da imagem que fica no quadro quando ela é cortada (0–1); ex.: {x: 0.3} para guardar a janela à esquerda.
export const FotoMovimento: React.FC<{
  src: string;
  duracao: number;
  de?: Enquadre;
  para?: Enquadre;
  foco?: {x?: number; y?: number};
  ajuste?: 'cover' | 'contain';
  fundo?: string;
}> = ({src, duracao, de = {escala: 1}, para = {escala: 1.06}, foco = {}, ajuste = 'cover', fundo = '#000'}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: fundo, overflow: 'hidden'}}>
      <Img
        src={staticFile(src)}
        style={{
          width: '100%', height: '100%', objectFit: ajuste,
          objectPosition: `${(foco.x ?? 0.5) * 100}% ${(foco.y ?? 0.5) * 100}%`,
          transform: movimento(frame, duracao, de, para), transformOrigin: 'center',
        }}
      />
    </AbsoluteFill>
  );
};

// Trecho de um clipe bruto: começa em `inicio` segundos do arquivo original e dura o que a <Sequence> durar.
// O original nunca é alterado. `volume` 0 por padrão (som ambiente entra só se o plano pedir).
// `velocidade` < 1 deixa o plano mais lento (bom para clipes de celular curtos e tremidos).
// Usa o <Video> do @remotion/media: o <OffthreadVideo> falhou com playbackRate 0,8 ("No frame found at position").
export const Clipe: React.FC<{
  src: string;
  inicio: number;
  duracao: number;
  de?: Enquadre;
  para?: Enquadre;
  foco?: {x?: number; y?: number};
  volume?: number;
  velocidade?: number;
  filtro?: string;
}> = ({src, inicio, duracao, de = {escala: 1}, para = {escala: 1.04}, foco = {}, volume = 0, velocidade = 1, filtro}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <Video
        src={staticFile(src)}
        trimBefore={Math.round(inicio * fps)}
        playbackRate={velocidade}
        volume={volume}
        muted={volume === 0}
        objectFit="cover"
        style={{
          width: '100%', height: '100%',
          objectPosition: `${(foco.x ?? 0.5) * 100}% ${(foco.y ?? 0.5) * 100}%`,
          transform: movimento(frame, duracao, de, para), transformOrigin: 'center', filter: filtro,
        }}
      />
    </AbsoluteFill>
  );
};

// Segundos → quadros, arredondado. Use para montar a timeline a partir do palavras.json.
export const useQuadros = () => {
  const {fps} = useVideoConfig();
  return (segundos: number) => Math.round(segundos * fps);
};
