# Identidade visual: o estilo de cada vídeo

O estilo **não vem de uma lista fixa**. Em cada projeto ele nasce de três fontes, nesta ordem:

1. o **kit da marca** (`2_referencias_estilo/marca/`): cores, fontes, logos, tom de voz, o que usar e o que evitar;
2. as **referências** que você colocou em `2_referencias_estilo/` (prints, vídeos, posts, sites) e o que você disse que gosta ou não gosta nelas;
3. o **briefing**: finalidade, público e a sensação desejada.

A galeria em [estilos/](../estilos/README.md) mostra o que o projeto original já fez. Serve para inspirar e para mostrar o que é possível, nunca como o estilo obrigatório.

## Kits de marca

Um kit fica em `<dados>/marcas/<marca>/` e é copiado para o projeto quando ele é criado com `--marca`. O projeto guarda a identidade como ela era naquele vídeo, mesmo que o kit mude depois.

```text
marcas/<marca>/
├─ marca.json     cores, fontes, logos, contatos, assinatura, avisos, tom de voz, preferências
├─ logos/         PNG com fundo transparente (versões para fundo claro e escuro, símbolo)
├─ fontes/        TTF/OTF com licença de uso (OFL, comercial)
└─ referencias/   (opcional) peças aprovadas da marca, para manter a coerência
```

Modelo em [modelos/marca-exemplo/marca.json](../modelos/marca-exemplo/marca.json). No código: `const marca = useMarca()` (`src/_shared/marca.ts`) carrega o JSON e registra as fontes; `arquivoMarca('logos/logo.png')` dá o caminho de um logo.

**Marca nova?** O diretor monta o kit a partir das referências: extrai a paleta (cores dominantes e de destaque), sugere pares de fontes com licença livre, define o tom de voz. Tudo passa pela sua aprovação antes de virar `marca.json`.

## Como o diretor traduz referências em decisões

Para cada referência, ele descreve o que a torna boa e transforma em decisões verificáveis:

| Camada | Exemplos de decisão |
|---|---|
| **Paleta** | fundo, texto, destaque e apoio em HEX; proporção (ex.: 70% neutro, 25% foto, 5% destaque) |
| **Tipografia** | famílias, pesos, caixa alta ou não, espaçamento entre letras, tamanho mínimo no celular |
| **Movimento** | velocidade dos zooms, entradas (máscara, fade, deslize, letra a letra), curva (suave, sem quique, ou com mola) |
| **Transições** | corte seco, fade curto, whip, slide, zoom, máscara de forma; quando usar cada uma |
| **Textura** | grão, vinheta, luz vazada, papel, desfoque, correção de cor (quente, fria, contrastada) |
| **Composição** | onde ficam título, rótulos, logo, CTA; margens; grade |
| **Densidade** | quanta coisa por vez na tela: sutil, equilibrada, intensa |

O resultado vai para a seção *Direção de estilo* do `plano.md`, com a coluna "de onde veio" (qual referência ou item do kit justificou a escolha).

## Repertório de linguagens (para conversar)

Exemplos de direções que o estúdio consegue fazer. Combine à vontade:

- **Editorial sofisticado:** serifas elegantes, muito respiro, filetes finos, zooms lentos, fades.
- **Minimal suíço:** grade rígida, sem serifa, preto e branco com um destaque, cortes secos.
- **Urbano/energético:** tipografia pesada, cortes no ritmo, whips e slides, legendas palavra a palavra.
- **Documental/técnico:** rótulos com dados, linhas de cota, plantas que se montam, câmera estável.
- **Aconchegante/lifestyle:** tons quentes, luz natural, textos curtos manuscritos ou serifados, música acústica.
- **Luxo/noturno:** fundo escuro, dourado ou champanhe, brilhos sutis, movimento muito lento.
- **Cinemático:** barras de proporção, correção de cor marcada, grão, títulos grandes e raros.
- **Ilustrado/papel:** recortes, colagem, texturas (ver a galeria do projeto original).

## Conferência de estilo

- Os stills de cenas diferentes parecem do **mesmo vídeo**?
- O logo e as cores estão como no kit (sem distorcer, sem trocar tons)?
- Os textos são legíveis no celular, em cima de imagens claras e escuras?
- Cada efeito tem função, ou só enfeita?
