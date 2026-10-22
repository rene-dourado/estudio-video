import {loadFont} from '@remotion/fonts';
import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';

// Kit de identidade visual de um projeto: 2_referencias_estilo/marca/marca.json (modelo em modelos/marca-exemplo/).
// Caminhos de fontes e logos são relativos à pasta do kit.
export type FonteMarca = {familia: string; arquivo?: string; peso?: number};
export type Marca = {
  nome: string;
  tom_de_voz?: string;
  cores: Record<string, string> & {fundo: string; texto: string; destaque: string};
  fontes: Record<string, FonteMarca> & {titulo: FonteMarca; texto: FonteMarca};
  logos?: Record<string, string>;
  contatos?: Record<string, string>;
  assinatura?: string[];
  avisos?: string[];
};

export const PASTA_MARCA = '2_referencias_estilo/marca';

// Lê um JSON da pasta pública (a pasta do projeto) segurando o render até chegar.
export const useJson = <T,>(arquivo: string): T | null => {
  const [dado, setDado] = useState<T | null>(null);
  const [espera] = useState(() => delayRender(`lendo ${arquivo}`));
  useEffect(() => {
    fetch(staticFile(arquivo))
      .then((r) => {
        if (!r.ok) throw new Error(`${arquivo}: HTTP ${r.status}`);
        return r.json();
      })
      .then((j: T) => {
        setDado(j);
        continueRender(espera);
      })
      .catch((e) => cancelRender(e));
  }, [arquivo, espera]);
  return dado;
};

// Carrega o marca.json e registra as fontes do kit. Use a família pelo nome: marca.fontes.titulo.familia.
export const useMarca = (pasta = PASTA_MARCA): Marca | null => {
  const marca = useJson<Marca>(`${pasta}/marca.json`);
  const [pronto, setPronto] = useState(false);
  const [espera] = useState(() => delayRender('fontes da marca'));
  useEffect(() => {
    if (!marca) return;
    const comArquivo = Object.values(marca.fontes).filter((f) => f.arquivo);
    Promise.all(
      comArquivo.map((f) => loadFont({family: f.familia, url: staticFile(`${pasta}/${f.arquivo}`), weight: String(f.peso ?? 400)})),
    )
      .then(() => {
        setPronto(true);
        continueRender(espera);
      })
      .catch((e) => cancelRender(e));
  }, [marca, pasta, espera]);
  return pronto ? marca : null;
};

export const arquivoMarca = (relativo: string, pasta = PASTA_MARCA) => staticFile(`${pasta}/${relativo}`);
