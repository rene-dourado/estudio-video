import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';

// Palavra com tempo, como sai do tools/transcrever.py (palavras.json): w = palavra, s = início, e = fim (s).
// O tools/alinhar.py gera o mesmo formato com o TEXTO do roteiro e acrescenta a = âncora ([nome] no texto)
// e i = true nas palavras que a voz não disse como escrito (tempo interpolado).
export type Palavra = {w: string; s: number; e: number; a?: string; i?: boolean};

// Margem para decidir de que lado de um corte uma palavra cai (a palavra que começa até 50 ms antes do corte
// já pertence à cena seguinte: o corte entra um pouco antes da fala).
const FOLGA_CORTE = 0.05;
const cenaDe = (s: number, cortes: number[]) => cortes.filter((c) => s >= c - FOLGA_CORTE).length;

// Agrupa palavras em blocos de leitura: quebra por pausa longa, pontuação final, limite de caracteres
// e, se houver `cortes` (instantes de troca de cena, em s), sempre que a cena muda.
export const agruparFrases = (palavras: Palavra[], {maxCaracteres = 26, pausa = 0.6, cortes = [] as number[]} = {}) => {
  const blocos: Palavra[][] = [];
  let atual: Palavra[] = [];
  for (const p of palavras) {
    const anterior = atual[atual.length - 1];
    const tamanho = atual.reduce((n, x) => n + x.w.length + 1, 0) + p.w.length;
    const outraCena = anterior && cenaDe(p.s, cortes) !== cenaDe(anterior.s, cortes);
    const quebra = anterior && (outraCena || p.s - anterior.e > pausa || /[.!?…]$/.test(anterior.w) || tamanho > maxCaracteres);
    if (quebra) {
      blocos.push(atual);
      atual = [];
    }
    atual.push(p);
  }
  if (atual.length) blocos.push(atual);
  return blocos;
};

export type EstiloLegenda = {
  fonte: string;
  tamanho?: number;
  peso?: number;
  cor?: string;
  corAtiva?: string;
  fundoAtiva?: string;
  sombra?: string;
  caixaAlta?: boolean;
};

// Legenda da fala sincronizada com o palavras.json.
// modo "palavra": só a palavra falada; "bloco": o bloco inteiro com a palavra falada em destaque.
// Posicione dentro da zona segura (ver zonas-seguras.tsx): `base` é a distância do rodapé do quadro.
// Prefira o texto alinhado ao roteiro (legenda.json do tools/alinhar.py) à transcrição crua: a grafia sai certa.
// `cortes`: instantes de troca de cena (cortesDe(cenas), em transicoes.tsx), no mesmo tempo das palavras.
// Um bloco nunca junta o fim de uma cena com o começo da seguinte e some no corte.
export const LegendaFala: React.FC<{
  palavras: Palavra[];
  estilo: EstiloLegenda;
  modo?: 'palavra' | 'bloco';
  base?: number;
  largura?: number;
  maxCaracteres?: number;
  // Desloca os tempos quando a narração não começa no quadro 0 da composição.
  atraso?: number;
  cortes?: number[];
}> = ({palavras, estilo, modo = 'bloco', base = 480, largura = 900, maxCaracteres = 26, atraso = 0, cortes = []}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps - atraso;
  const blocos = agruparFrases(palavras, {maxCaracteres, cortes});
  const bloco = blocos.find((b) => t >= b[0].s - 0.05 && t <= b[b.length - 1].e + 0.25 && cenaDe(t, cortes) === cenaDe(b[0].s, cortes));
  if (!bloco) return null;
  const ativa = bloco.find((p) => t >= p.s && t <= p.e + 0.08) ?? [...bloco].reverse().find((p) => t >= p.s);
  const visiveis = modo === 'palavra' ? (ativa ? [ativa] : []) : bloco.filter((p) => t >= p.s - 0.05);
  const {tamanho = 72, peso = 800, cor = '#FFFFFF', corAtiva = cor, fundoAtiva = 'transparent', sombra = '0 6px 24px rgba(0,0,0,.55)'} = estilo;

  return (
    <div
      style={{
        position: 'absolute', bottom: base, left: (width - largura) / 2, width: largura,
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `${tamanho * 0.12}px ${tamanho * 0.28}px`,
        fontFamily: estilo.fonte, fontSize: tamanho, fontWeight: peso, lineHeight: 1.15,
        textTransform: estilo.caixaAlta ? 'uppercase' : 'none',
      }}
    >
      {visiveis.map((p) => {
        const entrada = spring({frame: frame - (p.s + atraso) * fps, fps, config: {damping: 18, stiffness: 220}});
        const eAtiva = p === ativa;
        return (
          <span
            key={`${p.s}-${p.w}`}
            style={{
              display: 'inline-block', color: eAtiva ? corAtiva : cor, background: eAtiva ? fundoAtiva : 'transparent',
              padding: `0 ${tamanho * 0.14}px`, borderRadius: tamanho * 0.16, textShadow: eAtiva && fundoAtiva !== 'transparent' ? 'none' : sombra,
              transform: `translateY(${(1 - entrada) * 12}px)`, opacity: Math.min(1, entrada * 1.5),
            }}
          >
            {p.w}
          </span>
        );
      })}
    </div>
  );
};

// Primeiro instante em que uma palavra (ou trecho) é falada, para ancorar cortes e textos.
// Compara sem acento e sem pontuação; lança erro se não achar, para o problema aparecer cedo.
export const quando = (palavras: Palavra[], alvo: string, aPartirDe = 0) => {
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const partes = alvo.split(/\s+/).map(norm);
  for (let i = 0; i < palavras.length; i++) {
    if (palavras[i].s < aPartirDe) continue;
    if (partes.every((p, j) => palavras[i + j] && norm(palavras[i + j].w) === p)) return palavras[i].s;
  }
  throw new Error(`"${alvo}" não aparece na transcrição a partir de ${aPartirDe}s`);
};

// Início da palavra marcada com [nome] no texto do roteiro (legenda.json do tools/alinhar.py).
export const ancora = (palavras: Palavra[], nome: string) => {
  const p = palavras.find((x) => x.a === nome);
  if (!p) throw new Error(`A âncora [${nome}] não está no texto alinhado`);
  return p.s;
};
