// Instala tudo de que o estúdio precisa: dependências do Remotion, transcrição local e as skills gratuitas,
// para o Claude Code e para o Codex.
// Uso: npm run instalar   (ou: node scripts/instalar.mjs)
// Cada passo é independente: se um falhar, os outros continuam e o resumo final diz o que resolver.
import {spawnSync} from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {MODELO_PROFUNDIDADE, RAIZ} from './_config.mjs';

const win = process.platform === 'win32';
const python = win ? 'python' : 'python3';
// O ambiente da transcrição fica fora do repositório (e fora de pastas sincronizadas): o PyTorch/CUDA pesa GBs.
const venv = path.join(os.homedir(), '.cache', 'estudio-video', 'whisper-venv');
const venvPython = path.join(venv, win ? 'Scripts/python.exe' : 'bin/python');
const skills = 'remotion-best-practices remotion-markup remotion-captions remotion-render remotion-studio remotion-create remotion-docs remotion-upgrade';

const passos = [
  ['Dependências do Remotion', 'npm install --no-audit --no-fund'],
  ['Ambiente da transcrição', `${python} -m venv "${venv}"`],
  ['Transcrição local (faster-whisper)', `"${venvPython}" -m pip install -q faster-whisper`],
  ['Aceleração por placa NVIDIA (opcional)', `"${venvPython}" -m pip install -q nvidia-cublas-cu12 "nvidia-cudnn-cu12==9.*"`, true],
  ['Skills do Remotion (Claude Code e Codex)', `npx -y skills add remotion-dev/skills -g --copy -y -a claude-code codex -s ${skills}`],
  // falha aqui costuma ser "marketplace já cadastrado"; o passo seguinte revela erro real.
  ['Marketplace da skill watch', 'claude plugin marketplace add bradautomates/claude-video', true],
  ['Skill watch (Claude Code)', 'claude plugin install watch@claude-video --scope user'],
];

const falhas = [];
for (const [nome, comando, opcional] of passos) {
  console.log(`\n==> ${nome}\n    ${comando}`);
  const r = spawnSync(comando, {stdio: 'inherit', shell: true, cwd: RAIZ, env: {...process.env, DISABLE_TELEMETRY: '1', DO_NOT_TRACK: '1'}});
  if (r.status !== 0 && !opcional) falhas.push(nome);
}

// Modelo do comando profundidade (Depth Anything V2 Small em ONNX, Apache 2.0, 99 MB). Roda com o onnxruntime e o
// NumPy que o faster-whisper já instala no ambiente da transcrição. Opcional: sem ele, a <Foto3D> vira FotoMovimento.
// Os modelos Base e Large são CC BY-NC (não comercial) e não servem para vídeos de clientes.
const MODELO_URL = 'https://huggingface.co/onnx-community/depth-anything-v2-small/resolve/main/onnx/model.onnx';
const MODELO_SHA256 = 'afb6a5c28f3b6bf1618c6e43f02073ef9dfdc70e937502d51603e57b0a1df10c';
console.log('\n==> Modelo de profundidade (opcional, 99 MB)');
if (fs.existsSync(MODELO_PROFUNDIDADE)) {
  console.log(`    Já existe: ${MODELO_PROFUNDIDADE}`);
} else {
  try {
    const r = await fetch(MODELO_URL);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const dados = Buffer.from(await r.arrayBuffer());
    if (crypto.createHash('sha256').update(dados).digest('hex') !== MODELO_SHA256) throw new Error('o SHA256 não confere');
    fs.mkdirSync(path.dirname(MODELO_PROFUNDIDADE), {recursive: true});
    fs.writeFileSync(MODELO_PROFUNDIDADE, dados);
    console.log(`    Gravado em ${MODELO_PROFUNDIDADE}`);
  } catch (e) {
    console.log(`    Não baixou (${e.message}). A Foto3D usa a FotoMovimento até o modelo existir.`);
  }
}

const local = path.join(RAIZ, 'estudio.local.json');
if (!fs.existsSync(local)) {
  fs.writeFileSync(local, JSON.stringify({dados: 'dados', python: venvPython}, null, 2) + '\n');
  console.log(`\nCriado ${local}. Edite "dados" para guardar seus vídeos em outra pasta.`);
}

for (const programa of ['ffmpeg -version', 'ffprobe -version', 'yt-dlp --version']) {
  if (spawnSync(programa, {stdio: 'ignore', shell: true}).status !== 0) falhas.push(`${programa.split(' ')[0]} (instale pelo guia)`);
}

console.log('\n' + '='.repeat(60));
if (falhas.length === 0) {
  console.log('Tudo instalado. Abra uma sessão NOVA do Claude Code ou do Codex nesta pasta para as skills aparecerem.');
  console.log('No Codex, a watch entra como skill: veja guias/1-primeiros-passos.md, seção 4.');
} else {
  console.log('Falhou:');
  for (const f of falhas) console.log(`  - ${f}`);
  console.log('Veja guias/1-primeiros-passos.md. Sem o comando "claude" (só Claude Desktop), instale a watch por');
  console.log('Personalizar > Plugins > Adicionar marketplace com https://github.com/bradautomates/claude-video.');
}
process.exit(falhas.length === 0 ? 0 : 1);
