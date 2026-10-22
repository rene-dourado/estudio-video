# Estúdio de vídeo

**Faça vídeos conversando com o Claude Code ou o Codex.** Você entrega o material (vídeos brutos, fotos, referências de estilo e de contexto); o diretor faz as perguntas certas, propõe a direção visual, escreve o roteiro de narração, monta a edição no [Remotion](https://www.remotion.dev) e entrega o vídeo pronto para publicar, com capa e legenda do post.

Fork de [mackswendhell/studio](https://github.com/mackswendhell/studio) (MIT), adaptado para:

- **qualquer tipo de vídeo:** montagem de brutos sem ninguém falando (imóveis, obras, eventos, produtos), pessoa falando, fotos animadas, motion graphics, tutorial de tela;
- **qualquer estilo:** em cada projeto, o estilo sai da sua identidade visual e das suas referências, não de uma galeria fixa;
- **briefing guiado:** rodadas curtas de perguntas de múltipla escolha, conforme a finalidade (Instagram → legenda do post; narração gerada → roteiro para o Google AI Studio; sites de referência → URL e o que aproveitar de cada um);
- **genérico:** nenhuma marca é presumida; cada vídeo escolhe o seu kit de marca, cria um novo ou segue sem marca;
- **Claude Code e Codex:** as regras do diretor ficam em `AGENTS.md` (o `CLAUDE.md` só o importa);
- **entrega profissional:** loudness de -14 LUFS, codificação compatível com as redes, zonas seguras de cada plataforma, revisões REVnn nunca sobrescritas;
- **somente ferramentas gratuitas e locais:** sem serviços de IA pagos; nada sai da máquina sem você pedir.

```text
você cria o projeto e solta o material nas pastas
   → o diretor pergunta (finalidade, formato, narração, identidade...)
   → estuda os brutos e o contexto → propõe a direção de estilo → você aprova
   → (se houver) roteiro de narração → você gera a voz e devolve o áudio
   → plano de edição → você aprova
   → programa, mostra quadros de revisão → você aprova
   → vídeo, capa e legenda em 6_entregas/REV00/
```

## Instalar

Pré-requisitos: Node.js, Python 3.10+, FFmpeg (e, recomendados, yt-dlp, Deno, Poppler e Git). Passo a passo em **[guias/1-primeiros-passos.md](guias/1-primeiros-passos.md)**.

```bash
git clone <url-deste-repositório> C:\Estudio-video
cd C:\Estudio-video
npm run instalar
```

Clone **fora** do OneDrive, iCloud ou Dropbox. Os seus vídeos podem ficar numa pasta sincronizada: aponte `dados` no `estudio.local.json` para ela.

### Instalação (instruções para o agente)

1. Clone na pasta indicada (padrão: `C:\Estudio-video`; nunca dentro de pasta sincronizada).
2. Rode `npm run instalar`. Ele instala as dependências do Remotion, cria um ambiente Python só para a transcrição (fora do repositório), instala o `faster-whisper` (e as bibliotecas CUDA, se houver NVIDIA), as skills do Remotion para Claude Code e Codex, e a skill `watch` no Claude Code. Também cria o `estudio.local.json`.
3. Se faltarem `node`, `python`, `ffmpeg` ou `yt-dlp`, instale-os pelo gerenciador do sistema (comandos no guia 1) e rode `npm run instalar` de novo.
4. No Codex, a `watch` entra como skill: copie `skills/watch` do repositório [bradautomates/claude-video](https://github.com/bradautomates/claude-video) para `~/.agents/skills/watch`.
5. Termine dizendo à pessoa para abrir uma **sessão nova** (skills novas só aparecem nela).

## Começo rápido

```text
Quero fazer um vídeo novo.
```

O diretor cria `dados/projetos/001 - <nome>/` com as pastas `1_brutos`, `2_referencias_estilo`, `3_referencias_contexto`, `4_audio`, `5_trabalho` e `6_entregas`, e começa o briefing.

## Estrutura

```text
estudio-video/
├─ AGENTS.md  CLAUDE.md   o diretor de vídeo
├─ guias/                 primeiros passos · fluxo · manual do Remotion · tipos de vídeo · direção editorial · identidade visual · som e entrega
├─ modelos/               perguntas e briefing · plano · narração · legenda do Instagram · checklist · kit de marca
├─ estilos/               galeria do projeto original (inspiração)
├─ scripts/               estudio.mjs (comando único) · novo-projeto.mjs · instalar.mjs
├─ tools/                 transcrever.py · sondar.py · proxy.py · finalizar.py
├─ src/                   Remotion: _shared/ (peças) · estilos/ · videos/ (seus vídeos, fora do Git)
└─ dados/                 seus projetos e marcas (fora do Git; pode apontar para outra pasta)
```

## Guias

1. [Primeiros passos](guias/1-primeiros-passos.md)
2. [Fluxo de trabalho](guias/2-fluxo-de-trabalho.md)
3. [Manual do Remotion para leigos](guias/3-manual-remotion.md)
4. [Tipos de vídeo](guias/4-tipos-de-video.md)
5. [Direção editorial](guias/5-direcao-editorial.md) (pessoa falando, do projeto original)
6. [Identidade visual](guias/6-identidade-visual.md)
7. [Som, narração e entrega](guias/7-som-e-entrega.md)

## Créditos e licenças

- Projeto original: [mackswendhell/studio](https://github.com/mackswendhell/studio), de Macks Wendhell, [MIT](LICENSE). Este fork mantém a licença e o aviso de copyright.
- As imagens em `estilos/imagens/` vêm de vídeos do canal **Macks Wendhell | Inteligência Aplicada** e são referência visual; não as reutilize como material próprio.
- [Remotion](https://www.remotion.dev): gratuito para pessoas físicas, organizações sem fins lucrativos e empresas com até 3 pessoas; empresas maiores precisam de [licença](https://www.remotion.dev/license).
- Skill [watch](https://github.com/bradautomates/claude-video), de bradautomates (MIT). Skills do Remotion: [remotion-dev/skills](https://github.com/remotion-dev/skills).
- Transcrição: [faster-whisper](https://github.com/SYSTRAN/faster-whisper). Mídia: [FFmpeg](https://ffmpeg.org).
