# UnderCity Item Workbench

Ferramenta estatica para GitHub Pages usada para organizar icones pendentes, visualizar os itens ja existentes do `prea-inventory` e gerar exports Lua prontos para colar no servidor.

## O que o site faz

- `Icones/itens para implementar`: usa os icones registrados em `icons.js` e os PNGs da pasta `icons/`.
- `Icones/itens implementados`: usa um snapshot gerado a partir do `prea-inventory`.
- `Criador de item`: permite pegar um item pendente, travar a imagem dele e montar a estrutura completa do item.
- `Copiar export`: gera a entrada Lua no formato usado em `shared/items.lua`.
- `Salvar como implementado`: move o item do fluxo pendente para o fluxo implementado localmente no navegador.

## Estrutura do prea-inventory

O servidor atual usa `ItemList` no arquivo:

`C:\Users\noobg\Desktop\UnderCity\txData\Qbox_A4EC90.base\resources\[essenciais]\prea-inventory\shared\items.lua`

Os itens seguem este formato base:

```lua
['nome_do_item'] = {
    ['name'] = 'nome_do_item',
    ['label'] = 'Nome visivel',
    ['weight'] = 100,
    ['type'] = 'item',
    ['image'] = 'nome_do_item.png',
    ['unique'] = false,
    ['useable'] = false,
    ['shouldClose'] = true,
    ['description'] = 'Descricao opcional',
    ['rarity'] = 'common',
},
```

Campos extras usados no recurso tambem aparecem no builder, por exemplo:

- `ammotype`
- `decay`
- `consume`
- `allowArmed`
- blocos extras em Lua como `prop`, `object`, `carryInHand`, `carryAttachment`, `carryAnim`, `allowInBackpack`

## Arquivos principais

- `icons.js`: catalogo dos itens pendentes
- `icons/`: imagens pendentes
- `implemented-items.js`: snapshot gerado dos itens do servidor
- `server-icons/`: imagens copiadas do `prea-inventory` quando existirem
- `sync-implemented-items.js`: script que le o recurso do servidor e gera o snapshot do site
- `app.js`: interface, filtros, builder, export e estado local

## Como atualizar os itens implementados do servidor

Sempre que o `prea-inventory` mudar, gere um novo snapshot:

```bash
node sync-implemented-items.js
```

Esse comando:

1. Le `shared/items.lua`
2. Mescla `shared/v_compat_items.lua`
3. Le `shared/generated_qbx_items.lua`
4. Aplica `shared/z_runtime_overrides.lua`
5. Gera `implemented-items.js`
6. Copia para `server-icons/` as imagens encontradas no inventario

Depois disso, publique normalmente:

```bash
git add .
git commit -m "feat: update item workbench snapshot"
git push
```

## Fluxo de uso

1. Abra um item em `Icones/itens para implementar`.
2. Use um item ja implementado como template, se quiser reaproveitar parametros.
3. Ajuste nome, label, peso, raridade e campos avancados.
4. Copie o export Lua.
5. Cole no `shared/items.lua` do `prea-inventory`.
6. Garanta que a imagem exista em `prea-inventory/html/images`.
7. Salve como implementado no site para tirar o item da fila pendente local.

## Estado local

- Os itens marcados como implementados no site ficam salvos em `localStorage`.
- Isso organiza seu fluxo nesta maquina e neste navegador.
- Para refletir no servidor de verdade, ainda e preciso colar o export no `prea-inventory`.
- Para refletir no catalogo publicado para todos, gere novo snapshot e publique no GitHub Pages.

## Observacoes

- A imagem do item criado fica presa ao icone pendente escolhido.
- O builder permite alterar todos os parametros, exceto a foto.
- Nem todo item do servidor tem imagem sincronizada para o site. Quando a imagem nao existir, a interface usa fallback visual.
