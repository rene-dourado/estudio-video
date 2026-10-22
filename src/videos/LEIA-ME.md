# src/videos/

Uma pasta por vídeo: `src/videos/<NNN>-<slug>/index.tsx`, com o mesmo número da pasta do projeto em `dados/projetos/<NNN - nome>/`.

- O `index.tsx` exporta `Composicoes`, um componente com uma ou mais `<Composition>` (vídeo, capa, versões).
- O `scripts/estudio.mjs` gera `registro.tsx` sozinho; não registre nada à mão no `Root.tsx`.
- `staticFile('1_brutos/arquivo.mp4')` aponta para a pasta do projeto, porque o estúdio usa essa pasta como pasta pública.
- Esta pasta fica **fora do Git**, exceto o `_exemplo/` e este arquivo: o conteúdo dos seus vídeos (textos, dados, nomes) não vai para o GitHub. A cada `render`, uma cópia do código vai para `5_trabalho/codigo/REVnn/` do projeto.
