# Som, narração e entrega

## Narração gerada fora (Google AI Studio ou outra ferramenta)

1. O diretor escreve `6_entregas/REVnn/narracao.md` ([modelo](../modelos/narracao.md)): voz sugerida, instruções de estilo, o texto pronto para colar e o mapa de blocos com o tempo-alvo de cada um.
2. No **Google AI Studio** ([aistudio.google.com](https://aistudio.google.com)), na geração de fala: escolha a voz, cole as instruções de estilo e o texto, gere e baixe o áudio. Vale gerar duas ou três tomadas.
3. Salve em `4_audio/` sem renomear à força (o nome original ajuda a saber quando foi gerado) e avise o diretor.
4. O diretor transcreve com tempo por palavra e **compara com o roteiro**. Vozes sintéticas às vezes pulam palavras, termos estrangeiros ou números; o texto na tela segue o que a voz disse, e ele avisa se vale gerar de novo.
5. A duração da narração define a duração do vídeo (mais a tela final).

Dicas de texto para voz: números e siglas por extenso; frases curtas; uma ideia por frase; pausas com linha em branco; nomes próprios com a pronúncia anotada.

## Música

- **Sempre com licença.** Opções: trilha que você já licenciou; bibliotecas livres de direitos com licença registrada; trilha original sintetizada por código (uma base simples, gerada por script com FFmpeg ou Python, combinada antes, porque ainda não há uma ferramenta pronta no estúdio); ou sem música no arquivo, escolhendo a música dentro do app (no Instagram, a biblioteca do próprio app).
- Registre no `plano.md` o arquivo, a origem e a licença.
- Mixagem: música ~15 dB abaixo da voz enquanto ela fala (ducking), sobe nas pausas e na tela final, termina com fade (nunca corte seco).

## Som dos brutos

Por padrão, mudo. Som ambiente entra só quando agrega (água, cidade, passos), baixo, e com fade nas bordas de cada trecho para não estalar.

## Loudness e finalização

O `render` já chama `tools/finalizar.py`:

- **-14 LUFS integrado** e **pico real -1 dBTP** (normalização EBU R128 em duas passagens), o padrão de Instagram, YouTube e TikTok;
- H.264 High, yuv420p, mesma resolução e fps, AAC 48 kHz 256 kb/s, `faststart`;
- recusa sobrescrever a saída e imprime o relatório final.

Para conferir qualquer arquivo: `npm run estudio -- NNN medir "6_entregas/REV00/arquivo.mp4"`.

## Formatos por plataforma

| Destino | Tamanho | Observações |
|---|---|---|
| Instagram Reels | 1080x1920, 30 fps | zona livre: ~250 px no topo, ~420 px embaixo, ~160 px à direita (botões); capa 1080x1920 com o centro funcionando no recorte 1:1 do grid |
| Instagram feed | 1080x1350 (4:5) ou 1080x1080 | textos maiores, menos elementos por vez |
| Stories | 1080x1920 | zona livre: ~250 px no topo, ~340 px embaixo |
| YouTube | 1920x1080 | capa 1280x720; legenda .srt opcional (sai da transcrição) |
| Shorts / TikTok | 1080x1920 | zona livre parecida com a do Reels, um pouco maior embaixo |
| WhatsApp | 1080x1920 ou 1920x1080 | arquivo até ~16 MB na conversa (use o finalizado; se passar, o diretor gera uma versão mais leve) |

As margens estão em `src/_shared/zonas-seguras.tsx`; `<GuiaZonas plataforma="reels" />` desenha as faixas nos stills de conferência.

## O que vai em cada entrega (`6_entregas/REVnn/`)

- `<Nome>_REVnn.mp4`: o vídeo pronto para publicar;
- `capa_REVnn.jpg`: a capa;
- `legenda_REVnn.md`: a legenda do post (Instagram e outras redes), [modelo](../modelos/legenda-instagram.md);
- `narracao.md`: o roteiro de narração usado nesta revisão;
- opcional: versões extras (corte curto, horizontal, sem textos) com o mesmo REV no nome.
