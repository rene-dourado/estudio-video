# dados/

Pasta padrão dos seus vídeos e marcas, quando o `estudio.local.json` não aponta para outro lugar. Tudo aqui fica **fora do Git**.

```text
dados/
├─ marcas/<marca>/        kits de identidade (marca.json, logos/, fontes/)
└─ projetos/001 - nome/   um vídeo por pasta, criada com npm run novo -- "nome"
```

Para guardar os vídeos numa pasta com backup (OneDrive, por exemplo), crie o `estudio.local.json` na raiz do estúdio:

```json
{"dados": "~/OneDrive/Documentos/Videos"}
```
