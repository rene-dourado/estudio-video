// Configuração compartilhada pelos scripts: onde ficam os dados (projetos e marcas) e qual Python usar.
// Cada máquina pode ter um estudio.local.json (fora do Git), por exemplo:
//   {"dados": "~/OneDrive/Documentos/Videos", "python": "~/.cache/estudio-video/whisper-venv/Scripts/python.exe",
//    "profundidade": "~/.cache/estudio-video/depth-anything-v2-small.onnx",
//    "rife": "~/.cache/estudio-video/rife-ncnn-vulkan/rife-ncnn-vulkan.exe"}
// Sem ele, os dados ficam em ./dados e o Python é o do sistema.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const expandir = (p) => (p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : path.resolve(RAIZ, p));

const lerLocal = () => {
  const arquivo = path.join(RAIZ, 'estudio.local.json');
  if (!fs.existsSync(arquivo)) return {};
  return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
};

const local = lerLocal();
export const DADOS = expandir(local.dados ?? 'dados');
export const PROJETOS = path.join(DADOS, 'projetos');
export const MARCAS = path.join(DADOS, 'marcas');
export const PYTHON = local.python ? expandir(local.python) : process.platform === 'win32' ? 'python' : 'python3';
// rife-ncnn-vulkan (comando lento), com a pasta rife-v4.25 ao lado do executável. Instalação manual (guia 1).
export const RIFE = expandir(local.rife ?? `~/.cache/estudio-video/rife-ncnn-vulkan/rife-ncnn-vulkan${process.platform === 'win32' ? '.exe' : ''}`);
// Depth Anything V2 Small em ONNX (comando profundidade). O npm run instalar baixa para cá.
export const MODELO_PROFUNDIDADE =expandir(local.profundidade ?? '~/.cache/estudio-video/depth-anything-v2-small.onnx');

// Subpastas de cada projeto de vídeo. A ordem é a do trabalho.
export const PASTAS = {
  brutos: '1_brutos',
  estilo: '2_referencias_estilo',
  contexto: '3_referencias_contexto',
  audio: '4_audio',
  trabalho: '5_trabalho',
  entregas: '6_entregas',
};

export const listarProjetos = () =>
  fs.existsSync(PROJETOS)
    ? fs
        .readdirSync(PROJETOS, {withFileTypes: true})
        .filter((d) => d.isDirectory() && /^\d{3} /.test(d.name))
        .map((d) => d.name)
        .sort()
    : [];

export const acharProjeto = (numero) => {
  const n = String(numero).padStart(3, '0');
  const achado = listarProjetos().find((nome) => nome.startsWith(`${n} `));
  if (!achado) throw new Error(`Projeto ${n} não encontrado em ${PROJETOS}`);
  return {numero: n, nome: achado, pasta: path.join(PROJETOS, achado)};
};

// Pasta do código do vídeo: src/videos/<NNN>-<slug>/
export const acharCodigo = (numero) => {
  const base = path.join(RAIZ, 'src', 'videos');
  const n = String(numero).padStart(3, '0');
  const achado = fs.existsSync(base) ? fs.readdirSync(base).find((d) => d.startsWith(`${n}-`)) : undefined;
  return achado ? path.join(base, achado) : null;
};

export const slug = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
