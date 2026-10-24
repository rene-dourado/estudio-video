import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {useParado} from './entrada';
import {Preencher, type Midia} from './midia';
import {areaLivre} from './zonas-seguras';

// Antes e depois: uma cortina colorida varre a imagem de antes e revela a de depois, com o mesmo enquadramento
// e o mesmo zoom (as duas precisam ter o mesmo ponto de vista; renders de decoração feitos sobre a foto real).
// Regra do estúdio: o "depois" gerado leva <Aviso texto="Imagem ilustrativa · decoração sugerida" />, sem citar IA.
//
// sentido "direita": o depois entra pela esquerda e a cortina anda para a direita; "esquerda": o contrário.
// `progresso` fixa a posição da cortina (0–1), por exemplo 0.5 na capa: a imagem fica dividida ao meio e
// os dois rótulos aparecem, cada um na sua metade. Sem ele, a cortina anda entre os quadros de `varredura`
// e o rótulo do canto troca de "antes" para "depois".
// `children` entra por cima das imagens e por baixo dos rótulos (ex.: <Escurecer />).

export const Cortina: React.FC<{
  antes: Midia;
  depois: Midia;
  duracao: number;
  cor: string;
  sentido?: 'direita' | 'esquerda';
  varredura?: [number, number];
  progresso?: number;
  zoom?: [number, number];
  filtroAntes?: string;
  espessura?: number;
  rotulos?: {antes: React.ReactNode; depois: React.ReactNode};
  estiloRotulo?: React.CSSProperties;
  topoRotulo?: number;
  children?: React.ReactNode;
}> = ({
  antes, depois, duracao, cor, sentido = 'direita', varredura, progresso, zoom = [1, 1.04], filtroAntes, espessura = 6,
  rotulos, estiloRotulo, topoRotulo, children,
}) => {
  const frame = useCurrentFrame();
  const parado = useParado();
  const livre = areaLivre('reels');
  const [v0, v1] = varredura ?? [8, Math.max(9, Math.min(duracao - 10, 34))];
  const fixo = progresso !== undefined || parado;
  const p = 100 * (progresso ?? (parado ? 0.5 : interpolate(frame, [v0, v1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)})));
  const z = parado ? zoom[0] : interpolate(frame, [0, Math.max(1, duracao)], zoom);
  // posição da linha a partir da esquerda, em %
  const linha = sentido === 'direita' ? p : 100 - p;
  const recorte = sentido === 'direita' ? `inset(0 ${100 - p}% 0 0)` : `inset(0 0 0 ${100 - p}%)`;
  const camada: React.CSSProperties = {position: 'absolute', inset: 0, transform: `scale(${z})`};
  const rotulo: React.CSSProperties = {
    position: 'absolute', top: topoRotulo ?? livre.y + 20, fontSize: 36, padding: '6px 18px', textTransform: 'uppercase', letterSpacing: 2,
    background: '#F2EBDD', color: '#111', ...estiloRotulo,
  };
  // lado em que fica cada imagem quando a cortina está parada no meio
  const ladoDepois = sentido === 'direita' ? 'esquerda' : 'direita';
  const metade = (lado: 'esquerda' | 'direita'): React.CSSProperties =>
    lado === 'esquerda' ? {left: livre.x + 10} : {left: `${linha}%`, marginLeft: 40};
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <div style={camada}><Preencher midia={antes} filtro={filtroAntes} /></div>
      <div style={{...camada, clipPath: recorte}}><Preencher midia={depois} /></div>
      <div style={{position: 'absolute', top: 0, bottom: 0, left: `${linha}%`, width: espessura, marginLeft: -espessura / 2, background: cor,
        boxShadow: `0 0 24px ${cor}`, opacity: p > 0 && p < 100 ? 1 : 0}} />
      {children}
      {rotulos && fixo && (
        <>
          <div style={{...rotulo, ...metade(ladoDepois === 'esquerda' ? 'direita' : 'esquerda')}}>{rotulos.antes}</div>
          <div style={{...rotulo, ...metade(ladoDepois)}}>{rotulos.depois}</div>
        </>
      )}
      {rotulos && !fixo && (
        <>
          {/* troca rápida no meio da varredura: os dois rótulos nunca aparecem sobrepostos */}
          <div style={{...rotulo, left: livre.x + 10, opacity: interpolate(p, [35, 45], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>{rotulos.antes}</div>
          <div style={{...rotulo, left: livre.x + 10, opacity: interpolate(p, [55, 65], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>{rotulos.depois}</div>
        </>
      )}
    </AbsoluteFill>
  );
};
