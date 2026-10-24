import React, {useId} from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';

// Sequência de cenas com tempos em segundos (do palavras.json) e transições curtas entre elas.
// Cada cena COMEÇA no instante marcado (o corte cai na palavra); a cena anterior se estende por baixo
// durante os quadros da transição, com a imagem ainda em movimento. Assim a duração total não muda,
// ao contrário do <TransitionSeries>, que encurta o vídeo a cada transição.
//
// Transições (como nos Reels feitos antes do motor):
//   whip   empurra a cena para a esquerda com desfoque de movimento horizontal;
//   slide  a metade de cima da cena nova entra pela direita e a de baixo pela esquerda (casa com <SplitVideo>);
//   zoom   a cena anterior avança e some, a nova chega de um zoom;
//   fade   dissolve;  corte  sem transição (padrão).
// `flash`: clarão branco curto no começo da cena, para marcar uma virada (tela de marca, CTA).
// Atenção: no slide o conteúdo da cena nova é desenhado duas vezes durante a transição; não ponha <Audio> dentro da cena.

export const TRANSICAO = 9; // quadros (0,3 s a 30 fps)

export type TipoTransicao = 'corte' | 'whip' | 'slide' | 'zoom' | 'fade';
export type Transicao = TipoTransicao | {tipo: TipoTransicao; quadros?: number};

export type Cena = {
  de: number; // s
  ate: number; // s
  el: (duracao: number) => React.ReactNode; // recebe a duração em quadros, já com a extensão da transição seguinte
  entrada?: Transicao;
  flash?: boolean;
};

const ler = (t?: Transicao) => {
  const tipo = typeof t === 'string' ? t : t?.tipo ?? 'corte';
  const quadros = tipo === 'corte' ? 0 : typeof t === 'object' && t.quadros ? t.quadros : TRANSICAO;
  return {tipo, quadros};
};

const suave = (p: number) => {
  const x = Math.min(1, Math.max(0, p));
  return x * x * (3 - 2 * x);
};

// Estilo de uma cena em transição. `p` de 0 a 1; `entrando` = cena nova, senão a que sai.
const estilo = (tipo: TipoTransicao, p: number, entrando: boolean, filtro: string): React.CSSProperties => {
  switch (tipo) {
    case 'whip':
      return {transform: `translateX(${(entrando ? 1 - p : -p) * 100}%)`, filter: filtro};
    case 'zoom':
      return entrando ? {transform: `scale(${1.25 - 0.25 * p})`, opacity: p} : {transform: `scale(${1 + 0.35 * p})`};
    case 'fade':
      return entrando ? {opacity: p} : {};
    default:
      return {};
  }
};

const Passagem: React.FC<{
  entrada: {tipo: TipoTransicao; quadros: number};
  saida: {tipo: TipoTransicao; quadros: number};
  duracao: number;
  flash?: boolean;
  children: React.ReactNode;
}> = ({entrada, saida, duracao, flash, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const id = `whip${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const entrandoAgora = entrada.quadros > 0 && frame < entrada.quadros;
  const saindoAgora = saida.quadros > 0 && frame >= duracao - saida.quadros;
  const [tipo, p] = entrandoAgora
    ? [entrada.tipo, suave((frame + 1) / (entrada.quadros + 1))]
    : saindoAgora
      ? [saida.tipo, suave((frame - (duracao - saida.quadros) + 1) / (saida.quadros + 1))]
      : ['corte' as TipoTransicao, 1];
  const desfoque = tipo === 'whip' ? 30 * Math.sin(Math.PI * p) : 0;
  const slide = entrandoAgora && tipo === 'slide';
  const f = flash ? 0.6 * Math.max(0, 1 - frame / (0.2 * fps)) : 0;
  // A árvore é sempre a mesma (só os estilos mudam), para o vídeo da cena não ser remontado no meio.
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={slide
        ? {clipPath: 'inset(0 0 50% 0)', transform: `translateX(${(1 - p) * 100}%)`}
        : estilo(tipo, p, entrandoAgora, `url(#${id})`)}>
        {children}
      </AbsoluteFill>
      {slide && <AbsoluteFill style={{clipPath: 'inset(50% 0 0 0)', transform: `translateX(${-(1 - p) * 100}%)`}}>{children}</AbsoluteFill>}
      {f > 0 && <AbsoluteFill style={{background: '#FFF', opacity: f}} />}
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={id} x="-10%" y="0" width="120%" height="100%"><feGaussianBlur stdDeviation={`${desfoque} 0`} /></filter>
      </svg>
    </AbsoluteFill>
  );
};

// As cenas devem vir em ordem e encostadas (o `ate` de uma é o `de` da seguinte). Cena mais curta que
// as transições que a tocam dá erro cedo: encurte a transição (`{tipo: 'whip', quadros: 6}`) ou junte as cenas.
export const Cenas: React.FC<{cenas: Cena[]; premount?: number}> = ({cenas, premount}) => {
  const {fps} = useVideoConfig();
  const q = (s: number) => Math.round(s * fps);
  return (
    <>
      {cenas.map((c, i) => {
        const entrada = ler(c.entrada);
        const saida = ler(cenas[i + 1]?.entrada);
        const de = q(c.de);
        const base = q(c.ate) - de;
        if (base < entrada.quadros || (i + 1 < cenas.length && q(cenas[i + 1].ate) - q(cenas[i + 1].de) < saida.quadros)) {
          throw new Error(`Cena ${i} (${c.de.toFixed(2)}–${c.ate.toFixed(2)} s) é curta demais para as transições que a tocam.`);
        }
        const duracao = Math.max(1, base + saida.quadros);
        return (
          <Sequence key={i} from={de} durationInFrames={duracao} premountFor={premount ?? fps}>
            <Passagem entrada={entrada} saida={saida} duracao={duracao} flash={c.flash}>{c.el(duracao)}</Passagem>
          </Sequence>
        );
      })}
    </>
  );
};

// Instantes dos cortes (s), para a <LegendaFala cortes={...}> nunca juntar palavras de cenas diferentes.
export const cortesDe = (cenas: Cena[]) => cenas.slice(1).map((c) => c.de);
