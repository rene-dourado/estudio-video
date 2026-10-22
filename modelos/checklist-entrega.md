# Checklist de entrega

O diretor confere cada item antes de dizer que a revisão está pronta, e informa o que **não** conseguiu conferir.

## Conteúdo

- [ ] Todo dado (área, preço, endereço, data, nome) bate com a fonte em `3_referencias_contexto/`
- [ ] Nada do que "não pode aparecer" aparece (preço, vaga, placas, rostos, logos sem autorização)
- [ ] Texto da tela, narração e legenda do post dizem a mesma coisa
- [ ] A narração gerada leu o roteiro inteiro (transcrição comparada com o `narracao.md`)
- [ ] Rótulos correspondem à imagem (o "Cozinha" mostra a cozinha)
- [ ] Renders e imagens de terceiros com aviso ("Imagem ilustrativa", créditos)

## Imagem

- [ ] Quadros de revisão (stills) de todas as cenas e do meio de cada transição
- [ ] Nada importante fora da **zona segura** da plataforma (no Reels: ~250 px livres no topo e ~420 px embaixo)
- [ ] Texto legível no celular: corpo mínimo ~42 px em 1080 de largura, contraste suficiente
- [ ] Sem bordas pretas, quadros congelados, piscadas de legenda ou cortes no meio de movimento
- [ ] Horizonte reto, cor coerente entre os planos, sem tremido evidente
- [ ] Logo e marca nos lugares e tamanhos do kit

## Som

- [ ] Loudness -14 LUFS integrado (±1), pico real ≤ -1 dBTP (`npm run estudio -- NNN medir <arquivo>`)
- [ ] Música abaixo da voz, sem estalos nos cortes, final sem corte seco
- [ ] Licença da música registrada no plano

## Arquivo

- [ ] MP4 H.264 High, yuv420p, AAC 48 kHz, faststart (saída do `finalizar.py`)
- [ ] Resolução, fps e duração conforme o plano
- [ ] Capa na proporção do post; no Reels, o centro funciona no recorte 1:1 do grid
- [ ] Entregáveis em `6_entregas/REVnn/`, com o mesmo REV no nome; nada sobrescrito

## Não conferido (diga sempre)

- Escuta humana completa? Prévia na interface real da plataforma? Teste em celular?
