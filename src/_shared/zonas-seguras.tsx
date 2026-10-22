import React from 'react';
import {AbsoluteFill} from 'remotion';

// Margens que a interface de cada plataforma cobre (nome do perfil, legenda, botões), em pixels do quadro.
// Valores conservadores, conferidos nos projetos anteriores: texto e logo ficam dentro do retângulo livre.
export const ZONAS = {
  reels: {w: 1080, h: 1920, topo: 250, base: 420, esquerda: 60, direita: 160},
  stories: {w: 1080, h: 1920, topo: 250, base: 340, esquerda: 60, direita: 60},
  feed45: {w: 1080, h: 1350, topo: 60, base: 60, esquerda: 60, direita: 60},
  quadrado: {w: 1080, h: 1080, topo: 60, base: 60, esquerda: 60, direita: 60},
  youtube: {w: 1920, h: 1080, topo: 60, base: 120, esquerda: 90, direita: 90},
  shorts: {w: 1080, h: 1920, topo: 240, base: 480, esquerda: 60, direita: 160},
} as const;

export type Plataforma = keyof typeof ZONAS;

// Retângulo livre (x, y, w, h) da plataforma.
export const areaLivre = (p: Plataforma) => {
  const z = ZONAS[p];
  return {x: z.esquerda, y: z.topo, w: z.w - z.esquerda - z.direita, h: z.h - z.topo - z.base};
};

// Sobreposição para conferir stills: faixas vermelhas onde a interface cobre. Nunca entra no render final
// (passe mostrar={false} ou deixe a prop guiaZonas da composição desligada).
export const GuiaZonas: React.FC<{plataforma: Plataforma; mostrar?: boolean}> = ({plataforma, mostrar = true}) => {
  if (!mostrar) return null;
  const z = ZONAS[plataforma];
  const faixa = {position: 'absolute', background: 'rgba(255,0,60,.28)'} as const;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{...faixa, left: 0, right: 0, top: 0, height: z.topo}} />
      <div style={{...faixa, left: 0, right: 0, bottom: 0, height: z.base}} />
      <div style={{...faixa, left: 0, top: z.topo, bottom: z.base, width: z.esquerda}} />
      <div style={{...faixa, right: 0, top: z.topo, bottom: z.base, width: z.direita}} />
    </AbsoluteFill>
  );
};
