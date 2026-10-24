import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {Clipe, Preencher, type Enquadre, type Midia} from './midia';

// Tela dividida na horizontal: duas metades empilhadas e uma linha na cor da marca entre elas.
// O uso principal é o vídeo horizontal (16:9) num Reels: em vez de um único recorte estreito, dois recortes
// do mesmo vídeo (ou de dois vídeos) ocupam as duas metades, cada uma com 1080x960 — quase a altura
// inteira do original, sem ampliar demais.

// Duas metades quaisquer (fotos, clipes, painéis). `divisao`: altura da metade de cima, de 0 a 1.
export const Empilhado: React.FC<{cima: Midia; baixo: Midia; cor: string; espessura?: number; divisao?: number}> = ({
  cima, baixo, cor, espessura = 6, divisao = 0.5,
}) => {
  const {height} = useVideoConfig();
  const corte = Math.round(height * divisao);
  const metade = (top: number, h: number): React.CSSProperties => ({position: 'absolute', left: 0, right: 0, top, height: h, overflow: 'hidden'});
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <div style={metade(0, corte)}><Preencher midia={cima} /></div>
      <div style={metade(corte, height - corte)}><Preencher midia={baixo} /></div>
      <div style={{position: 'absolute', left: 0, right: 0, top: corte - espessura / 2, height: espessura, background: cor}} />
    </AbsoluteFill>
  );
};

// Um recorte de vídeo para uma das metades. `inicio` em segundos do original; `foco` escolhe a parte do
// quadro que fica (x 0 = borda esquerda, y 1 = rodapé, útil para esconder um selo no topo do vídeo);
// `de`/`para` é o movimento lento da metade (escala 1.12 corta mais e ganha nitidez de enquadramento).
export type Recorte = {
  inicio: number;
  src?: string;
  velocidade?: number;
  foco?: {x?: number; y?: number};
  de?: Enquadre;
  para?: Enquadre;
  filtro?: string;
};

// Dois recortes de vídeo empilhados. Por padrão a metade de cima aproxima e a de baixo afasta,
// para as duas não andarem juntas. `src` vale para as duas metades, a menos que o recorte traga o seu.
export const SplitVideo: React.FC<{src: string; cima: Recorte; baixo: Recorte; duracao: number; cor: string; espessura?: number}> = ({
  src, cima, baixo, duracao, cor, espessura,
}) => {
  const metade = (r: Recorte, de: Enquadre, para: Enquadre) => (
    <Clipe src={r.src ?? src} inicio={r.inicio} duracao={duracao} velocidade={r.velocidade} foco={r.foco} de={r.de ?? de} para={r.para ?? para} filtro={r.filtro} />
  );
  return (
    <Empilhado cor={cor} espessura={espessura}
      cima={metade(cima, {escala: 1}, {escala: 1.06})}
      baixo={metade(baixo, {escala: 1.06}, {escala: 1})} />
  );
};
