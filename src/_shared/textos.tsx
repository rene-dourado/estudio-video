import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Sobe, useParado} from './entrada';
import {areaLivre, type Plataforma} from './zonas-seguras';

// Textos e sobreposições comuns aos Reels: rótulo com filete, aviso de rodapé, escurecimento e linhas onduladas.
// As cores e fontes vêm da marca do vídeo (marca.cores, marca.fontes.<nome>.familia); nada aqui presume uma marca.

// Rótulo discreto com filete colorido à esquerda: o nome do ambiente ou do item mostrado.
export const Rotulo: React.FC<{
  texto: React.ReactNode;
  apoio?: React.ReactNode;
  fonte: string;
  fonteApoio?: string;
  cor: string; // filete
  corTexto?: string;
  tamanho?: number;
  topo?: number;
  esquerda?: number;
  largura?: number;
  atraso?: number;
}> = ({texto, apoio, fonte, fonteApoio = fonte, cor, corTexto = '#FFFFFF', tamanho = 50, topo, esquerda, largura, atraso = 0}) => {
  const livre = areaLivre('reels');
  return (
    <div style={{position: 'absolute', top: topo ?? livre.y + 60, left: esquerda ?? livre.x + 10, maxWidth: largura ?? livre.w - 40,
      borderLeft: `4px solid ${cor}`, paddingLeft: 22, color: corTexto, textShadow: '0 3px 18px rgba(0,0,0,.65)'}}>
      <Sobe atraso={atraso}><div style={{fontFamily: fonte, fontSize: tamanho, lineHeight: 1.15}}>{texto}</div></Sobe>
      {apoio && <Sobe atraso={atraso + 5}><div style={{fontFamily: fonteApoio, fontSize: tamanho * 0.8, marginTop: 6, opacity: 0.92}}>{apoio}</div></Sobe>}
    </div>
  );
};

// Linha de rodapé dentro da área livre: "Imagem ilustrativa", créditos de imagens de terceiros.
// Regra do estúdio: render, perspectiva e imagem gerada sempre levam o aviso.
export const Aviso: React.FC<{texto: string; fonte: string; plataforma?: Plataforma; cor?: string; tamanho?: number; topo?: number}> = ({
  texto, fonte, plataforma = 'reels', cor = 'rgba(254,254,254,.88)', tamanho = 28, topo,
}) => {
  const livre = areaLivre(plataforma);
  return (
    <div style={{position: 'absolute', top: topo ?? livre.y + livre.h - 36, left: livre.x, width: livre.w, textAlign: 'center',
      fontFamily: fonte, fontSize: tamanho, color: cor, letterSpacing: 1, textShadow: '0 2px 10px rgba(0,0,0,.7)'}}>
      {texto}
    </div>
  );
};

// Degradê escuro no topo e na base, para o texto ler sobre qualquer imagem. `rgb`: a cor do fundo da marca.
export const Escurecer: React.FC<{topo?: number; base?: number; rgb?: string}> = ({topo = 0.55, base = 0.75, rgb = '13,23,30'}) => (
  <AbsoluteFill style={{background: `linear-gradient(rgba(${rgb},${topo}) 0%, transparent 32%, transparent 58%, rgba(${rgb},${base}) 100%)`}} />
);

// Linhas onduladas que se desenham em `quadros` (abertura e tela final). Na capa já aparecem inteiras.
export const Ondas: React.FC<{cor: string; y: number; linhas?: number; quadros?: number; largura?: number}> = ({cor, y, linhas = 6, quadros = 45, largura = 1080}) => {
  const frame = useCurrentFrame();
  const parado = useParado();
  const p = parado ? 1 : interpolate(frame, [0, quadros], [0, 1], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  return (
    <svg width={largura} height={260} style={{position: 'absolute', top: y, left: 0}} viewBox="0 0 1080 260" preserveAspectRatio="none">
      {Array.from({length: linhas}, (_, i) => (
        <path key={i} d={`M -20 ${150 + i * 14} C 260 ${40 + i * 10}, 520 ${250 - i * 8}, 1100 ${70 + i * 18}`}
          fill="none" stroke={cor} strokeWidth={1.6} strokeOpacity={Math.min(1, 0.35 + i * 0.08)}
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      ))}
    </svg>
  );
};
