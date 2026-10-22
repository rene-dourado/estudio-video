# Tipos de vídeo

O estúdio não supõe um tipo só. O briefing define o tipo, e cada tipo muda o que é base, o que manda no tempo e o que mais importa conferir.

| Tipo | Base | O que manda no tempo | Cuidado principal |
|---|---|---|---|
| **Montagem de brutos** (imóvel, obra, evento, produto) | trechos de vídeos gravados + fotos | a narração ou a música | escolher os melhores trechos, cor coerente, rótulos fiéis à imagem |
| **Pessoa falando** (aula, opinião, depoimento) | o vídeo gravado, já cortado | a própria fala | rosto livre, vídeo intocado (ver [5-direcao-editorial.md](5-direcao-editorial.md)) |
| **Fotos animadas** | fotos e renders | narração ou música | movimento suave, avisos de imagem ilustrativa |
| **Motion graphics** | só design: texto, formas, ícones, dados | narração, música ou roteiro | hierarquia e ritmo de leitura |
| **Tela / tutorial** | gravações de tela e prints | narração ou fala | zoom no ponto certo, cursor e passos legíveis |
| **Misto** | combinação dos anteriores | o que o plano definir | consistência de estilo entre as partes |

## Montagem de brutos (sem ninguém falando)

É o caso mais comum em imóveis, obras, eventos, turismo e produtos: clipes de celular ou drone, fotos, às vezes renders, mais uma narração gerada fora e uma música.

1. **Inventário e pranchas** (`sondar`): saber o que existe, a orientação de cada clipe (vertical ou horizontal) e onde estão os bons momentos. Clipes de celular marcados como **HDR** ou com **taxa variável** ganham uma cópia de trabalho (`proxy`) em `5_trabalho/midia/`, que é a usada no código.
2. **Escolha dos trechos.** Para cada cena do plano: arquivo, início e duração. Prefira trechos estáveis, com movimento contínuo, sem pessoas, placas ou reflexos indesejados. Anote no plano o porquê de cada escolha quando houver alternativa.
3. **Movimento.** `Clipe` e `FotoMovimento` aplicam um zoom lento (padrão 1,00 → 1,04–1,06) que dá vida e esconde pequenos tremores. `velocidade` abaixo de 1 alonga clipes curtos. `foco` escolhe o que fica no quadro quando um horizontal vira vertical.
4. **Ritmo.** Com narração, cada corte cai numa palavra (`quando(palavras, 'cozinha')`). Sem narração, os cortes seguem o tempo da música; 2 a 4 s por plano é um bom ponto de partida para Reels.
5. **Textos.** Títulos por cena (ambiente, etapa, produto), rótulos de diferenciais, dados confirmados no contexto, tela final com contato e CTA. A legenda da fala pode ficar só onde não há título (assim a tela não fica poluída).
6. **Cor.** Se os clipes vêm de aparelhos diferentes, uniformize com um `filtro` CSS leve (brilho, contraste, saturação, temperatura) e confira nos stills lado a lado.
7. **Qualidade do bruto.** Clipe com resolução baixa? Avise antes. Upscale e estabilização são possíveis com ferramentas externas (ex.: Real-ESRGAN, FFmpeg vidstab), sempre gerando cópias em `5_trabalho/`, nunca alterando o original, e só com a sua aprovação para instalar.

### Erros comuns (e como evitar)

- Rótulo e imagem precisam bater: um rótulo "Fechadura digital" sobre uma parede lisa, ou "Sabor morango" sobre o pote de baunilha, reprova o quadro.
- Selos, marcas d'água e textos de terceiros nos brutos: recorte para fora ou cubra, e confira em **todos** os recortes.
- Nada que não faz parte do que se oferece (o imóvel vizinho, um acessório vendido à parte, o espaço de outro evento) pode ser apontado como se fizesse.
- Plantas, mapas e diagramas animados respeitam a orientação real (nada espelhado ou girado).
- Legenda e textos longe da área de nome, descrição e botões da plataforma (zonas seguras).

## Fotos animadas

Mesmo fluxo da montagem, com `FotoMovimento`. Varie a direção do movimento (aproximar, afastar, deslizar) para não ficar repetitivo. Render ou perspectiva leva "Imagem ilustrativa" fixo no quadro.

## Motion graphics

Sem material gravado: o vídeo é tipografia, formas, ícones, gráficos e transições. O estilo vem inteiro da identidade (marca, referências). Comece por um quadro-chave de cada cena para aprovar o visual antes de animar.

## Tela / tutorial

Prints e gravações de tela em `1_brutos/`. Zoom lento até o ponto citado, marca-texto, cursor e destaque dos passos. A seção 6 da [direção editorial](5-direcao-editorial.md) vale aqui.

## Pessoa falando

Siga a [direção editorial](5-direcao-editorial.md) do projeto original: o vídeo gravado é intocável, a edição é composição por cima, o rosto nunca é coberto, e as telas divididas usam `synchronized-split.tsx`.
