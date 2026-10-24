import React, {createContext, useContext} from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

// Animações de entrada das peças do _shared e o modo sem entrada das capas.
// Numa composição (ou <Sequence>) de 1 quadro, toda entrada já começa pronta: sem isso, o texto de uma capa
// fica invisível no quadro 0. Para forçar o modo parado num trecho maior, envolva-o em <SemEntrada>.

const Parado = createContext(false);

export const SemEntrada: React.FC<{children: React.ReactNode}> = ({children}) => <Parado.Provider value>{children}</Parado.Provider>;

// true numa capa (1 quadro) ou dentro de <SemEntrada>.
export const useParado = () => {
  const forcado = useContext(Parado);
  const {durationInFrames} = useVideoConfig();
  return forcado || durationInFrames === 1;
};

// Progresso 0–1 de uma entrada que começa `atraso` quadros depois do início do trecho e dura `quadros`.
export const useEntrada = (atraso = 0, quadros = 12) => {
  const frame = useCurrentFrame();
  const parado = useParado();
  if (parado) return 1;
  return interpolate(frame - atraso, [0, quadros], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
};

// Texto que sobe por trás de uma máscara.
export const Sobe: React.FC<{atraso?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({atraso = 0, children, style}) => {
  const e = useEntrada(atraso);
  return (
    <div style={{overflow: 'hidden', ...style}}>
      <div style={{transform: `translateY(${(1 - e) * 110}%)`, opacity: e}}>{children}</div>
    </div>
  );
};

// Filete que cresce do centro (sob títulos).
export const Filete: React.FC<{cor: string; atraso?: number; largura?: number; espessura?: number; margem?: string}> = ({
  cor, atraso = 6, largura = 160, espessura = 3, margem = '22px auto 0',
}) => {
  const e = useEntrada(atraso, 18);
  return <div style={{width: largura * e, height: espessura, background: cor, margin: margem}} />;
};
