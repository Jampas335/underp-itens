# UnderCity Item Workbench

Ferramenta estática usada para consultar, editar e publicar itens prontos para o `prea-inventory`.

## Fluxo atual

- A aba `Prontos` é o catálogo oficial dos itens finalizados.
- Cada item pronto usa um ícone próprio em `ready-items/icons/`.
- O builder permite editar os dados, usar outro item pronto como template e gerar o export Lua.
- Itens prontos ficam sincronizados no GitHub em `data/ready-items.json`.
- O export público fica em `data/ready-items-export.json`.

## Arquivos principais

- `app.js`: interface, filtros, builder, export e integração com GitHub
- `config.js`: configuração do repositório e da pasta de ícones próprios
- `data/ready-items.json`: catálogo compartilhado de itens prontos
- `data/ready-items-export.json`: catálogo público para outros sites
- `ready-items/icons/`: imagens dos itens prontos

## Publicação

1. Configure um Personal Access Token do GitHub com `Contents: Read and write`.
2. Edite ou crie o item no builder.
3. Selecione um ícone próprio ou mantenha o ícone atual do pronto.
4. Copie o export Lua para `prea-inventory/shared/items.lua`.
5. Clique em `Publicar como Pronto`.

O site usa a API de conteúdo do GitHub para salvar o catálogo e os ícones próprios. O export público pode ser consumido assim:

```js
const response = await fetch(
    "https://jampas335.github.io/underp-itens/data/ready-items-export.json",
    { cache: "no-store" }
);
const catalog = await response.json();
const readyItems = catalog.items;
```
