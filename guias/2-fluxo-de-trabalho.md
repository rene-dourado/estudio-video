# O fluxo de trabalho

Do primeiro "quero um vídeo" até o arquivo pronto para publicar. O diretor (Claude Code ou Codex) conduz as fases na ordem e **para nos pontos de aprovação**. Você conversa, aprova e confere.

**Custo:** zero. Tudo roda no seu computador: [Remotion](https://www.remotion.dev) (vídeo feito com código), skill `watch` (assiste aos vídeos), `faster-whisper` (tempo de cada palavra) e FFmpeg.

---

## 0. Criar o projeto

```text
Quero fazer um vídeo novo: Reels do apartamento 502, marca minha-imobiliaria.
```

O diretor roda `npm run novo -- "Reels apartamento 502" --marca minha-imobiliaria` e cria:

| Pasta | O que você coloca |
|---|---|
| `1_brutos/` | vídeos, fotos e áudios gravados, como saíram do celular ou da câmera |
| `2_referencias_estilo/` | identidade visual: o kit da marca (copiado sozinho com `--marca`), logos, paletas, fontes, prints ou links de vídeos que você gosta **e** dos que não quer |
| `3_referencias_contexto/` | PDFs, plantas, memoriais, tabelas de preço, fichas técnicas, textos, um `links.md` com sites |
| `4_audio/` | a narração que você gerar e a música com licença (pode ficar vazia no começo) |

Não precisa organizar nada além disso. Nomes claros ajudam (`cozinha-dia.mp4`, `planta-tipo.pdf`), mas o diretor se vira.

## 1. Briefing (perguntas)

O diretor olha o que já está nas pastas e faz **rodadas curtas de perguntas de múltipla escolha** ([modelos/perguntas.md](../modelos/perguntas.md)): onde vai ser publicado, tipo de vídeo, narração, duração, objetivo, público, chamada para ação, identidade, ritmo, música, avisos. As respostas vão para `briefing.md`.

- **Instagram?** A legenda do post entra nos entregáveis.
- **Narração gerada?** O diretor escreve o roteiro para você gerar a voz no Google AI Studio (ou onde preferir).

## 2. Estudo do material

- `npm run estudio -- NNN sondar`: inventário (`5_trabalho/inventario.md`) com duração, resolução, orientação e áudio de cada arquivo, e uma **prancha** de quadros de cada vídeo para escolher trechos sem assistir tudo.
- Skill `watch`: o diretor "assiste" aos vídeos (quadros e transcrição) quando precisa entender movimento, fala ou detalhes.
- Contexto: lê os PDFs e documentos (texto com `pdftotext`; plantas e páginas escaneadas como imagem, com `pdftoppm`).
- Saída: um resumo do que o material tem de melhor, do que tem defeito e do que **falta** ("um plano da fachada de dia faria falta no gancho").

## 3. Direção de estilo (ponto de aprovação)

A partir das suas referências, o diretor propõe duas ou três direções concretas: paleta, fontes, ritmo, transições, textura, como os textos aparecem. Pode mostrar um quadro de teste de cada. Detalhes em [6-identidade-visual.md](6-identidade-visual.md).

## 4. Roteiro de narração (se houver; ponto de aprovação)

`6_entregas/REV00/narracao.md` ([modelo](../modelos/narracao.md)): configuração sugerida, instruções de estilo para colar, o texto pronto (números por extenso, pronúncias) e o mapa de blocos com o tempo de cada um. Você gera a voz, salva em `4_audio/` e avisa.

## 5. Plano de edição (ponto de aprovação)

`plano.md` ([modelo](../modelos/plano.md)): ficha técnica, leitura do material, direção de estilo decidida, estrutura (gancho, desenvolvimento, CTA), tabela de cenas (fonte e trecho, movimento, texto, gatilho, transição), áudio e pendências. **Nada é programado antes de você aprovar.**

## 6. Transcrição

```text
npm run estudio -- NNN transcrever "4_audio/narracao.wav" --prompt "Residencial Jardins, Bela Vista, rooftop"
```

Gera `palavras.json` (início e fim de cada palavra), `transcript.md` e `legenda.srt` em `5_trabalho/transcricao/`. O `--prompt` com nomes próprios evita erros de grafia. O diretor compara com o roteiro: se a voz pulou ou trocou algo, o texto da tela segue o que foi **dito**, e ele avisa você.

## 7. Programação

- Código em `src/videos/<NNN>-<slug>/index.tsx`, exportando `Composicoes` (o vídeo, a capa, versões).
- Peças prontas em `src/_shared/`: `Clipe` e `FotoMovimento` (material bruto com movimento suave), `LegendaFala` e `quando()` (legenda e cortes ancorados nas palavras), `useMarca` (cores, fontes e logos do kit), `GuiaZonas` (zonas seguras), `synchronized-split` e `enquadrarRosto` (pessoa falando).
- Qualquer estilo: o Remotion desenha tudo o que uma página web desenha, e mais vídeo. Para 3D, mapas ou efeitos especiais, o diretor propõe o pacote do Remotion e pede a sua aprovação antes de instalar.
- Toda animação depende de `useCurrentFrame()`, sem animação CSS. Use `<Sequence premountFor={fps}>` nas cenas com tempo.

## 8. Conferência (ponto de aprovação)

1. `npm run typecheck`.
2. Stills de cada cena e do meio de cada transição, com a guia de zonas seguras ligada: `npm run estudio -- NNN still <Composicao> <quadro>` (saem em `5_trabalho/stills/`).
3. Se o ritmo precisa ser visto, um rascunho rápido em meia resolução: `npm run estudio -- NNN rascunho <Composicao>`.
4. Pré-visualização ao vivo no navegador: `npm run estudio -- NNN studio`.
5. O diretor revisa com o [checklist](../modelos/checklist-entrega.md) e mostra os quadros principais para você aprovar.

## 9. Entrega

```text
npm run estudio -- NNN render <Composicao> REV00 <Nome_do_video>
```

- O render sai em alta qualidade em `5_trabalho/render/`. A finalização (`tools/finalizar.py`: -14 LUFS, pico -1 dBTP, H.264 High, AAC 48 kHz, faststart) grava direto em `6_entregas/REV00/`, e o código é copiado para `5_trabalho/codigo/REV00/`.
- Na mesma `REV00/`: capa (`still` de uma composição de capa), legenda do post e roteiro de narração.
- O diretor informa caminho, duração, resolução, loudness e o que **não** conferiu (escuta completa, prévia no app).

## 10. Revisões

Pediu mudança? Vira `REV01`, `REV02`... A anterior continua intacta. Se quiser, o diretor compacta as revisões antigas num zip.

---

## Pedidos que funcionam bem

```text
Novo vídeo: Reels de 60 s da casa 3, marca minha-imobiliaria. Os brutos e a planta já estão na pasta.
```

```text
Continua o projeto 004. Gerei a narração, está em 4_audio.
```

```text
Na REV00 do 002, troca a cena 5 por outro trecho da varanda e deixa a legenda maior. Gera a REV01.
```

```text
Faz uma versão horizontal de 30 s do projeto 003 para o YouTube, com a mesma identidade.
```
