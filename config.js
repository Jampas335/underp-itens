/**
 * ============================================================
 *  CONFIGURAÇÃO DO SITE — underRP Item Workbench
 * ============================================================
 *
 *  Altere as configurações abaixo conforme seu repositório.
 *  Após fazer deploy no GitHub Pages, atualize a BASE_URL.
 *
 * ============================================================
 */

const CONFIG = {
    // ===========================================
    // URL BASE DO SEU GITHUB PAGES
    // ===========================================
    BASE_URL: "https://jampas335.github.io/underp-itens",

    // ===========================================
    // PASTA DOS ÍCONES PENDENTES
    // ===========================================
    ICONS_FOLDER: "icons",

    // ===========================================
    // EXTENSÃO PADRÃO DOS ÍCONES
    // ===========================================
    ICON_EXTENSION: "png",

    // ===========================================
    // TÍTULO E SUBTÍTULO DO SITE
    // ===========================================
    SITE_TITLE: "underRP",
    SITE_SUBTITLE: "Item Workbench",

    // ===========================================
    // GITHUB API — Persistência de Itens Prontos
    // ===========================================
    // Usado para salvar/carregar itens prontos via GitHub API.
    // Todos que entrarem no site verão os itens publicados.
    GITHUB_OWNER: "Jampas335",
    GITHUB_REPO: "underp-itens",

    // Caminho do JSON de itens prontos no repositório
    READY_ITEMS_PATH: "data/ready-items.json",

    // Pasta dos ícones uploadados para itens prontos
    READY_ICONS_FOLDER: "ready-items/icons",

    IMPLEMENTED_ITEMS_PATH: "implemented-items.js",
    IMPLEMENTED_ICONS_FOLDER: "server-icons",
    IMPLEMENTED_REMOVALS_PATH: "data/implemented-removed.json",
};
