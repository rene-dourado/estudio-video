// Cria a pasta de um vídeo novo com a estrutura padrão e o briefing em branco.
//   npm run novo -- "Reels apartamento 502" [--marca minha-imobiliaria]
// Número = maior existente + 1. Com --marca, copia o kit de dados/marcas/<marca>/ para 2_referencias_estilo/marca/,
// assim o vídeo guarda a identidade como ela era quando foi feito.
import fs from 'node:fs';
import path from 'node:path';
import {RAIZ, MARCAS, PASTAS, PROJETOS, listarProjetos} from './_config.mjs';

const args = process.argv.slice(2);
const iMarca = args.indexOf('--marca');
const marca = iMarca >= 0 ? args.splice(iMarca, 2)[1] : null;
const titulo = args.join(' ').trim();
if (!titulo) {
  console.error('Uso: npm run novo -- "nome do vídeo" [--marca <pasta em dados/marcas>]');
  process.exit(1);
}

const ultimo = Math.max(0, ...listarProjetos().map((n) => Number(n.slice(0, 3))));
const numero = String(ultimo + 1).padStart(3, '0');
const pasta = path.join(PROJETOS, `${numero} - ${titulo.replace(/[<>:"/\\|?*]/g, '-')}`);

// O que cada subpasta recebe. O texto vira um LEIA-ME.txt dentro dela.
const leiame = {
  brutos: 'Material gravado: vídeos, fotos e áudios originais, do jeito que saíram da câmera ou do celular.\nSomente leitura: nada aqui é cortado, convertido ou apagado. Pode soltar tudo; o diretor organiza.',
  estilo: 'Referências de estilo e identidade visual: logos, paleta, fontes, manual da marca, prints ou links\nde vídeos e posts que você gosta (e do que NÃO quer). O estilo do vídeo sai daqui.',
  contexto: 'Referências de contexto: PDFs, plantas, memoriais, tabelas de preço, fichas técnicas, textos, links.\nTodo dado que aparece no vídeo (área, preço, endereço, data) precisa estar aqui. Nada é inventado.',
  audio: 'Áudio: a narração que você gerar (Google AI Studio ou outra ferramenta), música com licença e efeitos.\nO roteiro da narração sai em 6_entregas/REVnn/narracao.md.',
  trabalho: 'Área do diretor: inventário, pranchas, transcrições, quadros de revisão, rascunhos e cópias do código.\nPode apagar tudo daqui sem perder entregas.',
  entregas: 'Entregas por revisão (REV00, REV01...): vídeo final, capa, legenda do post e roteiro de narração.\nNunca sobrescritas: cada mudança vira uma revisão nova.',
};

fs.mkdirSync(pasta, {recursive: true});
for (const [chave, sub] of Object.entries(PASTAS)) {
  fs.mkdirSync(path.join(pasta, sub), {recursive: true});
  fs.writeFileSync(path.join(pasta, sub, 'LEIA-ME.txt'), `${leiame[chave]}\n`);
}

const briefing = fs.readFileSync(path.join(RAIZ, 'modelos', 'briefing.md'), 'utf8').replace('{{titulo}}', titulo).replace('{{numero}}', numero);
fs.writeFileSync(path.join(pasta, 'briefing.md'), briefing);
const sites = fs.readFileSync(path.join(RAIZ, 'modelos', 'sites.md'), 'utf8').replace('{{titulo}}', titulo).replace('{{numero}}', numero);
fs.writeFileSync(path.join(pasta, 'sites.md'), sites);

if (marca) {
  const origem = path.join(MARCAS, marca);
  if (!fs.existsSync(origem)) {
    console.error(`Aviso: marca "${marca}" não encontrada em ${MARCAS}. Siga sem ela ou crie o kit antes.`);
  } else {
    fs.cpSync(origem, path.join(pasta, PASTAS.estilo, 'marca'), {recursive: true});
  }
}

console.log(`Projeto criado: ${pasta}`);
