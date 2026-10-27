// Ponto único de comando do estúdio. Resolve a pasta do projeto pelo número e chama o Remotion
// ou as ferramentas de tools/ com os caminhos certos.
//
//   npm run estudio -- projetos                         lista os projetos de vídeo
//   npm run estudio -- 001 caminho                      mostra a pasta do projeto 001
//   npm run estudio -- 001 sondar                       inventário e pranchas do material bruto
//   npm run estudio -- 001 proxy "1_brutos/IMG_0423.MOV"   cópia H.264 SDR com fps constante em 5_trabalho/midia/
//   npm run estudio -- 001 lento "1_brutos/IMG_0423.MOV" --inicio 12.5 --duracao 3 [--fator 2]
//                                                       câmera lenta com quadros do RIFE em 5_trabalho/midia/
//   npm run estudio -- 001 profundidade "1_brutos/sala.jpg" ["1_brutos/fotos"] [--refazer]
//                                                       mapa de profundidade em 5_trabalho/midia/profundidade/ (peça <Foto3D>)
//   npm run estudio -- 001 transcrever "4_audio/narracao.wav" [--prompt "Café Aurora, cold brew"]
//   npm run estudio -- 001 alinhar "5_trabalho/legenda.txt" "5_trabalho/transcricao/narracao/palavras.json" [--alias "orora=aurora"]
//                                                       texto do roteiro com os tempos da voz (legenda.json + relatório)
//   npm run estudio -- 001 studio                       pré-visualização no navegador
//   npm run estudio -- 001 still <Composicao> <quadro> [--guia]   quadro parado em 5_trabalho/stills/ (--guia: zonas seguras)
//   npm run estudio -- 001 rascunho <Composicao>        render rápido, meia resolução, em 5_trabalho/rascunhos/
//   npm run estudio -- 001 capa <Composicao> REV00 [quadro]   capa em JPG em 6_entregas/REV00/ (recusa sobrescrever)
//   npm run estudio -- 001 render <Composicao> REV00 [nome]   render + finalização em 6_entregas/REV00/ (recusa sobrescrever)
//   npm run estudio -- 001 finalizar <entrada.mp4> <saida.mp4>  só a finalização (loudness e codificação)
//   npm run estudio -- 001 medir <arquivo>             loudness, pico e formato de um arquivo, sem gravar nada
//   npm run estudio -- galeria studio                   galeria de estilos do projeto original
//   npm run estudio -- registrar                        atualiza src/videos/registro.tsx
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {RAIZ, PASTAS, PYTHON, PROJETOS, MODELO_PROFUNDIDADE, RIFE, acharCodigo, acharProjeto, listarProjetos} from './_config.mjs';

const require = createRequire(import.meta.url);

const remotionCli = () => {
  const pkg = require.resolve('@remotion/cli/package.json', {paths: [RAIZ]});
  const {bin} = JSON.parse(fs.readFileSync(pkg, 'utf8'));
  return path.join(path.dirname(pkg), typeof bin === 'string' ? bin : bin.remotion);
};

const rodar = (exe, args, env = {}) => {
  const r = spawnSync(exe, args, {cwd: RAIZ, stdio: 'inherit', env: {...process.env, ...env}});
  if (r.error) throw r.error;
  if (r.status !== 0) process.exit(r.status ?? 1);
};

const remotion = (args, publico) => rodar(process.execPath, [remotionCli(), ...args], publico ? {ESTUDIO_PUBLICO: publico} : {});
// UTF-8 na saída: sem isso, o console do Windows embaralha os acentos das mensagens.
const python = (script, args) => rodar(PYTHON, [path.join(RAIZ, 'tools', script), ...args], {PYTHONIOENCODING: 'utf-8'});

// Cada src/videos/<NNN-slug>/index.tsx exporta `Composicoes`. O registro junta todos num <Folder> por vídeo.
const registrar = () => {
  const base = path.join(RAIZ, 'src', 'videos');
  fs.mkdirSync(base, {recursive: true});
  const videos = fs
    .readdirSync(base, {withFileTypes: true})
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(base, d.name, 'index.tsx')))
    .map((d) => d.name)
    .sort();
  const linhas = [
    '// Gerado pelo scripts/estudio.mjs. Não edite à mão.',
    "import React from 'react';",
    "import {Folder} from 'remotion';",
    ...videos.map((v, i) => `import {Composicoes as V${i}} from './${v}';`),
    '',
    'export const Videos: React.FC = () => (',
    '  <>',
    // O Remotion só aceita a-z, 0-9 e hífen em nomes de pasta.
    ...videos.map((v, i) => `    <Folder name="${v.replace(/[^a-zA-Z0-9-]/g, '-').replace(/^-+/, '')}"><V${i} /></Folder>`),
    '  </>',
    ');',
    '',
  ];
  const destino = path.join(base, 'registro.tsx');
  const novo = linhas.join('\n');
  if (!fs.existsSync(destino) || fs.readFileSync(destino, 'utf8') !== novo) fs.writeFileSync(destino, novo);
  return videos;
};

// O Remotion copia a pasta pública inteira para o bundle a cada still ou render. Para não copiar entregas,
// renders, stills e PDFs, mantemos uma pasta pública enxuta em .publico/<NNN>/ (fora do OneDrive) só com o que
// o vídeo usa. É um espelho: copia só o que mudou (tamanho ou data) e remove o que saiu do projeto.
// Hard links não servem: o Remotion enxerga os arquivos do OneDrive linkados como links simbólicos.
// Apagar .publico/ nunca afeta os originais.
// Sempre entram o kit da marca, o áudio, as transcrições e as cópias de trabalho (5_trabalho/midia, ver tools/proxy.py).
// Os brutos e as demais referências de estilo, que podem ter GBs, só entram se o código do vídeo citar a pasta.
const PUBLICO_FIXO = [`${PASTAS.estilo}/marca`, PASTAS.audio, `${PASTAS.trabalho}/transcricao`, `${PASTAS.trabalho}/midia`];

const pastasPublicas = (numero) => {
  const codigo = acharCodigo(numero);
  const texto = codigo
    ? fs.readdirSync(codigo, {recursive: true}).filter((f) => /\.(tsx?|json)$/.test(String(f)))
        .map((f) => fs.readFileSync(path.join(codigo, String(f)), 'utf8')).join('\n')
    : '';
  const extras = [];
  if (texto.includes(`${PASTAS.brutos}/`)) extras.push(PASTAS.brutos);
  if (new RegExp(`${PASTAS.estilo}/(?!marca/)`).test(texto)) extras.push(PASTAS.estilo);
  return extras.includes(PASTAS.estilo) ? [...extras, ...PUBLICO_FIXO.filter((p) => !p.startsWith(PASTAS.estilo))] : [...extras, ...PUBLICO_FIXO];
};

const espelhar = (origem, alvo) => {
  fs.mkdirSync(alvo, {recursive: true});
  const fonte = fs.existsSync(origem) ? fs.readdirSync(origem, {withFileTypes: true}).filter((e) => e.name !== 'LEIA-ME.txt') : [];
  const nomes = new Set(fonte.map((e) => e.name));
  for (const sobra of fs.readdirSync(alvo)) if (!nomes.has(sobra)) fs.rmSync(path.join(alvo, sobra), {recursive: true, force: true});
  for (const e of fonte) {
    const de = path.join(origem, e.name);
    const para = path.join(alvo, e.name);
    if (e.isDirectory()) {
      espelhar(de, para);
      continue;
    }
    const a = fs.statSync(de);
    const b = fs.existsSync(para) ? fs.statSync(para) : null;
    if (!b || b.size !== a.size || b.mtimeMs < a.mtimeMs) {
      fs.copyFileSync(de, para);
      fs.utimesSync(para, a.atime, a.mtime);
    }
  }
};

const montarPublico = (proj) => {
  const destino = path.join(RAIZ, '.publico', proj.numero);
  const pastas = pastasPublicas(proj.numero);
  // Remove do espelho as pastas de topo que deixaram de ser usadas.
  const topo = new Set(pastas.map((p) => p.split('/')[0]));
  if (fs.existsSync(destino)) for (const d of fs.readdirSync(destino)) if (!topo.has(d)) fs.rmSync(path.join(destino, d), {recursive: true, force: true});
  const estiloEspelho = path.join(destino, PASTAS.estilo);
  if (!pastas.includes(PASTAS.estilo) && fs.existsSync(estiloEspelho)) {
    for (const d of fs.readdirSync(estiloEspelho)) if (d !== 'marca') fs.rmSync(path.join(estiloEspelho, d), {recursive: true, force: true});
  }
  for (const sub of pastas) espelhar(path.join(proj.pasta, sub), path.join(destino, sub));
  return destino;
};

const copiarCodigo = (numero, destino) => {
  const codigo = acharCodigo(numero);
  if (!codigo) return;
  fs.cpSync(codigo, destino, {recursive: true});
  console.log(`Cópia do código: ${destino}`);
};

const carimbo = () => new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '').replace(/^(\d{8})/, '$1-');

const [alvo, comando, ...resto] = process.argv.slice(2);

if (!alvo || alvo === 'ajuda') {
  console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).join('\n'));
} else if (alvo === 'registrar') {
  console.log(`Vídeos registrados: ${registrar().join(', ') || 'nenhum'}`);
} else if (alvo === 'projetos') {
  console.log(`Projetos em ${PROJETOS}:`);
  for (const p of listarProjetos()) console.log(`  ${p}`);
} else if (alvo === 'galeria') {
  registrar();
  remotion([comando ?? 'studio', 'src/index.ts', ...resto]);
} else {
  const proj = acharProjeto(alvo);
  const em = (pasta, ...partes) => path.join(proj.pasta, PASTAS[pasta], ...partes);
  switch (comando) {
    case 'caminho':
      console.log(proj.pasta);
      break;
    case 'sondar':
      python('sondar.py', [proj.pasta, ...resto]);
      break;
    case 'proxy': {
      const [arquivo, ...opcoes] = resto;
      if (!arquivo) throw new Error('Uso: proxy "1_brutos/<arquivo>" [--fps 30] [--altura 1920] [--sem-audio]');
      python('proxy.py', [proj.pasta, arquivo, ...opcoes]);
      break;
    }
    case 'lento': {
      const [arquivo, ...opcoes] = resto;
      if (!arquivo || !opcoes.includes('--inicio') || !opcoes.includes('--duracao')) {
        throw new Error('Uso: lento "1_brutos/<clipe>" --inicio <s> --duracao <s> [--fator 2|3|4] [--altura 1920] [--refazer]');
      }
      python('lento.py', [proj.pasta, RIFE, arquivo, ...opcoes]);
      break;
    }
    case 'profundidade': {
      if (resto.filter((a) => !a.startsWith('--')).length === 0) throw new Error('Uso: profundidade "1_brutos/<foto ou pasta>" [...] [--refazer]');
      python('profundidade.py', [proj.pasta, MODELO_PROFUNDIDADE, ...resto]);
      break;
    }
    case 'transcrever': {
      const [arquivo, ...opcoes] = resto;
      if (!arquivo) throw new Error('Informe o arquivo de áudio ou vídeo, relativo à pasta do projeto.');
      const fonte = path.resolve(proj.pasta, arquivo);
      const saida = em('trabalho', 'transcricao', path.parse(fonte).name);
      python('transcrever.py', [fonte, saida, ...opcoes]);
      break;
    }
    case 'alinhar': {
      // Grava <stem do texto>.json ao lado do palavras.json (5_trabalho/transcricao/, que já vai para a pasta pública).
      const [texto, palavras, ...opcoes] = resto;
      if (!texto || !palavras) throw new Error('Uso: alinhar "<texto.txt>" "<.../palavras.json>" [--alias "orora=aurora, 8=oito"]');
      const fonte = path.resolve(proj.pasta, palavras);
      const saida = path.join(path.dirname(fonte), `${path.parse(texto).name}.json`);
      if (path.resolve(saida) === fonte) throw new Error('O texto não pode se chamar palavras.txt: a saída sobrescreveria a transcrição.');
      python('alinhar.py', [path.resolve(proj.pasta, texto), fonte, saida, ...opcoes]);
      break;
    }
    case 'studio':
      registrar();
      remotion(['studio', 'src/index.ts', ...resto], montarPublico(proj));
      break;
    case 'compositions':
      registrar();
      remotion(['compositions', 'src/index.ts', ...resto], montarPublico(proj));
      break;
    case 'still': {
      const [comp, quadro, ...extra] = resto;
      if (!comp || quadro === undefined) throw new Error('Uso: still <Composicao> <quadro>');
      registrar();
      // --guia liga a prop guiaZonas (faixas das zonas seguras), sem precisar escrever JSON no terminal.
      const guia = extra.includes('--guia');
      const outros = extra.filter((a) => a !== '--guia');
      const saida = em('trabalho', 'stills', `${comp}-q${String(quadro).padStart(5, '0')}${guia ? '-guia' : ''}.png`);
      const props = guia ? [`--props=${JSON.stringify({guiaZonas: true})}`] : [];
      remotion(['still', 'src/index.ts', comp, saida, `--frame=${quadro}`, ...props, ...outros], montarPublico(proj));
      break;
    }
    case 'capa': {
      const [comp, rev, quadro = '0'] = resto;
      if (!comp || !/^REV\d{2}$/.test(rev ?? '')) throw new Error('Uso: capa <Composicao> REVnn [quadro]');
      const saida = em('entregas', rev, `capa_${rev}.jpg`);
      if (fs.existsSync(saida)) throw new Error(`Já existe ${saida}. Entregas não são sobrescritas: use a próxima revisão.`);
      registrar();
      remotion(['still', 'src/index.ts', comp, saida, `--frame=${quadro}`, '--image-format=jpeg', '--jpeg-quality=92'], montarPublico(proj));
      break;
    }
    case 'rascunho': {
      const [comp, ...extra] = resto;
      if (!comp) throw new Error('Uso: rascunho <Composicao>');
      registrar();
      const saida = em('trabalho', 'rascunhos', `${comp}-${carimbo()}.mp4`);
      remotion(['render', 'src/index.ts', comp, saida, '--scale=0.5', '--crf=28', ...extra], montarPublico(proj));
      break;
    }
    case 'render': {
      const [comp, rev, nome, ...extra] = resto;
      if (!comp || !/^REV\d{2}$/.test(rev ?? '')) throw new Error('Uso: render <Composicao> REVnn [nome-do-arquivo]');
      // O render sai em alta qualidade em 5_trabalho/render/; a versão para publicar (loudness e codificação
      // finais) vai para 6_entregas/REVnn/. A entrega nunca é sobrescrita.
      const final = em('entregas', rev, `${nome ?? comp}_${rev}.mp4`);
      if (fs.existsSync(final)) throw new Error(`Já existe ${final}. Entregas não são sobrescritas: use a próxima revisão.`);
      const master = em('trabalho', 'render', `${nome ?? comp}_${rev}_master.mp4`);
      registrar();
      remotion(['render', 'src/index.ts', comp, master, '--crf=12', ...extra], montarPublico(proj));
      copiarCodigo(proj.numero, em('trabalho', 'codigo', rev));
      python('finalizar.py', [master, final]);
      // Lembrete para o agente que rodou o render (Claude Code ou Codex): a revisão vem antes da entrega.
      console.log(`\nAntes de entregar o ${rev}: faça uma revisão independente do vídeo, da capa e da legenda ` +
        '(Claude Code: agente revisor-video; Codex: uma conversa nova, sem o contexto desta). Confira os dados do ' +
        'kit da marca (contatos, registros profissionais), o aviso "Imagem ilustrativa", as hashtags e os dados citados.');
      break;
    }
    case 'finalizar': {
      const [arquivo, destino, ...opcoes] = resto;
      if (!arquivo || !destino) throw new Error('Uso: finalizar <entrada.mp4> <saida.mp4> [--lufs -14] (relativos à pasta do projeto)');
      python('finalizar.py', [path.resolve(proj.pasta, arquivo), path.resolve(proj.pasta, destino), ...opcoes]);
      break;
    }
    case 'medir': {
      const [arquivo] = resto;
      python('finalizar.py', [path.resolve(proj.pasta, arquivo), '--medir']);
      break;
    }
    default:
      throw new Error(`Comando desconhecido: ${comando}. Rode "npm run estudio -- ajuda".`);
  }
}
