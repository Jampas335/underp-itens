# 🎮 UnderCity - Catálogo de Ícones

Site estático para GitHub Pages que serve como catálogo de ícones de itens para inventário FiveM.

## 🚀 Como Funciona

Os ícones ficam hospedados no GitHub Pages e podem ser acessados diretamente via URL no seu script FiveM — **sem precisar baixar os ícones para o script**.

### Estrutura do Link
```
https://seu-usuario.github.io/seu-repo/icons/nome-do-item.png
```

Basta trocar `nome-do-item` pelo nome do ícone!

---

## 📦 Como Adicionar Ícones

### 1. Coloque o arquivo `.png` na pasta `/icons/`
```
/icons/weapon_pistol.png
/icons/bread.png
/icons/lockpick.png
```

### 2. Registre o ícone no arquivo `icons.js`
```javascript
const ICONS = {
    "Armas": [
        "weapon_pistol",  // ← nome do arquivo SEM a extensão
        "weapon_smg",
    ],
    "Comida": [
        "bread",
        "water",
    ],
    // Adicione mais categorias...
};
```

### 3. Commit e Push
```bash
git add .
git commit -m "Adicionando novos ícones"
git push
```

Pronto! O ícone já estará disponível via URL.

---

## ⚙️ Configuração Inicial

### 1. Edite o arquivo `config.js`

```javascript
const CONFIG = {
    BASE_URL: "https://seu-usuario.github.io/seu-repo",  // ← Sua URL do GitHub Pages
    ICONS_FOLDER: "icons",                                  // ← Pasta dos ícones
    ICON_EXTENSION: "png",                                  // ← Extensão (png, webp, jpg)
};
```

### 2. Ative o GitHub Pages
1. Vá em **Settings** → **Pages** no repositório
2. Em **Source**, selecione a branch `main`
3. Em **Folder**, selecione `/ (root)`
4. Clique em **Save**

### 3. Aguarde o deploy (1-2 minutos)

---

## 🎮 Uso no FiveM (ox_inventory)

No seu script, use a URL direta do ícone:

```lua
-- Exemplo de uso no ox_inventory / qb-inventory
local iconUrl = "https://seu-usuario.github.io/seu-repo/icons/weapon_pistol.png"
```

Cada ícone segue a mesma estrutura de URL. Só muda o nome no final!

---

## 📁 Estrutura do Projeto

```
Site/
├── index.html          # Página principal
├── style.css           # Estilos
├── config.js           # ⚙️ Configuração (URL base, etc)
├── icons.js            # 📋 Registro dos ícones + categorias
├── app.js              # Lógica do catálogo
├── icons/              # 🖼️ Pasta com os ícones PNG
│   ├── weapon_pistol.png
│   ├── bread.png
│   └── ...
└── README.md
```

---

## 💡 Dicas

- **Nomes dos ícones**: Use nomes em minúsculo, sem espaço, com `_` (underscore). Ex: `weapon_pistol`, `energy_drink`
- **Tamanho recomendado**: 128x128 ou 256x256 pixels, PNG com fundo transparente
- **Categorias**: Crie quantas categorias quiser no `icons.js`
- **Performance**: Use `.webp` ao invés de `.png` para ícones menores e mais rápidos
