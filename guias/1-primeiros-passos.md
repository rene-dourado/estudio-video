# Primeiros passos

Do zero até o primeiro vídeo. Leva uns 20 minutos, a maior parte esperando instalações.

---

## 1. O que você precisa

| Item | Para quê | Obrigatório? |
|---|---|---|
| **Claude Code** (plano Pro ou Max) e/ou **Codex** | o seu diretor de vídeo | um dos dois |
| **Node.js** (versão LTS) | roda o Remotion | sim |
| **Python** 3.10 ou mais novo | transcrição e skill `watch` | sim |
| **FFmpeg** | lê, mede e converte vídeo | sim |
| **yt-dlp** e **Deno** | a `watch` assistir a vídeos de links (YouTube etc.) | para links |
| **Poppler** | ler PDFs de contexto (plantas, memoriais) | recomendado |
| **Git** | baixar e atualizar este repositório | recomendado |
| Placa NVIDIA | transcrição muitas vezes mais rápida | não |

Funciona no Claude Desktop (aba Code), no Claude Code do terminal ou do VS Code, e no Codex (app ou terminal). A skill `watch` **não funciona no chat comum** do Claude: use sempre uma sessão Code.

## 2. Instalar os programas

### Windows

No **PowerShell**, um por vez:

```powershell
winget install --id OpenJS.NodeJS.LTS --exact
winget install --id Python.Python.3.12 --exact
winget install --id Gyan.FFmpeg --exact
winget install --id yt-dlp.yt-dlp --exact
winget install --id DenoLand.Deno --exact
winget install --id oschwartz10612.Poppler --exact
winget install --id Git.Git --exact
```

Feche e abra o PowerShell e confira: `node --version`, `python --version`, `ffmpeg -version`.

### macOS

Com o [Homebrew](https://brew.sh): `brew install node python ffmpeg yt-dlp deno poppler git`.

## 3. Baixar o estúdio e instalar tudo

Escolha uma pasta **fora** do OneDrive, iCloud ou Dropbox (a sincronização trava o `node_modules` e o render). Por exemplo, `C:\Estudio-video` ou `C:\dev\estudio-video`.

```bash
git clone <url-deste-repositório> C:\Estudio-video
cd C:\Estudio-video
npm run instalar
```

O `npm run instalar` faz, nesta ordem: dependências do Remotion; um ambiente Python só para a transcrição (`~/.cache/estudio-video/whisper-venv`, fora do repositório) com `faster-whisper` e, se houver placa NVIDIA, as bibliotecas CUDA; as skills do Remotion para o Claude Code **e** para o Codex; a skill `watch` no Claude Code. Ele também cria o `estudio.local.json`.

## 4. Skills

- **`watch`** ([bradautomates/claude-video](https://github.com/bradautomates/claude-video), MIT): assiste a vídeos, extrai quadros e lê legendas. No primeiro uso, escolha o motor **local** (nada sai da máquina); a transcrição do estúdio já é feita pelo `tools/transcrever.py`, então a `watch` pode ficar sem transcrição própria.
  - **Claude Code:** instalada pelo `npm run instalar`, ou em **Personalizar → Plugins → Adicionar marketplace** com `https://github.com/bradautomates/claude-video`.
  - **Codex:** copie a pasta `skills/watch` do repositório da watch para `~/.agents/skills/watch` (ou peça ao Codex para instalá-la com o `$skill-installer`).
- **Skills do Remotion** ([remotion-dev/skills](https://github.com/remotion-dev/skills)): `remotion-best-practices` e as específicas (marcação, legendas, render, studio). Atualize com `npx skills update -g`.

Skills novas só aparecem numa **sessão nova**.

## 5. Onde ficam os seus vídeos

O `estudio.local.json` diz onde ficam os dados (projetos e marcas). Padrão: a pasta `dados/` dentro do repositório, que nunca vai para o Git. Para guardar os vídeos no OneDrive (backup) e o motor fora dele:

```json
{
  "dados": "~/OneDrive/Documentos/Videos",
  "python": "~/.cache/estudio-video/whisper-venv/Scripts/python.exe"
}
```

O `~` é a sua pasta de usuário. Os vídeos são lidos de lá; o código e o `node_modules` continuam fora da sincronização.

## 6. Entendendo as pastas

```text
estudio-video/                 o motor (fora do OneDrive)
├─ AGENTS.md / CLAUDE.md       o diretor
├─ guias/  modelos/  estilos/  manuais, modelos de briefing/plano/narração/legenda, galeria
├─ scripts/  tools/            comandos do estúdio e ferramentas (transcrição, inventário, finalização)
└─ src/                        Remotion: _shared/ (peças), estilos/ (galeria), videos/ (seus vídeos, fora do Git)

<dados>/                       os seus vídeos (pode ser no OneDrive)
├─ marcas/<marca>/             kits de identidade
└─ projetos/001 - nome/        1_brutos · 2_referencias_estilo · 3_referencias_contexto · 4_audio · 5_trabalho · 6_entregas
```

Regra de bolso: **você coloca material em 1 a 4 e pega o resultado em 6.** O resto é trabalho do diretor.

## 7. Seu primeiro vídeo

1. Abra uma sessão do Claude Code ou do Codex **na pasta onde ficam as regras do seu projeto de vídeos** (ou na do estúdio).
2. Diga: `Quero fazer um vídeo novo.`
3. Coloque os brutos e as referências nas pastas que o diretor indicar.
4. Responda às rodadas de perguntas.
5. Aprove a direção de estilo, o roteiro de narração (se houver) e o plano.
6. Confira os quadros de revisão.
7. Pegue o vídeo, a capa e a legenda em `6_entregas/REV00/`.

## 8. Glossário rápido

| Termo | Significado |
|---|---|
| **Bruto** | vídeo, foto ou áudio do jeito que foi gravado |
| **Plano / cena** | um trecho contínuo do vídeo final |
| **Gatilho** | a palavra falada que faz um corte ou texto aparecer |
| **Zona segura** | área do quadro que a interface da rede social não cobre |
| **LUFS** | medida de volume percebido; as redes usam -14 |
| **Still** | um quadro parado exportado como imagem, para revisão |
| **Render** | gerar o arquivo de vídeo final |
| **REVnn** | número da revisão da entrega (REV00, REV01...) |
| **Skill** | um pacote de instruções que ensina o agente a fazer uma tarefa |
