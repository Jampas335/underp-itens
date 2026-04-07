// ============================================================
//  underRP Item Workbench — app.js
// ============================================================

const STORAGE_KEY = "underrp-item-workbench-v1";
const GITHUB_TOKEN_KEY = "underrp-github-token";
const GITHUB_TOKEN_MASK = "••••••••••••••••••••";
const GITHUB_API_VERSION = "2022-11-28";
const DEFAULT_VIEW = "pending";
const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"];
const TYPE_ORDER = ["all", "item", "weapon"];
const IMPLEMENTED_PAGE_SIZE = 48;
const DEFAULT_CATEGORY_HINTS = [];

// Categorias extraídas do ICONS (prea-inventory) para organização no site
function buildCategoryList() {
    const cats = new Set();
    if (typeof ICONS !== "undefined") {
        for (const cat of Object.keys(ICONS)) addCategoryToSet(cats, cat);
    }
    // Categorias extras comuns
    ["Armas", "Ferramentas", "Comida", "Bebidas", "Drogas", "Médico", "Mecânica", "Documentos", "Eletrônica", "Policial", "Munição", "Attachments", "Skins", "Outros"].forEach(c => cats.add(c));
    DEFAULT_CATEGORY_HINTS.forEach((category) => addCategoryToSet(cats, category));
    (state.customCategories || []).forEach((category) => addCategoryToSet(cats, category));
    collectItemCategories(state.baseImplementedItems, cats);
    collectItemCategories(Object.values(state.customImplemented || {}), cats);
    collectItemCategories(state.readyItems, cats);
    addCategoryToSet(cats, state.builder?.form?.siteCategory);
    return Array.from(cats).sort((a, b) => a.localeCompare(b, "pt-BR"));
}
let CATEGORY_LIST = [];

const ITEM_EXPORT_ORDER = [
    "name", "label", "weight", "type", "image",
    "unique", "useable", "shouldClose", "description",
    "rarity", "decay", "ammotype", "consume", "allowArmed", "allowInBackpack",
];

const ITEM_META_KEYS = new Set([
    "source", "pendingIconName", "pendingCategory",
    "savedAt", "extraLua", "imageSource", "iconSource",
    "createdAt", "status", "uploadedIconBase64",
    "uploadedIconMime", "uploadedIconFileName",
    "siteCategory", "stack",
]);

// ============================================================
//  STATE
// ============================================================

const state = {
    activeView: DEFAULT_VIEW,
    pendingSearch: "",
    implementedSearch: "",
    readySearch: "",
    pendingCategory: "all",
    implementedType: "all",
    implementedRarity: "all",
    implementedCategory: "all",
    readyType: "all",
    readyRarity: "all",
    readyCategory: "all",
    implementedPage: 0,
    basePendingItems: [],
    baseImplementedItems: [],
    customImplemented: {},
    customCategories: [],
    archivedPending: [],
    readyItems: [],
    readyItemsSha: null,
    readyLoaded: false,
    readyLoading: false,
    builder: {
        activePendingName: null,
        editingLocalName: null,
        editingReadyName: null,
        templateName: null,
        templateSource: null,
        form: null,
        iconSource: "pending",
        uploadedIconBase64: null,
        uploadedIconMime: "image/png",
        uploadedIconFileName: null,
    },
};

let toastTimeout = null;

function normalizeCategoryName(value) {
    return String(value || "").trim();
}

function addCategoryToSet(targetSet, value) {
    const normalized = normalizeCategoryName(value);
    if (normalized) targetSet.add(normalized);
}

function collectItemCategories(items, targetSet) {
    for (const item of items || []) {
        addCategoryToSet(targetSet, item?.siteCategory);
        addCategoryToSet(targetSet, item?.pendingCategory);
        addCategoryToSet(targetSet, item?.category);
    }
}

function hasRegisteredCategory(value) {
    const normalized = normalizeCategoryName(value).toLowerCase();
    if (!normalized) return false;
    return (state.customCategories || []).some((category) => category.toLowerCase() === normalized);
}

function registerCategory(value) {
    const normalized = normalizeCategoryName(value);
    if (!normalized || hasRegisteredCategory(normalized)) return false;
    state.customCategories.push(normalized);
    state.customCategories.sort((a, b) => a.localeCompare(b, "pt-BR"));
    refreshCategoryRegistry();
    return true;
}

function refreshCategoryRegistry() {
    CATEGORY_LIST = buildCategoryList();
    syncCategorySelectOptions();
}

function syncCategorySelectOptions() {
    const select = document.getElementById("itemCategorySelect");
    if (!select) return;

    const customInput = document.getElementById("itemCategoryCustomInput");
    const currentSelectValue = select.value;
    const currentCustomValue = customInput ? customInput.value : "";
    const activeCategory = currentSelectValue === "__custom__"
        ? currentCustomValue
        : (state.builder.form?.siteCategory || currentSelectValue || "");

    select.innerHTML = `
        <option value="">Sem categoria</option>
        ${CATEGORY_LIST.map((category) => `<option value="${escapeHtmlAttribute(category)}">${escapeHtml(category)}</option>`).join("")}
        <option value="__custom__">+ Categoria personalizada...</option>
    `;

    const hasOption = CATEGORY_LIST.some((category) => category === activeCategory);
    if (activeCategory && !hasOption) {
        select.value = "__custom__";
        if (customInput) {
            customInput.classList.remove("hidden");
            customInput.value = activeCategory;
        }
        return;
    }

    select.value = activeCategory || "";
    if (customInput) {
        customInput.classList.add("hidden");
        customInput.value = "";
    }
}

// ============================================================
//  INIT
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    bootstrapData();
    loadWorkspaceState();
    ensureCurrentReadyIconOption();
    ensureAllowInBackpackField();
    ensureStackableField();
    ensureCategoryField();
    ensureLuaImportPanel();
    ensureReadyBatchExportButton();
    ensureImplementedCategoryFilter();
    ensureReadyCategoryFilter();
    bindEvents();
    renderAll();
    initFadeInObserver();
    updateTokenIndicator();
});

function bootstrapData() {
    applyBranding();
    state.basePendingItems = flattenPendingItems();
    state.baseImplementedItems = (IMPLEMENTED_ITEMS || []).map(normalizeImplementedItem);
    refreshCategoryRegistry();
}

function applyBranding() {
    const title = CONFIG.SITE_TITLE || "underRP";
    const subtitle = CONFIG.SITE_SUBTITLE || "Item Workbench";
    document.title = `${title} | ${subtitle}`;
    setText("siteTitle", title);
    setText("siteSubtitle", subtitle);
    const repoEl = document.getElementById("modalRepoName");
    if (repoEl) repoEl.textContent = `${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}`;
}

function ensureAllowInBackpackField() {
    if (document.getElementById("itemAllowInBackpackSelect")) return;

    const allowArmedSelect = document.getElementById("itemAllowArmedSelect");
    const templateField = document.getElementById("templateSummary")?.closest(".field");
    const grid = allowArmedSelect?.closest(".field-grid");
    if (!allowArmedSelect || !templateField || !grid) return;

    grid.classList.remove("two-cols");
    grid.classList.add("three-cols");

    const wrapper = document.createElement("label");
    wrapper.className = "field";
    wrapper.innerHTML = `
        <span>allowInBackpack <i class="info-tip" data-tip="Se o item pode ser guardado dentro de mochila.">i</i></span>
        <select id="itemAllowInBackpackSelect">
            <option value="">Nao definir</option>
            <option value="true">true</option>
            <option value="false">false</option>
        </select>
    `;
    grid.insertBefore(wrapper, templateField);
}

function ensureCurrentReadyIconOption() {
    if (document.getElementById("iconSourceReady")) return;

    const pendingOption = document.getElementById("iconSourcePending")?.closest(".icon-source-opt");
    const options = pendingOption?.parentElement;
    if (!pendingOption || !options) return;

    const wrapper = document.createElement("label");
    wrapper.className = "icon-source-opt hidden";
    wrapper.id = "iconSourceReadyWrap";
    wrapper.innerHTML = `
        <input type="radio" name="iconSource" id="iconSourceReady" value="ready">
        <span>Usar icone atual do pronto</span>
    `;
    options.insertBefore(wrapper, pendingOption);
}

function ensureStackableField() {
    if (document.getElementById("itemStackableInput")) return;

    const uniqueToggle = document.getElementById("itemUniqueInput")?.closest(".toggle");
    const useableToggle = document.getElementById("itemUseableInput")?.closest(".toggle");
    const toggleGrid = uniqueToggle?.parentElement;
    if (!uniqueToggle || !useableToggle || !toggleGrid) return;

    uniqueToggle.title = "No prea-inventory, unique = true faz o item nao empilhar.";
    const uniqueLabel = uniqueToggle.querySelector("span");
    if (uniqueLabel) {
        uniqueLabel.innerHTML = `unique <i class="info-tip" data-tip="No prea-inventory, unique = true faz o item nao empilhar e ocupar um slot proprio.">i</i>`;
    }

    const wrapper = document.createElement("label");
    wrapper.className = "toggle";
    wrapper.title = "No prea-inventory, item empilhavel significa unique = false";
    wrapper.innerHTML = `
        <input type="checkbox" id="itemStackableInput" checked>
        <span>stackable <i class="info-tip" data-tip="Controle visual de empilhamento. Quando marcado, o export sai com unique = false.">i</i></span>
    `;
    toggleGrid.insertBefore(wrapper, uniqueToggle);
}

function ensureCategoryField() {
    if (document.getElementById("itemCategorySelect")) return;

    const descField = document.getElementById("itemDescriptionInput")?.closest(".field");
    if (!descField) return;

    const wrapper = document.createElement("label");
    wrapper.className = "field";
    wrapper.innerHTML = `
        <span>Categoria <i class="info-tip" data-tip="Categoria para organização no site. Não afeta nada no servidor — é puramente visual para filtrar e agrupar itens.">i</i></span>
        <div class="category-input-row">
            <select id="itemCategorySelect">
                <option value="">Sem categoria</option>
                ${CATEGORY_LIST.map(c => `<option value="${escapeHtmlAttribute(c)}">${escapeHtml(c)}</option>`).join("")}
                <option value="__custom__">+ Categoria personalizada...</option>
            </select>
            <input type="text" id="itemCategoryCustomInput" class="hidden" placeholder="Nome da categoria...">
        </div>
    `;
    descField.insertAdjacentElement("afterend", wrapper);

    // Handle custom category toggle
    const select = wrapper.querySelector("#itemCategorySelect");
    const customInput = wrapper.querySelector("#itemCategoryCustomInput");
    select.addEventListener("change", () => {
        if (select.value === "__custom__") {
            customInput.classList.remove("hidden");
            customInput.focus();
        } else {
            customInput.classList.add("hidden");
            customInput.value = "";
        }
    });

    syncCategorySelectOptions();
}

function ensureImplementedCategoryFilter() {
    const filterStack = document.querySelector("#implementedView .filter-stack");
    if (!filterStack || document.getElementById("implementedCategoryFilter")) return;

    const block = document.createElement("div");
    block.className = "filter-block";
    block.innerHTML = `
        <span class="filter-title">Categoria</span>
        <div class="chip-group" id="implementedCategoryFilter"></div>
    `;
    filterStack.appendChild(block);
}

function ensureReadyCategoryFilter() {
    const filterStack = document.querySelector("#readyView .filter-stack");
    if (!filterStack || document.getElementById("readyCategoryFilter")) return;

    const block = document.createElement("div");
    block.className = "filter-block";
    block.innerHTML = `
        <span class="filter-title">Categoria</span>
        <div class="chip-group" id="readyCategoryFilter"></div>
    `;
    filterStack.appendChild(block);
}

function ensureLuaImportPanel() {
    if (document.getElementById("pasteLuaBtn")) return;

    const actions = document.querySelector(".builder-helper-actions");
    if (!actions) return;

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.id = "pasteLuaBtn";
    toggleBtn.className = "ghost-btn";
    toggleBtn.textContent = "Colar Lua";
    actions.appendChild(toggleBtn);

    const panel = document.createElement("section");
    panel.id = "luaImportPanel";
    panel.className = "lua-import-panel hidden";
    panel.innerHTML = `
        <label class="field">
            <span>Importar bloco Lua <i class="info-tip" data-tip="Cole um item do shared/items.lua para aplicar os parametros no builder atual.">i</i></span>
            <textarea id="luaImportTextarea" rows="10" placeholder="['item_exemplo'] = {
    ['name'] = 'item_exemplo',
    ['label'] = 'Item Exemplo',
    ['weight'] = 1000,
    ['type'] = 'item',
    ['carryInHand'] = true,
},"></textarea>
        </label>
        <div class="lua-import-actions">
            <button class="ghost-btn" id="applyLuaImportBtn" type="button">Aplicar no builder</button>
            <button class="ghost-btn ghost-danger" id="clearLuaImportBtn" type="button">Limpar texto</button>
        </div>
    `;
    actions.insertAdjacentElement("afterend", panel);
}

function ensureReadyBatchExportButton() {
    if (document.getElementById("copyAllReadyExportsBtn")) return;
    const refreshBtn = document.getElementById("refreshReadyBtn");
    if (!refreshBtn || !refreshBtn.parentElement) return;

    const button = document.createElement("button");
    button.type = "button";
    button.id = "copyAllReadyExportsBtn";
    button.className = "ghost-btn ready-refresh-btn";
    button.title = "Copiar todos os itens prontos em um bloco Lua";
    button.textContent = "Copiar todos";
    refreshBtn.insertAdjacentElement("afterend", button);
}

function flattenPendingItems() {
    const items = [];
    for (const [category, names] of Object.entries(ICONS)) {
        for (const name of names) {
            items.push({
                name,
                category,
                image: `${name}.${CONFIG.ICON_EXTENSION}`,
                displayPath: `${CONFIG.ICONS_FOLDER}/${name}.${CONFIG.ICON_EXTENSION}`,
                url: `${CONFIG.BASE_URL}/${CONFIG.ICONS_FOLDER}/${name}.${CONFIG.ICON_EXTENSION}`,
            });
        }
    }
    return items.sort((a, b) => {
        const catCmp = a.category.localeCompare(b.category, "pt-BR");
        return catCmp !== 0 ? catCmp : a.name.localeCompare(b.name, "pt-BR");
    });
}

function normalizeImplementedItem(item) {
    return {
        ...item,
        name: item.name || "",
        label: item.label || item.name || "",
        description: item.description || "",
        weight: Number(item.weight || 0),
        type: item.type || "item",
        image: item.image || `${item.name}.png`,
        unique: readItemUniqueValue(item),
        useable: Boolean(item.useable),
        shouldClose: item.shouldClose !== false,
        rarity: item.rarity || "common",
        source: item.source || "shared",
    };
}

function normalizeLocalItem(item) {
    return {
        ...normalizeImplementedItem(item),
        source: "local",
        pendingIconName: item.pendingIconName || stripExtension(item.image || ""),
        pendingCategory: item.pendingCategory || "Local",
        extraLua: item.extraLua || "",
        savedAt: item.savedAt || new Date().toISOString(),
        imageSource: item.imageSource || "pending",
        iconSource: item.iconSource || (item.pendingIconName ? "pending" : "upload"),
        uploadedIconBase64: item.uploadedIconBase64 || null,
        uploadedIconMime: item.uploadedIconMime || "image/png",
        uploadedIconFileName: item.uploadedIconFileName || "",
    };
}

function readItemUniqueValue(item, fallback = false) {
    if (item && typeof item.unique === "boolean") return item.unique;
    if (item && typeof item.stack === "boolean") return !item.stack;
    return fallback;
}

function syncStackingControls(source = "unique") {
    const uniqueInput = document.getElementById("itemUniqueInput");
    const stackableInput = document.getElementById("itemStackableInput");
    if (!uniqueInput || !stackableInput) return;

    if (source === "stackable") {
        uniqueInput.checked = !stackableInput.checked;
        return;
    }

    stackableInput.checked = !uniqueInput.checked;
}

// ============================================================
//  PERSISTENCE — LOCAL STORAGE
// ============================================================

function loadWorkspaceState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        state.customImplemented = Object.fromEntries(
            Object.entries(parsed.customImplemented || {}).map(([name, item]) => [
                name, normalizeLocalItem(item),
            ])
        );
        state.customCategories = Array.isArray(parsed.customCategories)
            ? Array.from(new Set(parsed.customCategories.map(normalizeCategoryName).filter(Boolean)))
                .sort((a, b) => a.localeCompare(b, "pt-BR"))
            : [];
        state.archivedPending = Array.isArray(parsed.archivedPending)
            ? parsed.archivedPending.filter(Boolean)
            : [];
        refreshCategoryRegistry();
    } catch (err) {
        console.error("Falha ao carregar estado local:", err);
    }
}

function saveWorkspaceState() {
    const payload = {
        customImplemented: state.customImplemented,
        customCategories: state.customCategories,
        archivedPending: Array.from(new Set(state.archivedPending)).sort(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

// ============================================================
//  GITHUB API
// ============================================================

function getGitHubToken() {
    return localStorage.getItem(GITHUB_TOKEN_KEY) || "";
}

function setGitHubToken(token) {
    if (token) {
        localStorage.setItem(GITHUB_TOKEN_KEY, token.trim());
    } else {
        localStorage.removeItem(GITHUB_TOKEN_KEY);
    }
    updateTokenIndicator();
}

function updateTokenIndicator() {
    const dot = document.getElementById("tokenDot");
    if (!dot) return;
    const hasToken = Boolean(getGitHubToken());
    dot.className = "token-dot " + (hasToken ? "token-dot-on" : "token-dot-off");
    dot.title = hasToken ? "Token configurado" : "Token não configurado";
}

function getGitHubHeaders(tokenOverride = null, includeJson = false) {
    const headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
    };
    const token = tokenOverride ?? getGitHubToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (includeJson) headers["Content-Type"] = "application/json";
    return headers;
}

async function parseGitHubApiError(resp) {
    const body = await resp.json().catch(() => ({}));
    const acceptedPermissions = resp.headers.get("x-accepted-github-permissions");
    const oauthScopes = resp.headers.get("x-oauth-scopes");
    let message = body.message || `GitHub API ${resp.status}`;
    if (acceptedPermissions) message += ` | Permissoes exigidas: ${acceptedPermissions}`;
    if (oauthScopes) message += ` | Escopos/token atual: ${oauthScopes}`;
    if (/Resource not accessible by personal access token/i.test(message)) {
        message += ` | Revise o PAT: Resource owner = ${CONFIG.GITHUB_OWNER}, acesso ao repositorio ${CONFIG.GITHUB_REPO} e permissao Contents: Read and write.`;
    }
    return message;
}

function isMaskedGitHubTokenValue(value) {
    return value === GITHUB_TOKEN_MASK;
}

async function validateGitHubToken(token) {
    const url = `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}`;
    const resp = await fetch(url, { headers: getGitHubHeaders(token) });
    if (!resp.ok) {
        throw new Error(await parseGitHubApiError(resp));
    }
    const data = await resp.json();
    const hasPushPermission = data.permissions ? data.permissions.push !== false : null;
    return {
        fullName: data.full_name || `${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}`,
        hasPushPermission,
    };
}

async function githubGetFile(path, options = {}) {
    const bustCache = options.bustCache === true;
    const cacheParam = bustCache ? `${path.includes("?") ? "&" : "?"}t=${Date.now()}` : "";
    const url = `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${path}${cacheParam}`;
    const token = getGitHubToken();
    let resp = await fetch(url, { headers: getGitHubHeaders(token), cache: "no-store" });
    if ((resp.status === 401 || resp.status === 403) && token) {
        resp = await fetch(url, { headers: getGitHubHeaders(""), cache: "no-store" });
    }
    if (resp.status === 404) return null;
    if (!resp.ok) {
        throw new Error(await parseGitHubApiError(resp));
    }
    return resp.json();
}

async function githubPutFile(path, base64Content, sha, message) {
    const token = getGitHubToken();
    if (!token) throw new Error("Token do GitHub não configurado. Clique em 'GitHub' no topo para configurar.");

    const url = `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${path}`;
    const body = { message, content: base64Content };
    if (sha) body.sha = sha;

    const resp = await fetch(url, {
        method: "PUT",
        headers: getGitHubHeaders(token, true),
        body: JSON.stringify(body),
    });

    if (!resp.ok) {
        throw new Error(await parseGitHubApiError(resp));
    }
    return resp.json();
}

async function githubDeleteFile(path, sha, message) {
    const token = getGitHubToken();
    if (!token) throw new Error("Token do GitHub não configurado.");

    const url = `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${path}`;
    const resp = await fetch(url, {
        method: "DELETE",
        headers: getGitHubHeaders(token, true),
        body: JSON.stringify({ message, sha }),
    });
    if (!resp.ok) {
        throw new Error(await parseGitHubApiError(resp));
    }
    return resp.json();
}

// ============================================================
//  READY ITEMS — LOAD / SAVE / DELETE
// ============================================================

async function loadReadyItems(options = {}) {
    const {
        bustCache = true,
        silent = false,
        preserveSearch = true,
        revealName = "",
        statusPrefix = "",
    } = options;
    if (state.readyLoading) return;
    state.readyLoading = true;
    if (!silent) renderReadyStatusBar("Carregando do GitHub...", "loading");

    try {
        const file = await githubGetFile(CONFIG.READY_ITEMS_PATH, { bustCache });
        if (!file) {
            state.readyItems = [];
            state.readyItemsSha = null;
        } else {
            state.readyItems = JSON.parse(base64Decode(file.content));
            state.readyItemsSha = file.sha;
        }
        state.readyLoaded = true;
        if (revealName) {
            revealReadyItem(revealName, { preserveSearch });
        }
        refreshCategoryRegistry();
        renderReadyStatusBar(`${statusPrefix}${state.readyItems.length} item(s) prontos carregados.`, "ok");
    } catch (err) {
        console.error("Erro ao carregar prontos:", err);
        showToast(`Erro: ${err.message}`);
        renderReadyStatusBar(`Erro ao carregar: ${err.message}`, "error");
    } finally {
        state.readyLoading = false;
        renderReadySection();
        renderStats();
    }
}

async function publishReadyItem(item, iconBase64) {
    // Always fetch latest SHA to avoid conflicts
    const latestFile = await githubGetFile(CONFIG.READY_ITEMS_PATH);
    let currentItems = [];
    let currentSha = null;

    if (latestFile) {
        const json = base64Decode(latestFile.content);
        currentItems = JSON.parse(json);
        currentSha = latestFile.sha;
    }

    // Upload icon if provided
    if (iconBase64) {
        const iconPath = `${CONFIG.READY_ICONS_FOLDER}/${item.name}.png`;
        const existingIcon = await githubGetFile(iconPath);
        await githubPutFile(
            iconPath,
            iconBase64,
            existingIcon ? existingIcon.sha : null,
            `feat: add icon for ready item ${item.name}`
        );
    }

    // Update items array
    const existingIdx = currentItems.findIndex((r) => r.name === item.name);
    if (existingIdx >= 0) {
        currentItems[existingIdx] = item;
    } else {
        currentItems.push(item);
    }
    currentItems.sort((a, b) => (a.label || a.name).localeCompare(b.label || b.name, "pt-BR"));

    const jsonContent = JSON.stringify(currentItems, null, 2);
    const encoded = base64Encode(jsonContent);
    const result = await githubPutFile(
        CONFIG.READY_ITEMS_PATH,
        encoded,
        currentSha,
        `feat: ${existingIdx >= 0 ? "update" : "add"} ready item ${item.name}`
    );

    state.readyItems = currentItems.map((entry) => {
        if (entry.name !== item.name || !iconBase64) return entry;
        return {
            ...entry,
            uploadedIconBase64: iconBase64,
            uploadedIconMime: state.builder.uploadedIconMime || "image/png",
            uploadedIconFileName: state.builder.uploadedIconFileName || `${item.name}.png`,
        };
    });
    state.readyItemsSha = result.content.sha;
    state.readyLoaded = true;
    state.readyLoading = false;
}

async function deleteReadyItemFromGitHub(name) {
    const item = state.readyItems.find((r) => r.name === name);
    if (!item) return;

    // Try to delete uploaded icon
    if (item.iconSource === "upload") {
        try {
            const iconPath = `${CONFIG.READY_ICONS_FOLDER}/${name}.png`;
            const iconFile = await githubGetFile(iconPath);
            if (iconFile) {
                await githubDeleteFile(iconPath, iconFile.sha, `feat: remove icon for ${name}`);
            }
        } catch (err) {
            console.warn("Falha ao deletar ícone:", err);
        }
    }

    // Remove from list and re-save
    const latestFile = await githubGetFile(CONFIG.READY_ITEMS_PATH);
    let currentItems = [];
    let currentSha = null;

    if (latestFile) {
        const json = base64Decode(latestFile.content);
        currentItems = JSON.parse(json);
        currentSha = latestFile.sha;
    }

    currentItems = currentItems.filter((r) => r.name !== name);
    const encoded = base64Encode(JSON.stringify(currentItems, null, 2));
    const result = await githubPutFile(
        CONFIG.READY_ITEMS_PATH,
        encoded,
        currentSha,
        `feat: remove ready item ${name}`
    );

    state.readyItems = currentItems;
    state.readyItemsSha = result.content.sha;
}

// ============================================================
//  EVENT BINDING
// ============================================================

function bindEvents() {
    // Tab navigation
    document.getElementById("viewPendingBtn").addEventListener("click", () => {
        state.activeView = "pending";
        renderAll();
    });
    document.getElementById("viewImplementedBtn").addEventListener("click", () => {
        state.implementedPage = 0;
        state.activeView = "implemented";
        renderAll();
    });
    document.getElementById("viewReadyBtn").addEventListener("click", () => {
        state.activeView = "ready";
        renderAll();
        if (!state.readyLoaded && !state.readyLoading) {
            loadReadyItems();
        }
    });

    // Refresh ready
    document.getElementById("refreshReadyBtn").addEventListener("click", () => {
        state.readyLoaded = false;
        loadReadyItems();
    });
    document.getElementById("copyAllReadyExportsBtn").addEventListener("click", copyAllReadyExports);

    // Debounced search
    document.getElementById("pendingSearchInput").addEventListener("input",
        debounce((e) => { state.pendingSearch = e.target.value.toLowerCase().trim(); renderPendingSection(); }, 250)
    );
    document.getElementById("implementedSearchInput").addEventListener("input",
        debounce((e) => { state.implementedSearch = e.target.value.toLowerCase().trim(); state.implementedPage = 0; renderImplementedSection(); }, 250)
    );
    document.getElementById("readySearchInput").addEventListener("input",
        debounce((e) => { state.readySearch = e.target.value.toLowerCase().trim(); renderReadySection(); }, 250)
    );

    // Filters
    document.getElementById("pendingCategoryFilter").addEventListener("click", handlePendingChipClick);
    document.getElementById("implementedTypeFilter").addEventListener("click", handleImplementedTypeClick);
    document.getElementById("implementedRarityFilter").addEventListener("click", handleImplementedRarityClick);
    const implCatFilter = document.getElementById("implementedCategoryFilter");
    if (implCatFilter) implCatFilter.addEventListener("click", handleImplementedCategoryClick);
    document.getElementById("readyTypeFilter").addEventListener("click", handleReadyTypeClick);
    document.getElementById("readyRarityFilter").addEventListener("click", handleReadyRarityClick);
    const readyCatFilter = document.getElementById("readyCategoryFilter");
    if (readyCatFilter) readyCatFilter.addEventListener("click", handleReadyCategoryClick);

    // Grids
    document.getElementById("pendingGrid").addEventListener("click", handlePendingGridClick);
    document.getElementById("implementedGrid").addEventListener("click", handleImplementedGridClick);
    document.getElementById("readyGrid").addEventListener("click", handleReadyGridClick);

    // Builder actions
    document.getElementById("copyExportBtn").addEventListener("click", copyBuilderExport);
    document.getElementById("saveImplementedBtn").addEventListener("click", saveBuilderItem);
    document.getElementById("publishReadyBtn").addEventListener("click", handlePublishAsReady);
    document.getElementById("resetBuilderBtn").addEventListener("click", resetBuilder);
    document.getElementById("clearTemplateBtn").addEventListener("click", clearBuilderTemplate);
    document.getElementById("copyIconNameBtn").addEventListener("click", copySelectedIconName);
    document.getElementById("pasteLuaBtn").addEventListener("click", toggleLuaImportPanel);
    document.getElementById("applyLuaImportBtn").addEventListener("click", applyLuaImportFromTextarea);
    document.getElementById("clearLuaImportBtn").addEventListener("click", clearLuaImportTextarea);
    document.getElementById("newManualItemBtn").addEventListener("click", openBuilderManual);

    // Workspace actions
    document.getElementById("exportWorkspaceBtn").addEventListener("click", exportLocalWorkspace);
    document.getElementById("resetWorkspaceBtn").addEventListener("click", resetLocalWorkspace);

    // Theme
    document.getElementById("themeToggleBtn").addEventListener("click", toggleTheme);

    // Form live update
    const form = document.getElementById("itemForm");
    ["input", "change"].forEach((eventName) => {
        document.getElementById("itemUniqueInput").addEventListener(eventName, () => {
            syncStackingControls("unique");
        });
        document.getElementById("itemStackableInput")?.addEventListener(eventName, () => {
            syncStackingControls("stackable");
        });
    });
    form.addEventListener("input", syncBuilderFormFromInputs);
    form.addEventListener("change", syncBuilderFormFromInputs);

    // Icon source toggle
    document.getElementById("iconSourcePending").addEventListener("change", () => {
        state.builder.iconSource = "pending";
        renderBuilder();
    });
    document.getElementById("iconSourceReady")?.addEventListener("change", () => {
        state.builder.iconSource = "ready";
        renderBuilder();
    });
    document.getElementById("iconSourceUpload").addEventListener("change", () => {
        state.builder.iconSource = "upload";
        renderBuilder();
    });

    // Icon upload
    document.getElementById("uploadDropzone").addEventListener("click", () => {
        document.getElementById("iconFileInput").click();
    });
    document.getElementById("iconFileInput").addEventListener("change", handleIconFileChange);
    document.getElementById("clearUploadBtn").addEventListener("click", clearIconUpload);

    // Drag and drop on dropzone
    const dropzone = document.getElementById("uploadDropzone");
    dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.classList.add("drag-over"); });
    dropzone.addEventListener("dragleave", () => { dropzone.classList.remove("drag-over"); });
    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("drag-over");
        const file = e.dataTransfer.files[0];
        if (file) processIconFile(file);
    });

    // GitHub modal
    document.getElementById("githubTokenBtn").addEventListener("click", openGithubModal);
    document.getElementById("closeGithubModal").addEventListener("click", closeGithubModal);
    document.getElementById("githubModal").addEventListener("click", (e) => {
        if (e.target === document.getElementById("githubModal")) closeGithubModal();
    });
    document.getElementById("saveGithubToken").addEventListener("click", async () => {
        const val = document.getElementById("githubTokenInput").value.trim();
        if (!val) { showToast("Digite um token antes de salvar."); return; }
        if (isMaskedGitHubTokenValue(val) && getGitHubToken()) {
            showModalStatus("Token ja salvo nesta maquina. Cole outro token apenas se quiser substituir.", "warn");
            return;
        }

        showModalStatus("Validando token e acesso ao repositorio...", "warn");
        try {
            const result = await validateGitHubToken(val);
            if (result.hasPushPermission === false) {
                showModalStatus(`Token valido para ${result.fullName}, mas sem permissao de escrita no repositorio. Verifique Contents: Read and write.`, "error");
                return;
            }
            setGitHubToken(val);
            showModalStatus(`Token valido para ${result.fullName}. Escrita no repositorio liberada.`, "ok");
            showToast("Token do GitHub salvo.");
        } catch (err) {
            showModalStatus(`Falha ao validar token: ${err.message}`, "error");
            showToast(`Falha ao validar token: ${err.message}`);
        }
    });
    document.getElementById("clearGithubToken").addEventListener("click", () => {
        setGitHubToken("");
        document.getElementById("githubTokenInput").value = "";
        showModalStatus("Token removido.", "warn");
        showToast("Token removido.");
    });
    document.getElementById("toggleTokenVisibility").addEventListener("click", () => {
        const input = document.getElementById("githubTokenInput");
        const btn = document.getElementById("toggleTokenVisibility");
        if (input.type === "password") { input.type = "text"; btn.textContent = "Ocultar"; }
        else { input.type = "password"; btn.textContent = "Ver"; }
    });
}

// ============================================================
//  FILTER HANDLERS
// ============================================================

function handlePendingChipClick(e) {
    const btn = e.target.closest("[data-category]");
    if (!btn) return;
    state.pendingCategory = btn.dataset.category;
    renderPendingSection();
}

function handleImplementedTypeClick(e) {
    const btn = e.target.closest("[data-type]");
    if (!btn) return;
    state.implementedType = btn.dataset.type;
    state.implementedPage = 0;
    renderImplementedSection();
}

function handleImplementedRarityClick(e) {
    const btn = e.target.closest("[data-rarity]");
    if (!btn) return;
    state.implementedRarity = btn.dataset.rarity;
    state.implementedPage = 0;
    renderImplementedSection();
}

function handleReadyTypeClick(e) {
    const btn = e.target.closest("[data-type]");
    if (!btn) return;
    state.readyType = btn.dataset.type;
    renderReadySection();
}

function handleReadyRarityClick(e) {
    const btn = e.target.closest("[data-rarity]");
    if (!btn) return;
    state.readyRarity = btn.dataset.rarity;
    renderReadySection();
}

function handleImplementedCategoryClick(e) {
    const btn = e.target.closest("[data-category]");
    if (!btn) return;
    state.implementedCategory = btn.dataset.category;
    state.implementedPage = 0;
    renderImplementedSection();
}

function handleReadyCategoryClick(e) {
    const btn = e.target.closest("[data-category]");
    if (!btn) return;
    state.readyCategory = btn.dataset.category;
    renderReadySection();
}

// ============================================================
//  GRID CLICK HANDLERS
// ============================================================

function handlePendingGridClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const { action, name } = btn.dataset;
    if (action === "implement") openBuilderFromPending(name);
    else if (action === "copy-icon") copyToClipboard(name, "Nome do ícone copiado.");
}

function handleImplementedGridClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const { action, name } = btn.dataset;
    const item = getImplementedItemByName(name);
    if (!item) return;
    if (action === "copy-export") { copyToClipboard(buildLuaEntry(item), "Export copiado."); return; }
    if (action === "use-template") { applyTemplate(item); return; }
    if (action === "edit-local") { openBuilderForLocal(name); return; }
    if (action === "restore-pending") restorePendingFromLocal(name);
}

function handleReadyGridClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const { action, name } = btn.dataset;
    const item = state.readyItems.find((r) => r.name === name);
    if (!item && action !== "delete-ready") return;

    if (action === "copy-export") {
        copyToClipboard(buildLuaEntry(item), "Export copiado.");
    } else if (action === "use-template") {
        applyTemplate(item, "ready");
    } else if (action === "edit-ready") {
        openBuilderForReady(name);
    } else if (action === "delete-ready") {
        if (!window.confirm(`Deletar o item pronto "${name}" do GitHub? Isso não pode ser desfeito.`)) return;
        deleteReadyItemFromGitHub(name)
            .then(() => { renderReadySection(); renderStats(); showToast(`Item ${name} deletado.`); })
            .catch((err) => showToast(`Erro ao deletar: ${err.message}`));
    }
}

// ============================================================
//  RENDER ORCHESTRATION
// ============================================================

function renderAll() {
    renderHeroMeta();
    renderStats();
    renderView();
    renderPendingSection();
    renderImplementedSection();
    renderReadySection();
    renderBuilder();
}

function renderHeroMeta() {
    const generatedAt = IMPLEMENTED_ITEMS_META && IMPLEMENTED_ITEMS_META.generatedAt
        ? new Date(IMPLEMENTED_ITEMS_META.generatedAt)
        : null;
    setText("syncTimestamp", generatedAt
        ? generatedAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
        : "Snapshot indisponível");
    const summary = IMPLEMENTED_ITEMS_META
        ? `${IMPLEMENTED_ITEMS_META.totalItems} itens · ${IMPLEMENTED_ITEMS_META.copiedImages} imagens sincronizadas`
        : "Sem metadados do snapshot";
    setText("syncSummary", summary);
}

function renderStats() {
    const pendingCount = getPendingItems().length;
    const allImpl = getAllImplementedItems();
    const localCount = Object.keys(state.customImplemented).length;
    const readyCount = state.readyLoaded ? state.readyItems.length : null;

    setText("pendingCount", String(pendingCount));
    setText("serverImplementedCount", String(allImpl.filter((i) => i.source !== "local").length));
    setText("localImplementedCount", String(localCount));
    setText("readyCount", readyCount !== null ? String(readyCount) : "—");
}

function renderView() {
    const views = { pending: "pendingView", implemented: "implementedView", ready: "readyView" };
    const btns = { pending: "viewPendingBtn", implemented: "viewImplementedBtn", ready: "viewReadyBtn" };

    for (const [view, id] of Object.entries(views)) {
        document.getElementById(id).classList.toggle("hidden", state.activeView !== view);
    }
    for (const [view, id] of Object.entries(btns)) {
        document.getElementById(id).classList.toggle("active", state.activeView === view);
    }

    // Workspace note
    const note = document.getElementById("workspaceNote");
    if (note) {
        if (state.activeView === "ready") {
            note.textContent = getGitHubToken() ? "Sincronizado com GitHub." : "Configure o token para publicar.";
        } else {
            note.textContent = "Estado local salvo no navegador.";
        }
    }
}

// ============================================================
//  RENDER — PENDING
// ============================================================

function renderPendingSection() {
    renderPendingCategoryFilters();
    renderPendingGrid();
}

function renderPendingCategoryFilters() {
    const container = document.getElementById("pendingCategoryFilter");
    const items = getPendingItems();
    const counts = new Map();
    for (const item of items) counts.set(item.category, (counts.get(item.category) || 0) + 1);

    const chips = [
        `<button class="chip-btn ${state.pendingCategory === "all" ? "active" : ""}" data-category="all" type="button">Todos (${items.length})</button>`,
        ...Array.from(counts.entries()).map(([cat, count]) =>
            `<button class="chip-btn ${state.pendingCategory === cat ? "active" : ""}" data-category="${escapeHtmlAttribute(cat)}" type="button">${escapeHtml(cat)} (${count})</button>`
        ),
    ];
    container.innerHTML = chips.join("");
}

function renderPendingGrid() {
    const grid = document.getElementById("pendingGrid");
    const emptyState = document.getElementById("pendingEmptyState");
    const items = getFilteredPendingItems();

    if (items.length === 0) {
        grid.innerHTML = "";
        emptyState.classList.remove("hidden");
        return;
    }
    emptyState.classList.add("hidden");

    grid.innerHTML = items.map((item) => {
        const isConflict = item.conflict;
        const subtitle = isConflict ? "Revise o nome no builder." : item.category;
        return `
            <article class="item-card pending-card">
                <div class="item-status-row">
                    <span class="status-pill ${isConflict ? "conflict" : ""}">${isConflict ? "Conflito" : "Pendente"}</span>
                </div>
                <div class="item-preview">
                    <img data-candidates="${escapeHtmlAttribute(item.displayPath)}" data-label="${escapeHtmlAttribute(item.name)}" alt="${escapeHtmlAttribute(item.name)}">
                </div>
                <div class="item-copy">
                    <strong class="item-title">${escapeHtml(item.name)}</strong>
                    <span class="item-subtitle">${escapeHtml(item.category)}</span>
                    <span class="item-meta">${escapeHtml(subtitle)}</span>
                </div>
                <div class="card-actions">
                    <button class="card-action primary" data-action="implement" data-name="${escapeHtmlAttribute(item.name)}" type="button">Implementar</button>
                    <button class="card-action" data-action="copy-icon" data-name="${escapeHtmlAttribute(item.name)}" type="button">Copiar nome</button>
                </div>
            </article>`;
    }).join("");

    hydrateImages(grid);
}

// ============================================================
//  RENDER — IMPLEMENTED
// ============================================================

function renderImplementedSection() {
    renderImplementedFilters();
    renderImplementedGrid();
}

function renderImplementedFilters() {
    const typeContainer = document.getElementById("implementedTypeFilter");
    const rarityContainer = document.getElementById("implementedRarityFilter");
    const categoryContainer = document.getElementById("implementedCategoryFilter");
    const items = getAllImplementedItems();

    const typeCounts = new Map([["all", items.length]]);
    for (const t of TYPE_ORDER.filter((v) => v !== "all")) {
        typeCounts.set(t, items.filter((i) => i.type === t).length);
    }
    const rarityCounts = new Map([["all", items.length]]);
    for (const r of RARITY_ORDER) {
        rarityCounts.set(r, items.filter((i) => i.rarity === r).length);
    }

    typeContainer.innerHTML = TYPE_ORDER.map((t) =>
        `<button class="chip-btn ${state.implementedType === t ? "active" : ""}" data-type="${t}" type="button">${escapeHtml(t === "all" ? "Todos" : t)} (${typeCounts.get(t) || 0})</button>`
    ).join("");

    rarityContainer.innerHTML = ["all", ...RARITY_ORDER].map((r) =>
        `<button class="chip-btn ${state.implementedRarity === r ? "active" : ""}" data-rarity="${r}" type="button">${escapeHtml(r === "all" ? "Todas" : r)} (${rarityCounts.get(r) || 0})</button>`
    ).join("");

    // Category filter
    if (categoryContainer) {
        const catCounts = new Map();
        let withCat = 0;
        for (const item of items) {
            const cat = item.siteCategory || "";
            if (cat) {
                withCat++;
                catCounts.set(cat, (catCounts.get(cat) || 0) + 1);
            }
        }
        const sortedCats = Array.from(catCounts.entries()).sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
        const noCatCount = items.length - withCat;
        const chips = [
            `<button class="chip-btn ${state.implementedCategory === "all" ? "active" : ""}" data-category="all" type="button">Todas (${items.length})</button>`,
            ...sortedCats.map(([cat, count]) =>
                `<button class="chip-btn ${state.implementedCategory === cat ? "active" : ""}" data-category="${escapeHtmlAttribute(cat)}" type="button">${escapeHtml(cat)} (${count})</button>`
            ),
        ];
        if (noCatCount > 0 && sortedCats.length > 0) {
            chips.push(`<button class="chip-btn ${state.implementedCategory === "__none__" ? "active" : ""}" data-category="__none__" type="button">Sem categoria (${noCatCount})</button>`);
        }
        categoryContainer.innerHTML = chips.join("");
    }
}

function renderImplementedGrid() {
    const grid = document.getElementById("implementedGrid");
    const emptyState = document.getElementById("implementedEmptyState");
    const items = getFilteredImplementedItems();

    if (items.length === 0) {
        grid.innerHTML = "";
        emptyState.classList.remove("hidden");
        return;
    }
    emptyState.classList.add("hidden");

    const pageEnd = (state.implementedPage + 1) * IMPLEMENTED_PAGE_SIZE;
    const pageItems = items.slice(0, pageEnd);
    const remaining = items.length - pageEnd;

    grid.innerHTML = pageItems.map((item) => renderImplementedCard(item)).join("") +
        (remaining > 0
            ? `<div class="load-more-wrapper"><button class="ghost-btn load-more-btn" id="loadMoreImplBtn" type="button">Ver mais ${remaining} itens</button></div>`
            : "");

    hydrateImages(grid);

    const loadMoreBtn = document.getElementById("loadMoreImplBtn");
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", () => {
            state.implementedPage++;
            renderImplementedGrid();
        });
    }
}

function renderImplementedCard(item) {
    const sourceLabel = item.source === "local" ? "Local" : "Servidor";
    const metaParts = [item.type, `${item.weight}g`, item.image || "sem-imagem"];

    const candidates = buildCandidateString(getImplementedImageCandidates(item));
    const catBadge = item.siteCategory
        ? `<span class="category-pill">${escapeHtml(item.siteCategory)}</span>`
        : "";

    const actionButtons = item.source === "local"
        ? `<button class="card-action primary" data-action="copy-export" data-name="${escapeHtmlAttribute(item.name)}" type="button">Copiar export</button>
           <button class="card-action" data-action="edit-local" data-name="${escapeHtmlAttribute(item.name)}" type="button">Editar</button>
           <button class="card-action" data-action="restore-pending" data-name="${escapeHtmlAttribute(item.name)}" type="button">Reabrir</button>`
        : `<button class="card-action primary" data-action="copy-export" data-name="${escapeHtmlAttribute(item.name)}" type="button">Copiar export</button>
           <button class="card-action" data-action="use-template" data-name="${escapeHtmlAttribute(item.name)}" type="button">Usar template</button>`;

    return `
        <article class="item-card implemented-card ${item.source === "local" ? "local-item" : ""}">
            <div class="item-status-row">
                <span class="source-pill">${escapeHtml(sourceLabel)}</span>
                <span class="rarity-pill rarity-${escapeHtmlAttribute(item.rarity)}">${escapeHtml(item.rarity)}</span>
                ${catBadge}
            </div>
            <div class="item-preview">
                <img data-candidates="${escapeHtmlAttribute(candidates)}" data-label="${escapeHtmlAttribute(item.label || item.name)}" alt="${escapeHtmlAttribute(item.label || item.name)}">
            </div>
            <div class="item-copy">
                <strong class="item-title">${escapeHtml(item.label || item.name)}</strong>
                <span class="item-subtitle">${escapeHtml(item.name)}</span>
                <span class="item-meta">${escapeHtml(metaParts.join(" · "))}</span>
            </div>
            <div class="card-actions">${actionButtons}</div>
        </article>`;
}

// ============================================================
//  RENDER — READY (Prontos)
// ============================================================

function renderReadySection() {
    renderReadyFilters();
    renderReadyGrid();
}

function revealReadyItem(name, options = {}) {
    const preserveSearch = options.preserveSearch === true;
    state.activeView = "ready";
    state.readyType = "all";
    state.readyRarity = "all";
    if (!preserveSearch) {
        state.readySearch = String(name || "").toLowerCase().trim();
    }

    const searchInput = document.getElementById("readySearchInput");
    if (searchInput && !preserveSearch) {
        searchInput.value = name || "";
    }
}

function renderReadyStatusBar(message, type) {
    const el = document.getElementById("readyLoadStatus");
    if (!el) return;
    el.className = `ready-load-status ready-status-${type}`;
    el.textContent = message;
    el.classList.remove("hidden");
}

function renderReadyFilters() {
    const typeContainer = document.getElementById("readyTypeFilter");
    const rarityContainer = document.getElementById("readyRarityFilter");
    const categoryContainer = document.getElementById("readyCategoryFilter");
    const items = state.readyItems;

    const typeCounts = new Map([["all", items.length]]);
    for (const t of ["item", "weapon"]) typeCounts.set(t, items.filter((i) => i.type === t).length);

    const rarityCounts = new Map([["all", items.length]]);
    for (const r of RARITY_ORDER) rarityCounts.set(r, items.filter((i) => i.rarity === r).length);

    typeContainer.innerHTML = ["all", "item", "weapon"].map((t) =>
        `<button class="chip-btn ${state.readyType === t ? "active" : ""}" data-type="${t}" type="button">${escapeHtml(t === "all" ? "Todos" : t)} (${typeCounts.get(t) || 0})</button>`
    ).join("");

    rarityContainer.innerHTML = ["all", ...RARITY_ORDER].map((r) =>
        `<button class="chip-btn ${state.readyRarity === r ? "active" : ""}" data-rarity="${r}" type="button">${escapeHtml(r === "all" ? "Todas" : r)} (${rarityCounts.get(r) || 0})</button>`
    ).join("");

    // Category filter
    if (categoryContainer) {
        const catCounts = new Map();
        let withCat = 0;
        for (const item of items) {
            const cat = item.siteCategory || "";
            if (cat) {
                withCat++;
                catCounts.set(cat, (catCounts.get(cat) || 0) + 1);
            }
        }
        const sortedCats = Array.from(catCounts.entries()).sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
        const noCatCount = items.length - withCat;
        const chips = [
            `<button class="chip-btn ${state.readyCategory === "all" ? "active" : ""}" data-category="all" type="button">Todas (${items.length})</button>`,
            ...sortedCats.map(([cat, count]) =>
                `<button class="chip-btn ${state.readyCategory === cat ? "active" : ""}" data-category="${escapeHtmlAttribute(cat)}" type="button">${escapeHtml(cat)} (${count})</button>`
            ),
        ];
        if (noCatCount > 0 && sortedCats.length > 0) {
            chips.push(`<button class="chip-btn ${state.readyCategory === "__none__" ? "active" : ""}" data-category="__none__" type="button">Sem categoria (${noCatCount})</button>`);
        }
        categoryContainer.innerHTML = chips.join("");
    }
}

function renderReadyGrid() {
    const grid = document.getElementById("readyGrid");
    const emptyState = document.getElementById("readyEmptyState");

    if (state.readyLoading) {
        grid.innerHTML = `<div class="ready-loading-placeholder">Carregando itens prontos do GitHub...</div>`;
        emptyState.classList.add("hidden");
        return;
    }

    if (!state.readyLoaded) {
        grid.innerHTML = `<div class="ready-loading-placeholder">Acesse a aba para carregar os itens prontos do GitHub.</div>`;
        emptyState.classList.add("hidden");
        return;
    }

    const items = getFilteredReadyItems();

    if (items.length === 0) {
        grid.innerHTML = "";
        emptyState.classList.remove("hidden");
        return;
    }
    emptyState.classList.add("hidden");

    grid.innerHTML = items.map((item) => {
        const candidates = buildCandidateString(getReadyImageCandidates(item));
        const metaParts = [item.type, `${item.weight}g`];
        const catBadge = item.siteCategory
            ? `<span class="category-pill">${escapeHtml(item.siteCategory)}</span>`
            : "";
        return `
            <article class="item-card ready-card">
                <div class="item-status-row">
                    <span class="status-pill ready-pill">Pronto</span>
                    <span class="rarity-pill rarity-${escapeHtmlAttribute(item.rarity)}">${escapeHtml(item.rarity)}</span>
                    ${catBadge}
                </div>
                <div class="item-preview">
                    <img data-candidates="${escapeHtmlAttribute(candidates)}" data-label="${escapeHtmlAttribute(item.label || item.name)}" alt="${escapeHtmlAttribute(item.label || item.name)}">
                </div>
                <div class="item-copy">
                    <strong class="item-title">${escapeHtml(item.label || item.name)}</strong>
                    <span class="item-subtitle">${escapeHtml(item.name)}</span>
                    <span class="item-meta">${escapeHtml(metaParts.join(" · "))}</span>
                </div>
                <div class="card-actions">
                    <button class="card-action primary" data-action="copy-export" data-name="${escapeHtmlAttribute(item.name)}" type="button">Copiar export</button>
                    <button class="card-action" data-action="use-template" data-name="${escapeHtmlAttribute(item.name)}" type="button">Usar template</button>
                    <button class="card-action" data-action="edit-ready" data-name="${escapeHtmlAttribute(item.name)}" type="button">Editar</button>
                    <button class="card-action ghost-danger" data-action="delete-ready" data-name="${escapeHtmlAttribute(item.name)}" type="button">Deletar</button>
                </div>
            </article>`;
    }).join("");

    hydrateImages(grid);
}

// ============================================================
//  RENDER — BUILDER
// ============================================================

function renderBuilder() {
    const idle = document.getElementById("builderIdle");
    const content = document.getElementById("builderContent");
    const badge = document.getElementById("builderModeBadge");
    const pendingItem = getBuilderPendingItem();

    if (!state.builder.form || !pendingItem) {
        idle.classList.remove("hidden");
        content.classList.add("hidden");
        badge.textContent = "Aguardando seleção";
        return;
    }

    idle.classList.add("hidden");
    content.classList.remove("hidden");

    let badgeText = "Novo implementado";
    if (state.builder.editingLocalName) badgeText = "Editando rascunho";
    if (state.builder.editingReadyName) badgeText = "Editando item pronto";
    if (pendingItem.isManual && !state.builder.editingLocalName && !state.builder.editingReadyName) badgeText = "Novo item manual";
    badge.textContent = badgeText;

    setText("builderIconName", pendingItem.name);
    setText("builderIconCategory", pendingItem.category);
    setText("builderImageValue", state.builder.form.image || pendingItem.image);

    let sourceBadge = "Pendente";
    if (state.builder.editingLocalName) sourceBadge = "Local";
    if (state.builder.editingReadyName) sourceBadge = "Pronto";
    if (pendingItem.isManual && !state.builder.editingLocalName && !state.builder.editingReadyName) sourceBadge = "Manual";
    setText("builderSourceBadge", sourceBadge);

    const templateItem = getTemplateItem();
    setText("builderTemplateChip", templateItem ? `Template: ${templateItem.label || templateItem.name}` : "Sem template");
    setText("templateSummary", templateItem
        ? `${templateItem.label || templateItem.name} · ${templateItem.type} · ${templateItem.rarity}`
        : "Nenhum template aplicado.");

    syncBuilderInputs();

    const builderImage = document.getElementById("builderIconImage");
    applyImageCandidates(builderImage, getBuilderImageCandidates(), pendingItem.name);

    setText("luaExportPreview", buildLuaEntry(buildBuilderItemPreview()));
    syncPublishReadyButtonState();

    // Sync icon source radio
    const canUseReadyIcon = Boolean(state.builder.editingReadyName);
    const canUsePendingIcon = !pendingItem.isManual;
    if (!canUseReadyIcon && state.builder.iconSource === "ready") {
        state.builder.iconSource = canUsePendingIcon ? "pending" : "upload";
    }
    if (!canUsePendingIcon && state.builder.iconSource === "pending") {
        state.builder.iconSource = "upload";
    }
    const readyRadioWrap = document.getElementById("iconSourceReadyWrap");
    const readyRadio = document.getElementById("iconSourceReady");
    if (readyRadioWrap) readyRadioWrap.classList.toggle("hidden", !canUseReadyIcon);
    if (readyRadio) {
        readyRadio.disabled = !canUseReadyIcon;
        readyRadio.checked = canUseReadyIcon && state.builder.iconSource === "ready";
    }
    document.getElementById("iconSourcePending").disabled = !canUsePendingIcon;
    document.getElementById("iconSourcePending").checked = canUsePendingIcon && state.builder.iconSource === "pending";
    document.getElementById("iconSourceUpload").checked = state.builder.iconSource === "upload";
    toggleIconUploadArea(state.builder.iconSource === "upload");
    syncUploadPreviewState();
}

function getBuilderImageCandidates() {
    const pendingItem = getBuilderPendingItem();
    const candidates = [];
    const editingLocalItem = state.builder.editingLocalName
        ? state.customImplemented[state.builder.editingLocalName]
        : null;
    const editingReadyItem = state.builder.editingReadyName
        ? state.readyItems.find((item) => item.name === state.builder.editingReadyName)
        : null;

    if (state.builder.iconSource === "ready" && editingReadyItem) {
        candidates.push(...getStoredReadyImageCandidates(editingReadyItem));
    } else if (state.builder.iconSource === "pending" && pendingItem) {
        candidates.push(...getPendingImageCandidates(pendingItem));
    } else if (state.builder.iconSource === "upload" && state.builder.uploadedIconBase64) {
        candidates.push(buildUploadedImageSrc(state.builder.uploadedIconBase64, state.builder.uploadedIconMime));
    }
    if (editingLocalItem) {
        candidates.push(...getImplementedImageCandidates(editingLocalItem));
    }
    if (editingReadyItem && state.builder.iconSource !== "ready") {
        candidates.push(
            ...(state.builder.iconSource === "upload"
                ? getStoredReadyImageCandidates(editingReadyItem)
                : getReadyImageCandidates(editingReadyItem))
        );
    }
    if (state.builder.iconSource !== "pending" && pendingItem) {
        candidates.push(...getPendingImageCandidates(pendingItem));
    }
    return Array.from(new Set(candidates.filter(Boolean)));
}

function syncPublishReadyButtonState() {
    const btn = document.getElementById("publishReadyBtn");
    if (!btn) return;
    btn.innerHTML = state.builder.editingReadyName
        ? `<span>↻</span> Atualizar item pronto`
        : `<span>✓</span> Publicar como Pronto`;
}

function syncUploadPreviewState() {
    const preview = document.getElementById("iconUploadPreview");
    const dropzone = document.getElementById("uploadDropzone");
    if (!preview || !dropzone) return;

    if (state.builder.uploadedIconBase64) {
        document.getElementById("iconUploadPreviewImg").src = buildUploadedImageSrc(
            state.builder.uploadedIconBase64,
            state.builder.uploadedIconMime
        );
        document.getElementById("iconUploadFileName").textContent = state.builder.uploadedIconFileName || "icone-uploadado.png";
        setText("iconUploadDims", "Imagem pronta para publicar.");
        preview.classList.remove("hidden");
        dropzone.classList.add("hidden");
        return;
    }

    preview.classList.add("hidden");
    dropzone.classList.remove("hidden");
}

function syncBuilderInputs() {
    const form = state.builder.form;
    if (!form) return;
    document.getElementById("itemNameInput").value = form.name;
    document.getElementById("itemLabelInput").value = form.label;
    document.getElementById("itemDescriptionInput").value = form.description;
    document.getElementById("itemWeightInput").value = form.weight;
    document.getElementById("itemTypeSelect").value = form.type;
    document.getElementById("itemRaritySelect").value = form.rarity;
    document.getElementById("itemUniqueInput").checked = form.unique;
    syncStackingControls("unique");
    document.getElementById("itemUseableInput").checked = form.useable;
    document.getElementById("itemShouldCloseInput").checked = form.shouldClose;
    document.getElementById("itemDecayInput").value = form.decay;
    document.getElementById("itemAmmoTypeInput").value = form.ammotype;
    document.getElementById("itemConsumeInput").value = form.consume;
    document.getElementById("itemAllowArmedSelect").value = form.allowArmed;
    document.getElementById("itemAllowInBackpackSelect").value = form.allowInBackpack;
    document.getElementById("itemExtraLuaInput").value = form.extraLua;
    const imageInput = document.getElementById("itemImageInput");
    imageInput.value = form.image;
    imageInput.readOnly = Boolean(state.builder.activePendingName);

    // Category sync
    const catSelect = document.getElementById("itemCategorySelect");
    const catCustom = document.getElementById("itemCategoryCustomInput");
    if (catSelect) {
        const cat = form.siteCategory || "";
        // Check if value exists in select options
        const optionExists = Array.from(catSelect.options).some(o => o.value === cat);
        if (cat && !optionExists && cat !== "__custom__") {
            // Custom value — show custom input
            catSelect.value = "__custom__";
            if (catCustom) { catCustom.classList.remove("hidden"); catCustom.value = cat; }
        } else {
            catSelect.value = cat;
            if (catCustom) { catCustom.classList.add("hidden"); catCustom.value = ""; }
        }
    }
}

function syncBuilderFormFromInputs() {
    if (!state.builder.form) return;
    const currentForm = state.builder.form;
    const stackableInput = document.getElementById("itemStackableInput");
    const uniqueValue = stackableInput
        ? !stackableInput.checked
        : document.getElementById("itemUniqueInput").checked;
    const normalizedName = document.getElementById("itemNameInput").value.trim().toLowerCase().replace(/\s+/g, "-");
    let imageValue = document.getElementById("itemImageInput").value.trim();
    const isManualBuilder = !state.builder.activePendingName;
    const previousAutoImage = `${currentForm.name || "novo-item"}.png`;
    if (isManualBuilder && (!imageValue || imageValue === previousAutoImage)) {
        imageValue = `${normalizedName || "novo-item"}.png`;
        document.getElementById("itemImageInput").value = imageValue;
    }
    state.builder.form = {
        ...currentForm,
        name: normalizedName,
        label: document.getElementById("itemLabelInput").value.trim(),
        description: document.getElementById("itemDescriptionInput").value.trim(),
        weight: document.getElementById("itemWeightInput").value.trim(),
        type: document.getElementById("itemTypeSelect").value,
        rarity: document.getElementById("itemRaritySelect").value,
        unique: uniqueValue,
        useable: document.getElementById("itemUseableInput").checked,
        shouldClose: document.getElementById("itemShouldCloseInput").checked,
        decay: document.getElementById("itemDecayInput").value.trim(),
        ammotype: document.getElementById("itemAmmoTypeInput").value.trim(),
        consume: document.getElementById("itemConsumeInput").value.trim(),
        allowArmed: document.getElementById("itemAllowArmedSelect").value,
        allowInBackpack: document.getElementById("itemAllowInBackpackSelect").value,
        extraLua: document.getElementById("itemExtraLuaInput").value,
        image: imageValue,
        siteCategory: readCategoryFromInputs(),
    };
    document.getElementById("itemNameInput").value = normalizedName;
    setText("builderImageValue", state.builder.form.image);
    setText("luaExportPreview", buildLuaEntry(buildBuilderItemPreview()));
}

// ============================================================
//  BUILDER OPEN / EDIT
// ============================================================

function openBuilderFromPending(name) {
    const item = getPendingItemByName(name);
    if (!item) return;
    state.builder.activePendingName = item.name;
    state.builder.editingLocalName = null;
    state.builder.editingReadyName = null;
    state.builder.templateName = null;
    state.builder.templateSource = null;
    state.builder.form = createDefaultFormFromPending(item);
    state.builder.iconSource = "pending";
    state.builder.uploadedIconBase64 = null;
    state.builder.uploadedIconMime = "image/png";
    state.builder.uploadedIconFileName = null;
    renderBuilder();
    scrollToBuilder();
    showToast(`Builder carregado para ${item.name}.`);
}

function openBuilderForLocal(name) {
    const item = state.customImplemented[name];
    if (!item) return;
    state.builder.activePendingName = item.pendingIconName || null;
    state.builder.editingLocalName = name;
    state.builder.editingReadyName = null;
    state.builder.templateName = null;
    state.builder.templateSource = null;
    state.builder.form = createFormFromImplementedItem(item, item.pendingIconName);
    state.builder.iconSource = item.iconSource || (item.pendingIconName ? "pending" : "upload");
    state.builder.uploadedIconBase64 = item.uploadedIconBase64 || null;
    state.builder.uploadedIconMime = item.uploadedIconMime || "image/png";
    state.builder.uploadedIconFileName = item.uploadedIconFileName || null;
    renderBuilder();
    scrollToBuilder();
    showToast(`Editando rascunho ${item.name}.`);
}

function openBuilderForReady(name) {
    const item = state.readyItems.find((r) => r.name === name);
    if (!item) return;
    const pendingIconName = item.pendingIconName || stripExtension(item.image || name);
    state.builder.activePendingName = item.pendingIconName || null;
    state.builder.editingLocalName = null;
    state.builder.editingReadyName = name;
    state.builder.templateName = null;
    state.builder.templateSource = null;
    state.builder.form = createFormFromReadyItem(item, pendingIconName);
    state.builder.iconSource = "ready";
    state.builder.uploadedIconBase64 = item.uploadedIconBase64 || null;
    state.builder.uploadedIconMime = item.uploadedIconMime || "image/png";
    state.builder.uploadedIconFileName = item.uploadedIconFileName || null;
    renderBuilder();
    scrollToBuilder();
    showToast(`Editando item pronto ${name}.`);
}

function openBuilderManual() {
    state.builder.activePendingName = null;
    state.builder.editingLocalName = null;
    state.builder.editingReadyName = null;
    state.builder.templateName = null;
    state.builder.templateSource = null;
    state.builder.form = createDefaultFormFromScratch();
    state.builder.iconSource = "upload";
    state.builder.uploadedIconBase64 = null;
    state.builder.uploadedIconMime = "image/png";
    state.builder.uploadedIconFileName = null;
    renderBuilder();
    scrollToBuilder();
    showToast("Builder manual aberto.");
}

function scrollToBuilder() {
    const builder = document.querySelector(".builder-panel");
    if (builder) builder.scrollIntoView({ behavior: "smooth", block: "start" });
}

function createDefaultFormFromScratch() {
    return {
        name: "",
        label: "",
        description: "",
        weight: "0",
        type: "item",
        rarity: "common",
        unique: false,
        useable: false,
        shouldClose: true,
        decay: "",
        ammotype: "",
        consume: "",
        allowArmed: "",
        allowInBackpack: "",
        extraLua: "",
        image: "novo-item.png",
        siteCategory: "",
    };
}

function readCategoryFromInputs() {
    const catSelect = document.getElementById("itemCategorySelect");
    const catCustom = document.getElementById("itemCategoryCustomInput");
    if (!catSelect) return "";
    if (catSelect.value === "__custom__") {
        return catCustom ? catCustom.value.trim() : "";
    }
    return catSelect.value || "";
}

function getTemplateItem() {
    if (!state.builder.templateName) return null;
    if (state.builder.templateSource === "ready") {
        return state.readyItems.find((item) => item.name === state.builder.templateName) || null;
    }
    return getImplementedItemByName(state.builder.templateName);
}

// ============================================================
//  BUILDER ACTIONS
// ============================================================

function applyTemplate(item, source = "implemented") {
    if (!state.builder.form) {
        showToast("Abra o builder antes de aplicar um template.");
        return;
    }
    const current = state.builder.form;
    const builderItem = getBuilderPendingItem();
    const currentIconName = builderItem?.isManual
        ? stripExtension(current.image || current.name || "novo-item")
        : builderItem?.name;
    const template = createFormFromImplementedItem(item, currentIconName);
    state.builder.templateName = item.name;
    state.builder.templateSource = source;
    state.builder.form = {
        ...current,
        type: template.type, rarity: template.rarity, weight: template.weight,
        unique: template.unique, useable: template.useable, shouldClose: template.shouldClose,
        decay: template.decay, ammotype: template.ammotype, consume: template.consume,
        allowArmed: template.allowArmed, allowInBackpack: template.allowInBackpack, extraLua: template.extraLua,
        description: current.description || template.description,
    };
    renderBuilder();
    showToast(`Template ${item.name} aplicado.`);
}

function clearBuilderTemplate() {
    if (state.builder.editingReadyName) { openBuilderForReady(state.builder.editingReadyName); return; }
    if (state.builder.editingLocalName) { openBuilderForLocal(state.builder.editingLocalName); return; }
    if (state.builder.form && !state.builder.activePendingName) { openBuilderManual(); return; }
    if (!state.builder.activePendingName) { showToast("Nenhum builder ativo."); return; }
    openBuilderFromPending(state.builder.activePendingName);
}

function resetBuilder() { clearBuilderTemplate(); }

function toggleLuaImportPanel(forceOpen = null) {
    const panel = document.getElementById("luaImportPanel");
    if (!panel) return;
    const shouldOpen = forceOpen === null ? panel.classList.contains("hidden") : Boolean(forceOpen);
    panel.classList.toggle("hidden", !shouldOpen);
    if (shouldOpen) {
        document.getElementById("luaImportTextarea")?.focus();
    }
}

function clearLuaImportTextarea() {
    const textarea = document.getElementById("luaImportTextarea");
    if (!textarea) return;
    textarea.value = "";
    textarea.focus();
}

function applyLuaImportFromTextarea() {
    if (!state.builder.form) {
        showToast("Abra o builder antes de importar um bloco Lua.");
        return;
    }

    const textarea = document.getElementById("luaImportTextarea");
    const raw = textarea?.value.trim() || "";
    if (!raw) {
        showToast("Cole um bloco Lua antes de aplicar.");
        return;
    }

    try {
        const importedItem = parseLuaItemBlock(raw);
        applyImportedItemToBuilder(importedItem);
        textarea.value = "";
        toggleLuaImportPanel(false);
        showToast("Bloco Lua aplicado no builder.");
    } catch (err) {
        showToast(`Falha ao importar Lua: ${err.message}`);
    }
}

function copySelectedIconName() {
    const pending = getBuilderPendingItem();
    if (!pending) { showToast("Nenhum item selecionado."); return; }
    if (pending.isManual) { showToast("Este builder manual nao tem icone pendente."); return; }
    copyToClipboard(pending.name, "Nome do ícone copiado.");
}

function copyBuilderExport() {
    if (!state.builder.form) {
        showToast("Selecione um item para gerar o export.");
        return;
    }
    copyToClipboard(buildLuaEntry(buildBuilderItemPreview()), "Export copiado.");
}

async function copyAllReadyExports() {
    try {
        if (state.readyLoading) {
            showToast("Aguarde o carregamento dos itens prontos.");
            return;
        }
        if (!state.readyLoaded) {
            await loadReadyItems({ bustCache: true, preserveSearch: true, statusPrefix: "" });
        }
        if (state.readyItems.length === 0) {
            showToast("Nao ha itens prontos para exportar.");
            return;
        }
        copyToClipboard(buildCompactLuaEntries(state.readyItems), "Todos os itens prontos foram copiados.");
    } catch (err) {
        showToast(`Falha ao exportar prontos: ${err.message}`);
    }
}

function saveBuilderItem() {
    const pending = getBuilderPendingItem();
    const hasRealPending = pending && !pending.isManual;
    const validation = validateBuilder();
    if (!validation.ok) {
        showToast(validation.message || "Revise os dados do item.");
        return;
    }

    const previewItem = buildBuilderItemPreview();
    const previousName = state.builder.editingLocalName;
    registerCategory(previewItem.siteCategory);

    if (previousName && previousName !== previewItem.name) {
        delete state.customImplemented[previousName];
    }

    state.customImplemented[previewItem.name] = normalizeLocalItem({
        ...previewItem, source: "local",
        pendingIconName: hasRealPending ? pending.name : "",
        pendingCategory: hasRealPending ? pending.category : "Manual",
        imageSource: state.builder.iconSource === "upload"
            ? "upload"
            : state.builder.iconSource === "ready"
                ? "ready"
                : (hasRealPending ? "pending" : "manual"),
        iconSource: state.builder.iconSource,
        uploadedIconBase64: state.builder.iconSource === "upload" ? state.builder.uploadedIconBase64 : null,
        uploadedIconMime: state.builder.iconSource === "upload" ? state.builder.uploadedIconMime : "",
        uploadedIconFileName: state.builder.iconSource === "upload" ? state.builder.uploadedIconFileName : "",
        savedAt: new Date().toISOString(),
    });

    if (hasRealPending && !state.archivedPending.includes(pending.name)) {
        state.archivedPending.push(pending.name);
    }

    saveWorkspaceState();
    state.activeView = "implemented";
    openBuilderForLocal(previewItem.name);
    renderAll();
    showToast(`Rascunho ${previewItem.name} salvo.`);
}

async function handlePublishAsReady() {
    const pending = getBuilderPendingItem();
    const hasRealPending = pending && !pending.isManual;
    const isUpdatingReady = Boolean(state.builder.editingReadyName);
    const validation = validateBuilder();
    if (!validation.ok) {
        showToast(validation.message || "Revise os dados do item.");
        return;
    }

    const token = getGitHubToken();
    if (!token) {
        showToast("Configure o token do GitHub primeiro (botão 'GitHub' no topo).");
        openGithubModal();
        return;
    }

    const previewItem = buildBuilderItemPreview();
    registerCategory(previewItem.siteCategory);
    const readyItem = {
        ...previewItem,
        source: "ready",
        pendingIconName: hasRealPending ? pending.name : "",
        pendingCategory: hasRealPending ? pending.category : "Manual",
        iconSource: state.builder.iconSource,
        createdAt: new Date().toISOString(),
        status: "ready",
    };

    const btn = document.getElementById("publishReadyBtn");
    btn.disabled = true;
    btn.textContent = isUpdatingReady ? "Atualizando..." : "Publicando...";

    try {
        const iconBase64 = state.builder.iconSource === "upload" ? state.builder.uploadedIconBase64 : null;
        await publishReadyItem(readyItem, iconBase64);

        // Archive pending locally too
        if (hasRealPending && !state.archivedPending.includes(pending.name)) {
            state.archivedPending.push(pending.name);
        }
        saveWorkspaceState();

        revealReadyItem(previewItem.name);
        renderAll();
        renderReadyStatusBar(
            isUpdatingReady
                ? `Item ${previewItem.name} atualizado. Revalidando com GitHub...`
                : `Item ${previewItem.name} publicado. Revalidando com GitHub...`,
            "loading"
        );
        loadReadyItems({
            bustCache: true,
            silent: true,
            preserveSearch: false,
            revealName: previewItem.name,
            statusPrefix: `Atualizado agora. `,
        });
        showToast(
            isUpdatingReady
                ? `Item ${previewItem.name} atualizado nos Prontos.`
                : `Item ${previewItem.name} publicado como Pronto.`
        );
    } catch (err) {
        const message = err.message || "Falha ao publicar no GitHub.";
        showToast(`Erro ao publicar: ${message}`);
        if (/Resource not accessible by personal access token/i.test(message)) {
            openGithubModal();
            showModalStatus(message, "error");
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>✓</span> Publicar como Pronto`;
    }
    syncPublishReadyButtonState();
}

function restorePendingFromLocal(name) {
    const item = state.customImplemented[name];
    if (!item) return;
    delete state.customImplemented[name];
    if (item.pendingIconName) {
        state.archivedPending = state.archivedPending.filter((e) => e !== item.pendingIconName);
    }
    if (state.builder.editingLocalName === name) {
        if (item.pendingIconName) openBuilderFromPending(item.pendingIconName);
        else openBuilderManual();
    }
    saveWorkspaceState();
    renderAll();
    showToast(`Item ${name} voltou para pendentes.`);
}

function exportLocalWorkspace() {
    const localItems = Object.values(state.customImplemented);
    if (localItems.length === 0) { showToast("Não há rascunhos locais para exportar."); return; }

    const blob = new Blob(
        [JSON.stringify({ exportedAt: new Date().toISOString(), localItems }, null, 2)],
        { type: "application/json" }
    );
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "underrp-item-workbench-locais.json";
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("Export local gerado.");
}

function resetLocalWorkspace() {
    if (!window.confirm("Isso vai remover os rascunhos locais e reabrir os pendentes correspondentes. Continuar?")) return;
    state.customImplemented = {};
    state.archivedPending = [];
    state.builder = {
        activePendingName: null, editingLocalName: null, editingReadyName: null,
        templateName: null, templateSource: null, form: null, iconSource: "pending",
        uploadedIconBase64: null, uploadedIconMime: "image/png", uploadedIconFileName: null,
    };
    refreshCategoryRegistry();
    saveWorkspaceState();
    renderAll();
    showToast("Workspace local limpo.");
}

// ============================================================
//  ICON UPLOAD
// ============================================================

function toggleIconUploadArea(show) {
    const area = document.getElementById("iconUploadArea");
    if (area) area.classList.toggle("hidden", !show);
}

function handleIconFileChange(e) {
    const file = e.target.files[0];
    if (file) processIconFile(file);
}

function processIconFile(file) {
    if (!file.type.startsWith("image/")) {
        showToast("Selecione um arquivo de imagem (PNG, JPG, WebP).");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target.result;
        const base64 = dataUrl.split(",")[1];

        // Check dimensions
        const img = new Image();
        img.onload = () => {
            const dims = `${img.width}×${img.height}px`;
            const warn = (img.width !== 250 || img.height !== 250)
                ? " ⚠ Recomendado: 250×250px"
                : " ✓ Dimensões corretas";

            state.builder.uploadedIconBase64 = base64;
            state.builder.uploadedIconMime = file.type || "image/png";
            state.builder.uploadedIconFileName = file.name;

            // Show preview
            document.getElementById("iconUploadPreviewImg").src = dataUrl;
            document.getElementById("iconUploadFileName").textContent = file.name;
            setText("iconUploadDims", dims + warn);
            document.getElementById("iconUploadPreview").classList.remove("hidden");
            document.getElementById("uploadDropzone").classList.add("hidden");

            // Update builder preview
            const builderImg = document.getElementById("builderIconImage");
            if (builderImg) builderImg.src = dataUrl;
        };
        img.src = dataUrl;
    };
    reader.readAsDataURL(file);
}

function clearIconUpload() {
    state.builder.uploadedIconBase64 = null;
    state.builder.uploadedIconMime = "image/png";
    state.builder.uploadedIconFileName = null;
    document.getElementById("iconUploadPreview").classList.add("hidden");
    document.getElementById("uploadDropzone").classList.remove("hidden");
    document.getElementById("iconFileInput").value = "";

    // Revert builder preview to pending icon
    const pending = getBuilderPendingItem();
    const builderImg = document.getElementById("builderIconImage");
    if (builderImg && pending) applyImageCandidates(builderImg, getBuilderImageCandidates(), pending.name);
}

// ============================================================
//  GITHUB MODAL
// ============================================================

function openGithubModal() {
    const modal = document.getElementById("githubModal");
    const input = document.getElementById("githubTokenInput");
    const hasToken = Boolean(getGitHubToken());
    input.value = hasToken ? GITHUB_TOKEN_MASK : "";
    input.type = "password";
    document.getElementById("toggleTokenVisibility").textContent = "Ver";
    showModalStatus(
        hasToken
            ? "Token ja salvo nesta maquina. So cole outro token se quiser substituir o atual."
            : "Cole um token Fine-grained com acesso ao repositorio e Contents: Read and write.",
        hasToken ? "warn" : "ok"
    );
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeGithubModal() {
    document.getElementById("githubModal").classList.add("hidden");
    document.body.style.overflow = "";
}

function showModalStatus(message, type) {
    const el = document.getElementById("modalTokenStatus");
    if (!el) return;
    el.className = `modal-status modal-status-${type}`;
    el.textContent = message;
}

// ============================================================
//  VALIDATION
// ============================================================

function validateBuilder() {
    const form = state.builder.form;
    if (!form) return { ok: false, message: "Nenhum item em edição." };
    if (!form.name) return { ok: false, message: "Defina o nome do item." };
    if (!/^[a-z0-9_][a-z0-9_-]*$/.test(form.name)) {
        return { ok: false, message: "Use apenas minúsculas, números, underline ou hífen no nome." };
    }
    if (!form.label) return { ok: false, message: "Defina o label do item." };
    const weight = Number(form.weight);
    if (!Number.isFinite(weight) || weight < 0) return { ok: false, message: "Informe um peso válido." };

    const existingLocalDraft = state.customImplemented[form.name];
    const isEditingSameLocal = state.builder.editingLocalName && state.builder.editingLocalName === form.name;
    if (existingLocalDraft && !isEditingSameLocal) {
        return { ok: false, message: "Já existe um rascunho local com esse nome." };
    }
    return { ok: true };
}

// ============================================================
//  BUILD HELPERS
// ============================================================

function buildBuilderItemPreview() {
    const pending = getBuilderPendingItem();
    const hasRealPending = pending && !pending.isManual;
    const form = state.builder.form;
    const item = {
        name: form.name,
        label: form.label,
        description: form.description,
        weight: Number(form.weight || 0),
        type: form.type,
        image: form.image || (pending ? pending.image : ""),
        unique: Boolean(form.unique),
        useable: Boolean(form.useable),
        shouldClose: Boolean(form.shouldClose),
        rarity: form.rarity,
        pendingIconName: hasRealPending ? pending.name : "",
        pendingCategory: hasRealPending ? pending.category : "Manual",
        extraLua: form.extraLua.trim(),
        siteCategory: form.siteCategory || "",
    };
    if (form.decay !== "") item.decay = Number(form.decay);
    if (form.ammotype) item.ammotype = form.ammotype;
    if (form.consume !== "") item.consume = Number(form.consume);
    if (form.allowArmed === "true") item.allowArmed = true;
    else if (form.allowArmed === "false") item.allowArmed = false;
    if (form.allowInBackpack === "true") item.allowInBackpack = true;
    else if (form.allowInBackpack === "false") item.allowInBackpack = false;
    return item;
}

function createDefaultFormFromPending(item) {
    return {
        name: item.name, label: toDisplayLabel(item.name), description: "",
        weight: "0", type: "item", rarity: "common",
        unique: false, useable: false, shouldClose: true,
        decay: "", ammotype: "", consume: "", allowArmed: "", allowInBackpack: "", extraLua: "",
        image: item.image,
        siteCategory: item.category || "",
    };
}

function createFormFromImplementedItem(item, pendingIconName) {
    const lockedPendingImage = pendingIconName || item.pendingIconName;
    const resolvedImage = lockedPendingImage
        ? `${lockedPendingImage}.${CONFIG.ICON_EXTENSION}`
        : (item.image || `${item.name}.png`);
    return {
        name: item.name || pendingIconName,
        label: item.label || toDisplayLabel(pendingIconName || item.name),
        description: item.description || "",
        weight: String(item.weight ?? 0),
        type: item.type || "item",
        rarity: item.rarity || "common",
        unique: readItemUniqueValue(item),
        useable: Boolean(item.useable),
        shouldClose: item.shouldClose !== false,
        decay: item.decay !== undefined && item.decay !== null ? String(item.decay) : "",
        ammotype: item.ammotype || "",
        consume: item.consume !== undefined && item.consume !== null ? String(item.consume) : "",
        allowArmed: item.allowArmed === true ? "true" : item.allowArmed === false ? "false" : "",
        allowInBackpack: item.allowInBackpack === true ? "true" : item.allowInBackpack === false ? "false" : "",
        extraLua: item.extraLua || buildExtraLuaFromItem(item),
        image: resolvedImage,
        siteCategory: item.siteCategory || item.pendingCategory || "",
    };
}

function createFormFromReadyItem(item, pendingIconName) {
    return {
        ...createFormFromImplementedItem(item, pendingIconName),
        image: item.image || `${item.name}.png`,
    };
}

function buildExtraLuaFromItem(item) {
    const extraFields = {};
    for (const [key, value] of Object.entries(item)) {
        if (ITEM_EXPORT_ORDER.includes(key) || ITEM_META_KEYS.has(key)) continue;
        if (value === undefined || value === null || value === "") continue;
        extraFields[key] = value;
    }
    return Object.entries(extraFields)
        .map(([k, v]) => `['${k}'] = ${serializeLuaValue(v, 1)},`)
        .join("\n");
}

function buildLuaEntry(item) {
    const lines = [`['${item.name}'] = {`];
    for (const key of ITEM_EXPORT_ORDER) {
        if (!(key in item)) continue;
        const value = item[key];
        if (value === undefined || value === null || value === "") continue;
        lines.push(`    ['${key}'] = ${serializeLuaValue(value, 1)},`);
    }
    if (item.extraLua && item.extraLua.trim()) {
        const rawLines = item.extraLua.trim().split("\n").map((l) => `    ${l.trim()}`).filter(Boolean);
        lines.push(...rawLines);
    } else {
        const extraFields = {};
        for (const [key, value] of Object.entries(item)) {
            if (ITEM_EXPORT_ORDER.includes(key) || ITEM_META_KEYS.has(key)) continue;
            if (value === undefined || value === null || value === "") continue;
            extraFields[key] = value;
        }
        for (const [key, value] of Object.entries(extraFields)) {
            lines.push(`    ['${key}'] = ${serializeLuaValue(value, 1)},`);
        }
    }
    lines.push("},");
    return lines.join("\n");
}

function buildCompactLuaEntries(items) {
    return items.map((item) => buildCompactLuaEntry(item)).join("\n");
}

function buildCompactLuaEntry(item) {
    const parts = [];
    for (const key of ITEM_EXPORT_ORDER) {
        if (!(key in item)) continue;
        const value = item[key];
        if (value === undefined || value === null || value === "") continue;
        parts.push(`['${key}'] = ${serializeLuaValueCompact(value)}`);
    }

    if (item.extraLua && item.extraLua.trim()) {
        parts.push(compactLuaRawBlock(item.extraLua));
    } else {
        const extraFields = {};
        for (const [key, value] of Object.entries(item)) {
            if (ITEM_EXPORT_ORDER.includes(key) || ITEM_META_KEYS.has(key)) continue;
            if (value === undefined || value === null || value === "") continue;
            extraFields[key] = value;
        }
        for (const [key, value] of Object.entries(extraFields)) {
            parts.push(`['${key}'] = ${serializeLuaValueCompact(value)}`);
        }
    }

    return `['${item.name}'] = { ${parts.join(", ")} },`;
}

function serializeLuaValue(value, depth = 0) {
    if (typeof value === "string") return `'${escapeLuaString(value)}'`;
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return value ? "true" : "false";
    if (Array.isArray(value)) {
        if (value.length === 0) return "{}";
        const indent = "    ".repeat(depth + 1);
        const closeIndent = "    ".repeat(depth);
        return `{\n${value.map((e) => `${indent}${serializeLuaValue(e, depth + 1)},`).join("\n")}\n${closeIndent}}`;
    }
    if (value && typeof value === "object") {
        const entries = Object.entries(value);
        if (entries.length === 0) return "{}";
        const indent = "    ".repeat(depth + 1);
        const closeIndent = "    ".repeat(depth);
        return `{\n${entries.map(([k, v]) => `${indent}['${k}'] = ${serializeLuaValue(v, depth + 1)},`).join("\n")}\n${closeIndent}}`;
    }
    return "nil";
}

function serializeLuaValueCompact(value) {
    if (typeof value === "string") return `'${escapeLuaString(value)}'`;
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return value ? "true" : "false";
    if (Array.isArray(value)) {
        return `{ ${value.map((entry) => serializeLuaValueCompact(entry)).join(", ")} }`;
    }
    if (value && typeof value === "object") {
        const entries = Object.entries(value).map(([key, entry]) => `['${key}'] = ${serializeLuaValueCompact(entry)}`);
        return `{ ${entries.join(", ")} }`;
    }
    return "nil";
}

function compactLuaRawBlock(raw) {
    return raw
        .trim()
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join(" ");
}

function escapeLuaString(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\r/g, "").replace(/\n/g, "\\n");
}

function parseLuaItemBlock(input) {
    const parser = createLuaTableParser(input);
    const parsed = parser.parseTopLevelItem();
    const item = unwrapImportedLuaItem(parsed);
    if (!item || Array.isArray(item) || typeof item !== "object") {
        throw new Error("O bloco colado nao parece um item Lua valido.");
    }
    return item;
}

function unwrapImportedLuaItem(value) {
    if (!value || Array.isArray(value) || typeof value !== "object") return value;
    const itemKeys = ["name", "label", "weight", "type", "image", "description", "rarity"];
    if (itemKeys.some((key) => key in value)) return value;

    const entries = Object.entries(value);
    if (entries.length === 1 && entries[0][1] && typeof entries[0][1] === "object" && !Array.isArray(entries[0][1])) {
        const [outerKey, innerValue] = entries[0];
        if (!("name" in innerValue) && typeof outerKey === "string") {
            innerValue.name = outerKey;
        }
        return innerValue;
    }
    return value;
}

function applyImportedItemToBuilder(importedItem) {
    const current = state.builder.form;
    const keepIdentity = Boolean(state.builder.activePendingName || state.builder.editingLocalName || state.builder.editingReadyName);
    const importedName = normalizeImportedItemName(importedItem.name);
    const importedImage = typeof importedItem.image === "string" ? importedItem.image.trim() : "";
    const currentImageIsDefault = !current.image || current.image === "novo-item.png";

    state.builder.templateName = null;
    state.builder.templateSource = null;
    state.builder.form = {
        ...current,
        name: keepIdentity ? current.name : (importedName || current.name),
        label: readImportedString(importedItem.label, current.label),
        description: readImportedString(importedItem.description, current.description),
        weight: readImportedNumberString(importedItem.weight, current.weight),
        type: readImportedEnum(importedItem.type, ["item", "weapon"], current.type),
        rarity: readImportedEnum(importedItem.rarity, RARITY_ORDER, current.rarity),
        unique: readImportedUniqueValue(importedItem, current.unique),
        useable: readImportedBoolean(importedItem.useable, current.useable),
        shouldClose: readImportedBoolean(importedItem.shouldClose, current.shouldClose),
        decay: readImportedOptionalNumberString(importedItem.decay, current.decay),
        ammotype: readImportedOptionalString(importedItem.ammotype, current.ammotype),
        consume: readImportedOptionalNumberString(importedItem.consume, current.consume),
        allowArmed: normalizeBooleanSelectValue(importedItem.allowArmed, current.allowArmed),
        allowInBackpack: normalizeBooleanSelectValue(importedItem.allowInBackpack, current.allowInBackpack),
        extraLua: buildExtraLuaFromItem(importedItem),
        image: keepIdentity || !currentImageIsDefault ? current.image : (importedImage || current.image),
    };
    renderBuilder();
}

function normalizeImportedItemName(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, "-");
}

function readImportedString(value, fallback) {
    return typeof value === "string" ? value : fallback;
}

function readImportedOptionalString(value, fallback) {
    return typeof value === "string" ? value : (value === null ? "" : fallback);
}

function readImportedNumberString(value, fallback) {
    return typeof value === "number" && Number.isFinite(value) ? String(value) : fallback;
}

function readImportedOptionalNumberString(value, fallback) {
    if (value === null) return "";
    return readImportedNumberString(value, fallback);
}

function readImportedBoolean(value, fallback) {
    return typeof value === "boolean" ? value : fallback;
}

function readImportedUniqueValue(importedItem, fallback) {
    if (typeof importedItem?.unique === "boolean") return importedItem.unique;
    if (typeof importedItem?.stack === "boolean") return !importedItem.stack;
    return fallback;
}

function readImportedEnum(value, allowed, fallback) {
    return typeof value === "string" && allowed.includes(value) ? value : fallback;
}

function normalizeBooleanSelectValue(value, fallback) {
    if (value === true) return "true";
    if (value === false) return "false";
    if (value === null) return "";
    return fallback;
}

function createLuaTableParser(input) {
    const tokens = tokenizeLuaTable(input);
    let index = 0;

    function peek(offset = 0) {
        return tokens[index + offset] || null;
    }

    function next() {
        return tokens[index++] || null;
    }

    function expectValueToken(expected) {
        const token = next();
        if (!token || token.value !== expected) {
            throw new Error(`Esperado "${expected}" perto de ${describeLuaToken(token)}.`);
        }
        return token;
    }

    function parseTopLevelItem() {
        if (peek()?.type === "identifier" && peek()?.value === "return") {
            next();
        }

        const first = peek();
        if (!first) throw new Error("Bloco Lua vazio.");
        if (first.value === "{") {
            next();
            const table = parseTable();
            skipTrailingComma();
            ensureAtEnd();
            return table;
        }

        const savedIndex = index;
        const key = tryParseKey();
        if (key !== null && peek()?.value === "=") {
            next();
            const value = parseValue();
            skipTrailingComma();
            ensureAtEnd();
            if (value && typeof value === "object" && !Array.isArray(value) && value.name === undefined && typeof key === "string") {
                value.name = key;
            }
            return value;
        }
        index = savedIndex;
        const value = parseValue();
        skipTrailingComma();
        ensureAtEnd();
        return value;
    }

    function parseValue() {
        const token = next();
        if (!token) throw new Error("Fim inesperado do bloco Lua.");
        if (token.type === "string" || token.type === "number") return token.value;
        if (token.type === "identifier") {
            if (token.value === "true") return true;
            if (token.value === "false") return false;
            if (token.value === "nil") return null;
            return token.value;
        }
        if (token.value === "{") return parseTable();
        throw new Error(`Valor Lua nao suportado perto de ${describeLuaToken(token)}.`);
    }

    function parseTable() {
        const objectResult = {};
        const arrayResult = [];
        let hasNamedEntries = false;
        let hasIndexedEntries = false;

        while (true) {
            const token = peek();
            if (!token) throw new Error("Tabela Lua nao foi fechada com }.");
            if (token.value === "}") {
                next();
                break;
            }
            if (token.value === ",") {
                next();
                continue;
            }

            const savedIndex = index;
            const key = tryParseKey();
            if (key !== null && peek()?.value === "=") {
                hasNamedEntries = true;
                next();
                objectResult[String(key)] = parseValue();
            } else {
                index = savedIndex;
                hasIndexedEntries = true;
                arrayResult.push(parseValue());
            }

            if (peek()?.value === ",") next();
        }

        if (hasNamedEntries && !hasIndexedEntries) return objectResult;
        if (!hasNamedEntries) return arrayResult;

        arrayResult.forEach((value, idx) => {
            objectResult[String(idx + 1)] = value;
        });
        return objectResult;
    }

    function tryParseKey() {
        const token = peek();
        if (!token) return null;
        if (token.value === "[") {
            next();
            const keyToken = next();
            if (!keyToken || !["string", "number", "identifier"].includes(keyToken.type)) {
                throw new Error(`Chave Lua invalida perto de ${describeLuaToken(keyToken)}.`);
            }
            expectValueToken("]");
            return keyToken.value;
        }
        if (token.type === "identifier") {
            next();
            return token.value;
        }
        return null;
    }

    function skipTrailingComma() {
        while (peek()?.value === ",") next();
    }

    function ensureAtEnd() {
        if (peek()) {
            throw new Error("Cole apenas um item Lua por vez.");
        }
    }

    return { parseTopLevelItem };
}

function tokenizeLuaTable(input) {
    const tokens = [];
    let index = 0;

    while (index < input.length) {
        const char = input[index];

        if (/\s/.test(char)) {
            index++;
            continue;
        }

        if (char === "-" && input[index + 1] === "-") {
            index += 2;
            while (index < input.length && input[index] !== "\n") index++;
            continue;
        }

        if ("{}[]=,".includes(char)) {
            tokens.push({ type: "punct", value: char });
            index++;
            continue;
        }

        if (char === "'" || char === "\"") {
            const quote = char;
            index++;
            let value = "";
            while (index < input.length) {
                const current = input[index];
                if (current === "\\") {
                    const nextChar = input[index + 1];
                    if (nextChar === undefined) break;
                    value += nextChar;
                    index += 2;
                    continue;
                }
                if (current === quote) {
                    index++;
                    break;
                }
                value += current;
                index++;
            }
            tokens.push({ type: "string", value });
            continue;
        }

        if ((char === "-" && /[0-9]/.test(input[index + 1])) || /[0-9]/.test(char)) {
            let raw = char;
            index++;
            while (index < input.length && /[0-9.]/.test(input[index])) {
                raw += input[index];
                index++;
            }
            const parsed = Number(raw);
            if (Number.isNaN(parsed)) {
                throw new Error(`Numero Lua invalido: ${raw}`);
            }
            tokens.push({ type: "number", value: parsed });
            continue;
        }

        if (/[A-Za-z_]/.test(char)) {
            let ident = char;
            index++;
            while (index < input.length && /[A-Za-z0-9_]/.test(input[index])) {
                ident += input[index];
                index++;
            }
            tokens.push({ type: "identifier", value: ident });
            continue;
        }

        throw new Error(`Token Lua nao suportado: ${char}`);
    }

    return tokens;
}

function describeLuaToken(token) {
    if (!token) return "fim do texto";
    return `"${token.value}"`;
}

// ============================================================
//  DATA QUERIES
// ============================================================

function getPendingItems() {
    const archived = new Set(state.archivedPending);
    return state.basePendingItems
        .map((item) => ({ ...item, conflict: hasServerConflict(item.name) }))
        .filter((item) => !archived.has(item.name));
}

function hasServerConflict(iconName) {
    const lower = iconName.toLowerCase();
    return getAllImplementedItems()
        .filter((i) => i.source !== "local")
        .some((i) =>
            i.name.toLowerCase() === lower ||
            stripExtension(i.image || "").toLowerCase() === lower
        );
}

function getFilteredPendingItems() {
    return getPendingItems().filter((item) => {
        const catMatch = state.pendingCategory === "all" || item.category === state.pendingCategory;
        const searchMatch = !state.pendingSearch ||
            item.name.toLowerCase().includes(state.pendingSearch) ||
            item.category.toLowerCase().includes(state.pendingSearch);
        return catMatch && searchMatch;
    });
}

function getAllImplementedItems() {
    const localItems = Object.values(state.customImplemented).map(normalizeLocalItem);
    return [...state.baseImplementedItems, ...localItems].sort((a, b) => {
        if (a.source !== b.source) return a.source === "local" ? -1 : 1;
        return (a.label || a.name).localeCompare(b.label || b.name, "pt-BR");
    });
}

function getFilteredImplementedItems() {
    return getAllImplementedItems().filter((item) => {
        const typeMatch = state.implementedType === "all" || item.type === state.implementedType;
        const rarityMatch = state.implementedRarity === "all" || item.rarity === state.implementedRarity;
        const catMatch = state.implementedCategory === "all" ||
            (state.implementedCategory === "__none__" ? !item.siteCategory : item.siteCategory === state.implementedCategory);
        const haystack = [item.name, item.label, item.description, item.image, item.type, item.rarity, item.siteCategory]
            .filter(Boolean).join(" ").toLowerCase();
        const searchMatch = !state.implementedSearch || haystack.includes(state.implementedSearch);
        return typeMatch && rarityMatch && catMatch && searchMatch;
    });
}

function getFilteredReadyItems() {
    return state.readyItems.filter((item) => {
        const typeMatch = state.readyType === "all" || item.type === state.readyType;
        const rarityMatch = state.readyRarity === "all" || item.rarity === state.readyRarity;
        const catMatch = state.readyCategory === "all" ||
            (state.readyCategory === "__none__" ? !item.siteCategory : item.siteCategory === state.readyCategory);
        const haystack = [item.name, item.label, item.description, item.type, item.rarity, item.siteCategory]
            .filter(Boolean).join(" ").toLowerCase();
        const searchMatch = !state.readySearch || haystack.includes(state.readySearch);
        return typeMatch && rarityMatch && catMatch && searchMatch;
    });
}

function getPendingItemByName(name) {
    return state.basePendingItems.find((i) => i.name === name) || null;
}

function getImplementedItemByName(name) {
    const target = String(name || "").toLowerCase();
    return getAllImplementedItems().find((i) => i.name.toLowerCase() === target) || null;
}

function getBuilderPendingItem() {
    if (state.builder.activePendingName) {
        const fromBase = getPendingItemByName(state.builder.activePendingName);
        if (fromBase) return fromBase;
    }

    const editingItem = state.builder.editingLocalName
        ? state.customImplemented[state.builder.editingLocalName]
        : state.builder.editingReadyName
            ? state.readyItems.find((r) => r.name === state.builder.editingReadyName)
            : null;

    if (editingItem && editingItem.pendingIconName) {
        const pendingName = editingItem.pendingIconName;
        return {
            name: pendingName,
            category: editingItem.pendingCategory || "Local",
            image: `${pendingName}.${CONFIG.ICON_EXTENSION}`,
            displayPath: `${CONFIG.ICONS_FOLDER}/${pendingName}.${CONFIG.ICON_EXTENSION}`,
        };
    }

    if (!state.builder.form) return null;

    return {
        name: stripExtension(state.builder.form.image || state.builder.form.name || "manual"),
        category: "Manual",
        image: state.builder.form.image || "icon neutro.png",
        displayPath: "icon neutro.png",
        isManual: true,
    };
}

// ============================================================
//  IMAGE CANDIDATES
// ============================================================

function getPendingImageCandidates(item) {
    return [item.displayPath];
}

function buildUploadedImageSrc(base64, mime = "image/png") {
    if (!base64) return "";
    return `data:${mime || "image/png"};base64,${base64}`;
}

function getImplementedImageCandidates(item) {
    const candidates = [];
    if (item.iconSource === "upload" && item.uploadedIconBase64) {
        candidates.push(buildUploadedImageSrc(item.uploadedIconBase64, item.uploadedIconMime));
    }
    if (item.iconSource === "ready") {
        candidates.push(`${CONFIG.READY_ICONS_FOLDER}/${item.name}.png`);
    }
    if (item.source === "local" && item.pendingIconName) {
        candidates.push(`${CONFIG.ICONS_FOLDER}/${item.pendingIconName}.${CONFIG.ICON_EXTENSION}`);
    }
    if (item.image) {
        candidates.push(`server-icons/${item.image}`);
        candidates.push(`${CONFIG.ICONS_FOLDER}/${stripExtension(item.image)}.${CONFIG.ICON_EXTENSION}`);
    }
    if (item.pendingIconName) {
        candidates.push(`${CONFIG.ICONS_FOLDER}/${item.pendingIconName}.${CONFIG.ICON_EXTENSION}`);
    }
    candidates.push(`${CONFIG.ICONS_FOLDER}/${item.name}.${CONFIG.ICON_EXTENSION}`);
    return Array.from(new Set(candidates.filter(Boolean)));
}

function getStoredReadyImageCandidates(item) {
    const candidates = [];
    if (item.uploadedIconBase64) {
        candidates.push(buildUploadedImageSrc(item.uploadedIconBase64, item.uploadedIconMime));
    }
    candidates.push(`${CONFIG.READY_ICONS_FOLDER}/${item.name}.png`);
    if (item.image) {
        candidates.push(`server-icons/${item.image}`);
        candidates.push(`${CONFIG.ICONS_FOLDER}/${stripExtension(item.image)}.${CONFIG.ICON_EXTENSION}`);
    }
    if (item.pendingIconName) {
        candidates.push(`${CONFIG.ICONS_FOLDER}/${item.pendingIconName}.${CONFIG.ICON_EXTENSION}`);
    }
    candidates.push(`${CONFIG.ICONS_FOLDER}/${item.name}.${CONFIG.ICON_EXTENSION}`);
    return Array.from(new Set(candidates.filter(Boolean)));
}

function getReadyImageCandidates(item) {
    if (item.iconSource === "ready" || item.iconSource === "upload") {
        return getStoredReadyImageCandidates(item);
    }

    const candidates = [];
    if (item.iconSource === "upload" && item.uploadedIconBase64) {
        candidates.push(buildUploadedImageSrc(item.uploadedIconBase64, item.uploadedIconMime));
    }
    if (item.pendingIconName) {
        candidates.push(`${CONFIG.ICONS_FOLDER}/${item.pendingIconName}.${CONFIG.ICON_EXTENSION}`);
    }
    if (item.image) {
        candidates.push(`server-icons/${item.image}`);
        candidates.push(`${CONFIG.ICONS_FOLDER}/${stripExtension(item.image)}.${CONFIG.ICON_EXTENSION}`);
    }
    candidates.push(`${CONFIG.ICONS_FOLDER}/${item.name}.${CONFIG.ICON_EXTENSION}`);
    return Array.from(new Set(candidates.filter(Boolean)));
}

// ============================================================
//  LAZY IMAGE LOADING
// ============================================================

let _lazyImageObserver = null;

function getLazyImageObserver() {
    if (!_lazyImageObserver) {
        _lazyImageObserver = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    const img = entry.target;
                    if (img.dataset.loaded) continue;
                    const candidates = parseCandidateString(img.dataset.candidates || "");
                    applyImageCandidates(img, candidates, img.dataset.label || "item");
                    img.dataset.loaded = "1";
                    _lazyImageObserver.unobserve(img);
                }
            },
            { rootMargin: "200px 0px" }
        );
    }
    return _lazyImageObserver;
}

function hydrateImages(root) {
    const observer = getLazyImageObserver();
    root.querySelectorAll("img[data-candidates]").forEach((img) => {
        if (img.dataset.loaded) return;
        observer.observe(img);
    });
}

function applyImageCandidates(image, candidates, label) {
    const list = candidates.filter(Boolean);
    let index = 0;
    image.classList.remove("missing-image");
    image.onerror = () => {
        index++;
        if (index < list.length) { image.src = list[index]; return; }
        image.onerror = null;
        image.classList.add("missing-image");
        image.src = createPlaceholderDataUri(label);
    };
    image.src = list[0] || createPlaceholderDataUri(label);
}

function createPlaceholderDataUri(label) {
    const text = (label || "?")
        .replace(/[^A-Za-z0-9]/g, " ").trim().split(/\s+/).slice(0, 2)
        .map((p) => p.charAt(0).toUpperCase()).join("") || "?";
    const isDayTheme = document.documentElement.getAttribute("data-theme") === "day";
    const bgOuter = isDayTheme ? "#1a1408" : "#0e0f16";
    const bgInner = isDayTheme ? "#241c0e" : "#14161e";
    const stroke = isDayTheme ? "#3d3018" : "#22243a";
    const textColor = isDayTheme ? "#f59e0b" : "#8b5cf6";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="20" fill="${bgOuter}"/><rect x="10" y="10" width="76" height="76" rx="16" fill="${bgInner}" stroke="${stroke}"/><text x="48" y="54" text-anchor="middle" fill="${textColor}" font-size="24" font-family="Arial,sans-serif" opacity="0.6">${text}</text></svg>`.trim();
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function buildCandidateString(candidates) { return candidates.join("|"); }
function parseCandidateString(value) {
    return String(value || "").split("|").map((e) => e.trim()).filter(Boolean);
}

// ============================================================
//  UTILITIES
// ============================================================

function debounce(fn, ms) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

function base64Decode(str) {
    const bytes = Uint8Array.from(atob(str.replace(/\n/g, "")), (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

function base64Encode(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
}

function copyToClipboard(text, message) {
    navigator.clipboard.writeText(text)
        .then(() => showToast(message || "Copiado."))
        .catch(() => {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.cssText = "position:fixed;opacity:0;";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            showToast(message || "Copiado.");
        });
}

function showToast(message) {
    const toast = document.getElementById("toast");
    const text = document.getElementById("toastText");
    text.textContent = message;
    toast.classList.add("visible");
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("visible"), 2600);
}

function toDisplayLabel(name) {
    return name.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function stripExtension(fileName) {
    return String(fileName || "").replace(/\.[^.]+$/, "");
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function escapeHtmlAttribute(value) {
    return escapeHtml(value).replace(/\|/g, "&#124;");
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ============================================================
//  THEME
// ============================================================

function initTheme() {
    const saved = localStorage.getItem("underrp-theme") || "night";
    applyTheme(saved);
}

function applyTheme(theme) {
    if (theme === "day") document.documentElement.setAttribute("data-theme", "day");
    else document.documentElement.removeAttribute("data-theme");

    const icon = document.querySelector(".theme-toggle .toggle-icon");
    const label = document.querySelector(".theme-toggle .toggle-label");
    if (icon) icon.textContent = theme === "day" ? "☀️" : "🌙";
    if (label) label.textContent = theme === "day" ? "Day" : "Night";
}

function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "day" ? "night" : "day";
    applyTheme(next);
    localStorage.setItem("underrp-theme", next);
    showToast(`Modo ${next === "day" ? "Day ☀️" : "Night 🌙"} ativado.`);
}

// ============================================================
//  INTERSECTION OBSERVER (fade-in)
// ============================================================

function initFadeInObserver() {
    const targets = document.querySelectorAll(".fade-in");
    if (!targets.length) return;
    if (typeof IntersectionObserver !== "function") {
        targets.forEach((target) => target.classList.add("visible"));
        return;
    }
    const observer = new IntersectionObserver(
        (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } }),
        { threshold: 0.1 }
    );
    targets.forEach((t) => observer.observe(t));
    setTimeout(() => {
        targets.forEach((target) => target.classList.add("visible"));
    }, 800);
}
