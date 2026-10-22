import React from 'react';
import {AbsoluteFill, Composition, Easing, Sequence, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {LegendaFala, type Palavra} from '../../_shared/legendas';
import {GuiaZonas} from '../../_shared/zonas-seguras';

// Exemplo mínimo de um vídeo do estúdio, sem nenhum arquivo externo: três cenas, título por cena,
// legenda sincronizada e guia de zonas seguras. Um vídeo real troca os painéis por <Clipe>/<FotoMovimento>
// (src/_shared/midia.tsx), lê o palavras.json da narração e o kit de marca (src/_shared/marca.ts).
// Cada pasta src/videos/<NNN-slug>/ exporta `Composicoes`; o scripts/estudio.mjs registra todas.

const FPS = 30;
const COR = {fundo: '#14181C', texto: '#FFFFFF', destaque: '#E0B04A'};
const FONTE = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

const palavras: Palavra[] = [
  {w: 'Cada', s: 0.4, e: 0.7}, {w: 'vídeo', s: 0.7, e: 1.1}, {w: 'nasce', s: 1.1, e: 1.5}, {w: 'de', s: 1.5, e: 1.6},
  {w: 'um', s: 1.6, e: 1.75}, {w: 'briefing.', s: 1.75, e: 2.4},
  {w: 'O', s: 3.2, e: 3.3}, {w: 'estilo', s: 3.3, e: 3.7}, {w: 'vem', s: 3.7, e: 3.9}, {w: 'da', s: 3.9, e: 4.0},
  {w: 'sua', s: 4.0, e: 4.2}, {w: 'marca.', s: 4.2, e: 4.8},
  {w: 'O', s: 5.6, e: 5.7}, {w: 'resto', s: 5.7, e: 6.0}, {w: 'o', s: 6.0, e: 6.1}, {w: 'diretor', s: 6.1, e: 6.6},
  {w: 'conduz.', s: 6.6, e: 7.3},
];

const cenas = [
  {de: 0, ate: 3, titulo: 'Briefing', tom: '#24303A'},
  {de: 3, ate: 5.5, titulo: 'Identidade', tom: '#2E2A22'},
  {de: 5.5, ate: 8, titulo: 'Direção', tom: '#1F2B26'},
];

const Painel: React.FC<{titulo: string; tom: string; duracao: number}> = ({titulo, tom, duracao}) => {
  const frame = useCurrentFrame();
  const entrada = interpolate(frame, [0, 18], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const zoom = interpolate(frame, [0, duracao], [1, 1.06]);
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 35%, ${tom}, ${COR.fundo})`, transform: `scale(${zoom})`}}>
      <div style={{position: 'absolute', top: 360, width: '100%', textAlign: 'center', fontFamily: FONTE, opacity: entrada,
        transform: `translateY(${(1 - entrada) * 30}px)`}}>
        <div style={{color: COR.destaque, fontSize: 34, letterSpacing: 8, textTransform: 'uppercase'}}>Estúdio de vídeo</div>
        <div style={{color: COR.texto, fontSize: 120, fontWeight: 300, marginTop: 20}}>{titulo}</div>
        <div style={{width: 140 * entrada, height: 3, background: COR.destaque, margin: '34px auto 0'}} />
      </div>
    </AbsoluteFill>
  );
};

const ReelsExemplo: React.FC<{guiaZonas: boolean}> = ({guiaZonas}) => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: COR.fundo}}>
      {cenas.map((c) => {
        const duracao = Math.round((c.ate - c.de) * fps);
        return (
          <Sequence key={c.titulo} from={Math.round(c.de * fps)} durationInFrames={duracao} premountFor={fps}>
            <Painel titulo={c.titulo} tom={c.tom} duracao={duracao} />
          </Sequence>
        );
      })}
      <LegendaFala palavras={palavras} estilo={{fonte: FONTE, tamanho: 70, cor: COR.texto, corAtiva: COR.destaque}} />
      <GuiaZonas plataforma="reels" mostrar={guiaZonas} />
    </AbsoluteFill>
  );
};

export const Composicoes: React.FC = () => (
  <Composition id="ReelsExemplo" component={ReelsExemplo} width={1080} height={1920} fps={FPS} durationInFrames={8 * FPS}
    defaultProps={{guiaZonas: false}} />
);
