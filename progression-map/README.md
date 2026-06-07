# underRP Progression Map

Mapa economico visual para organizar cadeias de itens do servidor.

## Rodar localmente

Como o app usa ES modules por CDN e busca o JSON publico dos itens, abra por um servidor local:

```bash
python -m http.server 5174
```

Depois acesse:

```txt
http://localhost:5174/
```

## Fonte de itens

O painel lateral consome:

```txt
https://jampas335.github.io/underp-itens/data/ready-items-export.json
```

## Persistencia do mapa

O mapa carrega publicamente de:

```txt
https://jampas335.github.io/underp-itens/data/progression-map.json
```

Para salvar alteracoes de qualquer maquina, conecte um GitHub PAT no painel. A escrita usa a GitHub Contents API no arquivo `data/progression-map.json` do repositorio `Jampas335/underp-itens`.

O token precisa ser Fine-grained com:

- Resource owner: `Jampas335`
- Repository access: `underp-itens`
- Repository permissions: `Contents` como `Read and write`

O usuario dono do token tambem precisa ter acesso `Write` ou `Admin` no repositorio.

Sem token, o app abre em modo leitura e ainda mantem uma copia local em `localStorage`.

## Modelo visual

Os itens nao sao nodes soltos por padrao. Cada bloco de atividade, trabalho, craft ou mercado possui slots internos:

- `Requisitos`: itens consumidos ou necessarios para executar o bloco.
- `Recompensas`: itens gerados pelo bloco.

Arraste um item da lateral diretamente para um desses slots.
