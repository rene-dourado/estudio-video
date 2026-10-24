import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {useEntrada, useParado} from './entrada';
import {Preencher, type Midia} from './midia';
import {areaLivre} from './zonas-seguras';

// Linguagem de colagem editorial: quadros com borda de papel que entram um a um, etiqueta de papel
// e faixas horizontais empilhadas. Cores e fontes vêm da marca do vídeo.

const PAPEL = '#F2EBDD';
export const MONO = "'Courier New', Courier, monospace";

export type QuadroColagem = {x: number; y: number; w: number; h: number; giro: number};

// Grade de 2 colunas, centrada no quadro de 1080x1920, com as colunas desencontradas (a da direita 30 px abaixo).
export const gradeColagem = (n: number, {largura = 470, altura = 600, alturaQuadro = 1920} = {}): QuadroColagem[] => {
  const linhas = Math.ceil(n / 2);
  const passo = altura + 30;
  const topo = (alturaQuadro - linhas * passo) / 2 - 30;
  return Array.from({length: n}, (_, i) => ({
    x: i % 2 ? 550 : 60, y: topo + Math.floor(i / 2) * passo + (i % 2 ? 30 : 0), w: largura, h: altura, giro: i % 2 ? 1.2 : -1.2,
  }));
};

// Quadros que entram um a um (`intervalo` quadros entre eles) e derivam devagar em sentidos opostos.
// `duracao`: a da <Sequence> que contém a colagem. Na capa, todos aparecem parados.
export const Colagem: React.FC<{
  fotos: Midia[];
  duracao: number;
  fundo: string;
  borda?: string;
  quadros?: QuadroColagem[];
  intervalo?: number;
  deriva?: number;
  filtro?: string;
}> = ({fotos, duracao, fundo, borda = PAPEL, quadros, intervalo = 6, deriva = 14, filtro}) => {
  const frame = useCurrentFrame();
  const parado = useParado();
  const pos = quadros ?? gradeColagem(fotos.length);
  if (pos.length < fotos.length) throw new Error(`A colagem tem ${fotos.length} fotos e só ${pos.length} quadros.`);
  return (
    <AbsoluteFill style={{background: fundo}}>
      {fotos.map((f, i) => {
        const e = parado ? 1 : interpolate(frame - i * intervalo, [0, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
        const d = parado ? 0 : interpolate(frame, [0, Math.max(1, duracao)], [0, i % 2 ? -deriva : deriva]);
        const q = pos[i];
        return (
          <div key={i} style={{position: 'absolute', left: q.x, top: q.y + d, width: q.w, height: q.h, overflow: 'hidden',
            opacity: e, transform: `scale(${0.92 + 0.08 * e}) rotate(${q.giro}deg)`, border: `6px solid ${borda}`, boxShadow: '0 14px 40px rgba(0,0,0,.45)'}}>
            <Preencher midia={f} filtro={filtro} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Etiqueta de papel: texto grande em serifa e, embaixo, um subtítulo de máquina de escrever.
// `texto` aceita nós, para misturar fontes: <>morar <i style={{fontFamily: italico}}>ou</i> investir</>.
export const Etiqueta: React.FC<{
  texto: React.ReactNode;
  apoio?: React.ReactNode;
  topo: number;
  fonte: string;
  fonteApoio?: string;
  tinta: string;
  papel?: string;
  tamanho?: number;
  atraso?: number;
}> = ({texto, apoio, topo, fonte, fonteApoio = MONO, tinta, papel = PAPEL, tamanho = 104, atraso = 8}) => {
  const e = useEntrada(atraso, 14);
  return (
    <div style={{position: 'absolute', top: topo, left: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
      opacity: e, transform: `translateY(${(1 - e) * 30}px) rotate(-1.5deg)`}}>
      <div style={{background: papel, padding: '14px 46px 22px', fontFamily: fonte, fontSize: tamanho, color: tinta,
        boxShadow: '0 10px 30px rgba(0,0,0,.35)', clipPath: 'polygon(1% 4%, 99% 0, 100% 92%, 2% 100%)'}}>{texto}</div>
      {apoio && (
        <div style={{marginTop: 16, background: papel, padding: '8px 26px', fontFamily: fonteApoio, fontSize: tamanho * 0.38, color: tinta,
          boxShadow: '0 6px 20px rgba(0,0,0,.3)', transform: 'rotate(1deg)'}}>{apoio}</div>
      )}
    </div>
  );
};

// Faixas horizontais empilhadas na área livre, cada uma com um conteúdo que entra no quadro `em` (relativo à cena),
// de preferência quando o item é dito. `el` recebe a duração em quadros que a faixa fica na tela.
// Útil para listas de itens curtos (lazer do prédio): planos de menos de 1 s em tela cheia ficam picados.
export const Faixas: React.FC<{
  itens: {el: (duracao: number) => React.ReactNode; rotulo: React.ReactNode; em: number}[];
  duracao: number;
  fundo: string; // HEX de 6 dígitos: também tinge o degradê atrás dos rótulos
  cor: string; // filete do rótulo
  fonte: string;
  corTexto?: string;
  tamanho?: number;
  topo?: number;
  altura?: number;
}> = ({itens, duracao, fundo, cor, fonte, corTexto = '#FFFFFF', tamanho = 50, topo, altura = 1120}) => {
  const frame = useCurrentFrame();
  const parado = useParado();
  const livre = areaLivre('reels');
  const y0 = topo ?? livre.y;
  const h = altura / itens.length;
  return (
    <AbsoluteFill style={{background: fundo}}>
      {itens.map((it, i) => {
        const em = parado ? 0 : it.em;
        const e = parado ? 1 : interpolate(frame - em, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
        const d = Math.max(1, duracao - em);
        return (
          <div key={i} style={{position: 'absolute', top: y0 + i * h, left: 0, width: '100%', height: h - 8, overflow: 'hidden', clipPath: `inset(0 ${(1 - e) * 100}% 0 0)`}}>
            <Sequence from={em} durationInFrames={d} layout="none">{it.el(d)}</Sequence>
            <div style={{position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${fundo}B3, transparent 60%)`}} />
            <div style={{position: 'absolute', left: livre.x + 10, top: h / 2 - tamanho * 0.72, borderLeft: `4px solid ${cor}`, paddingLeft: 20,
              fontFamily: fonte, fontSize: tamanho, color: corTexto, opacity: e}}>{it.rotulo}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
