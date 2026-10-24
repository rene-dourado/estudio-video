import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Cortina} from '../../_shared/antes-depois';
import {Colagem, Etiqueta, Faixas} from '../../_shared/colagem';
import {LegendaFala, ancora, type Palavra} from '../../_shared/legendas';
import {Empilhado} from '../../_shared/split';
import {Cenas, cortesDe, type Cena} from '../../_shared/transicoes';
import {Aviso, Escurecer, Ondas, Rotulo} from '../../_shared/textos';
import {GuiaZonas, areaLivre} from '../../_shared/zonas-seguras';

// Vitrine das peças de montagem do _shared, sem nenhum arquivo externo: painéis em degradê fazem o papel
// das fotos e dos clipes. Num vídeo real, troque cada painel por um caminho de foto ('1_brutos/sala.jpg'),
// um <Clipe> ou um <SplitVideo> (src/_shared/split.tsx), e as palavras pelo legenda.json do `alinhar`.
//
// Cenas com transições (transicoes.tsx) · tela dividida (split.tsx) · antes e depois (antes-depois.tsx)
// · colagem, etiqueta e faixas (colagem.tsx) · rótulo, aviso e ondas (textos.tsx) · legenda que respeita
// os cortes (legendas.tsx). A capa reaproveita as mesmas peças: numa composição de 1 quadro elas aparecem
// prontas, sem animação de entrada (entrada.tsx).

const COR = {fundo: '#14181C', texto: '#FFFFFF', destaque: '#E0B04A', papel: '#F2EBDD'};
const FONTE = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const SERIFA = "Georgia, 'Times New Roman', serif";
const livre = areaLivre('reels');

// Painel que faz o papel de uma foto ou de um clipe.
const Painel: React.FC<{nome: string; de: string; para: string}> = ({nome, de, para}) => (
  <AbsoluteFill style={{background: `linear-gradient(135deg, ${de}, ${para})`, alignItems: 'center', justifyContent: 'center'}}>
    <div style={{fontFamily: FONTE, fontSize: 64, color: 'rgba(255,255,255,.55)', letterSpacing: 6, textTransform: 'uppercase'}}>{nome}</div>
  </AbsoluteFill>
);

// Formato do legenda.json do `npm run estudio -- NNN alinhar`: o texto do roteiro, com [âncoras] em `a`.
const palavras: Palavra[] = [
  {w: 'Dois', s: 0.3, e: 0.6, a: 'split'}, {w: 'recortes', s: 0.6, e: 1.1}, {w: 'de', s: 1.1, e: 1.2}, {w: 'um', s: 1.2, e: 1.35},
  {w: 'vídeo', s: 1.35, e: 1.7}, {w: 'horizontal.', s: 1.7, e: 2.3},
  {w: 'Antes', s: 2.6, e: 2.95, a: 'cortina'}, {w: 'e', s: 2.95, e: 3.05}, {w: 'depois', s: 3.05, e: 3.5}, {w: 'com', s: 3.5, e: 3.65},
  {w: 'a', s: 3.65, e: 3.7}, {w: 'mesma', s: 3.7, e: 4.0}, {w: 'vista.', s: 4.0, e: 4.6},
  {w: 'Colagem', s: 5.1, e: 5.6, a: 'colagem'}, {w: 'editorial', s: 5.6, e: 6.1}, {w: 'de', s: 6.1, e: 6.2}, {w: 'quatro', s: 6.2, e: 6.5},
  {w: 'quadros.', s: 6.5, e: 7.1},
  {w: 'E', s: 7.6, e: 7.7, a: 'faixas'}, {w: 'faixas', s: 7.7, e: 8.1}, {w: 'para', s: 8.1, e: 8.25}, {w: 'a', s: 8.25, e: 8.3},
  {w: 'piscina,', s: 8.3, e: 8.8, a: 'piscina'}, {w: 'o', s: 8.9, e: 9.0}, {w: 'fitness', s: 9.0, e: 9.4, a: 'fitness'}, {w: 'e', s: 9.4, e: 9.5},
  {w: 'o', s: 9.5, e: 9.6}, {w: 'gourmet.', s: 9.6, e: 10.2, a: 'gourmet'},
];
const FIM = 11;

const q = (s: number) => Math.round(s * 30);

export const PecasExemplo: React.FC<{guiaZonas: boolean}> = ({guiaZonas}) => {
  const t = (nome: string) => ancora(palavras, nome);
  const cenas: Cena[] = [
    {de: 0, ate: t('cortina'), el: () => (
      <>
        <Empilhado cor={COR.destaque}
          cima={<Painel nome="recorte 1" de="#2B4B5E" para="#162630" />}
          baixo={<Painel nome="recorte 2" de="#5E4A2B" para="#30251A" />} />
        <Rotulo texto="Tela dividida" apoio="SplitVideo / Empilhado" fonte={FONTE} cor={COR.destaque} />
      </>
    )},
    {de: t('cortina'), ate: t('colagem'), entrada: 'whip', el: (d) => (
      <Cortina duracao={d} cor={COR.destaque} rotulos={{antes: 'antes', depois: 'depois'}} estiloRotulo={{fontFamily: FONTE}}
        antes={<Painel nome="foto real" de="#55595C" para="#2E3133" />}
        depois={<Painel nome="decorado" de="#B07A3C" para="#5B3A22" />}>
        <Escurecer topo={0.35} base={0.55} />
        <Aviso texto="Imagem ilustrativa · decoração sugerida" fonte={FONTE} />
      </Cortina>
    )},
    {de: t('colagem'), ate: t('faixas'), entrada: 'slide', el: (d) => (
      <>
        <Colagem duracao={d} fundo={COR.fundo} borda={COR.papel} fotos={[
          <Painel key={1} nome="1" de="#3D5A6C" para="#1E2E38" />, <Painel key={2} nome="2" de="#6C5A3D" para="#382E1E" />,
          <Painel key={3} nome="3" de="#4A6C3D" para="#25381E" />, <Painel key={4} nome="4" de="#6C3D4A" para="#381E25" />,
        ]} />
        <Etiqueta topo={800} fonte={SERIFA} tinta={COR.fundo} texto={<>colagem <i>e</i> etiqueta</>} apoio="papel e máquina de escrever" />
      </>
    )},
    {de: t('faixas'), ate: FIM, entrada: 'zoom', flash: true, el: (d) => (
      <Faixas duracao={d} fundo={COR.fundo} cor={COR.destaque} fonte={FONTE} itens={[
        {rotulo: 'Piscina', em: q(t('piscina') - t('faixas')), el: () => <Painel nome="" de="#2B6C8A" para="#123445" />},
        {rotulo: 'Fitness', em: q(t('fitness') - t('faixas')), el: () => <Painel nome="" de="#5A5A5A" para="#2A2A2A" />},
        {rotulo: 'Espaço gourmet', em: q(t('gourmet') - t('faixas')), el: () => <Painel nome="" de="#8A5A2B" para="#452D15" />},
      ]} />
    )},
  ];
  return (
    <AbsoluteFill style={{background: COR.fundo}}>
      <Cenas cenas={cenas} />
      <LegendaFala palavras={palavras} cortes={cortesDe(cenas)} base={1920 - livre.y - livre.h + 80} maxCaracteres={24}
        estilo={{fonte: FONTE, tamanho: 56, cor: COR.texto, corAtiva: COR.destaque}} />
      <GuiaZonas plataforma="reels" mostrar={guiaZonas} />
    </AbsoluteFill>
  );
};

export const PECAS_DURACAO = FIM;

// Capa de 1 quadro com as mesmas peças: Cortina parada no meio (os dois rótulos aparecem), etiqueta e ondas
// já prontas. Nenhuma prop especial: a composição de 1 quadro desliga as entradas.
export const CapaExemplo: React.FC = () => (
  <AbsoluteFill style={{background: COR.fundo}}>
    <Cortina duracao={1} cor={COR.destaque} sentido="esquerda" progresso={0.5} topoRotulo={1060}
      rotulos={{antes: 'antes', depois: 'depois'}} estiloRotulo={{fontFamily: FONTE}}
      antes={<Painel nome="" de="#55595C" para="#2E3133" />} depois={<Painel nome="" de="#B07A3C" para="#5B3A22" />}>
      <Escurecer topo={0.85} base={0.8} />
    </Cortina>
    <Ondas cor={COR.destaque} y={livre.y + 260} />
    <Etiqueta topo={livre.y + 40} fonte={SERIFA} tinta={COR.fundo} texto={<>antes <i>e</i> depois</>} apoio="capa sem animação" />
    <Aviso texto="Direita: decoração sugerida · imagem ilustrativa" fonte={FONTE} />
  </AbsoluteFill>
);
