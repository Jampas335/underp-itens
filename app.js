const STORAGE_KEY = "undercity-item-workbench-v1";
const DEFAULT_VIEW = "pending";
const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"];
const TYPE_ORDER = ["all", "item", "weapon"];
const ITEM_EXPORT_ORDER = [
    "name",
    "label",
    "weight",
    "type",
    "image",
    "unique",
    "useable",
    "shouldClose",
    "description",
    "rarity",
    "decay",
    "ammotype",
    "consume",
    "allowArmed",
];
const ITEM_META_KEYS = new Set([
    "source",
    "pendingIconName",
    "pendingCategory",
    "savedAt",
    "extraLua",
    "imageSource",
]);

const state = {
    activeView: DEFAULT_VIEW,
    pendingSearch: "",
    implementedSearch: "",
    pendingCategory: "all",
    implementedType: "all",
    implementedRarity: "all",
    basePendingItems: [],
    baseImplementedItems: [],
    customImplemented: {},
    archivedPending: [],
    builder: {
        activePendingName: null,
        editingLocalName: null,
        templateName: null,
        form: null,
    },
};

let toastTimeout = null;

document.addEventListener("DOMContentLoaded", () => {
    bootstrapData();
    loadWorkspaceState();
    bindEvents();
    renderAll();
});

function bootstrapData() {
    applyBranding();
    state.basePendingItems = flattenPendingItems();
    state.baseImplementedItems = (IMPLEMENTED_ITEMS || []).map(normalizeImplementedItem);
}

function applyBranding() {
    const title = CONFIG.SITE_TITLE || "UnderCity";
    const subtitle =
        CONFIG.SITE_SUBTITLE && CONFIG.SITE_SUBTITLE !== "Icon Catalog"
            ? CONFIG.SITE_SUBTITLE
            : "Item Workbench";

    document.title = `${title} | ${subtitle}`;
    setText("siteTitle", title);
    setText("siteSubtitle", subtitle);
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
        const categoryCompare = a.category.localeCompare(b.category, "pt-BR");
        if (categoryCompare !== 0) return categoryCompare;
        return a.name.localeCompare(b.name, "pt-BR");
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
        unique: Boolean(item.unique),
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
    };
}

function loadWorkspaceState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);
        state.customImplemented = Object.fromEntries(
            Object.entries(parsed.customImplemented || {}).map(([name, item]) => [
                name,
                normalizeLocalItem(item),
            ])
        );
        state.archivedPending = Array.isArray(parsed.archivedPending)
            ? parsed.archivedPending.filter(Boolean)
            : [];
    } catch (error) {
        console.error("Falha ao carregar estado local:", error);
    }
}

function saveWorkspaceState() {
    const payload = {
        customImplemented: state.customImplemented,
        archivedPending: Array.from(new Set(state.archivedPending)).sort(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function bindEvents() {
    document.getElementById("viewPendingBtn").addEventListener("click", () => {
        state.activeView = "pending";
        renderAll();
    });

    document.getElementById("viewImplementedBtn").addEventListener("click", () => {
        state.activeView = "implemented";
        renderAll();
    });

    document.getElementById("pendingSearchInput").addEventListener("input", (event) => {
        state.pendingSearch = event.target.value.toLowerCase().trim();
        renderPendingSection();
    });

    document.getElementById("implementedSearchInput").addEventListener("input", (event) => {
        state.implementedSearch = event.target.value.toLowerCase().trim();
        renderImplementedSection();
    });

    document.getElementById("pendingCategoryFilter").addEventListener("click", handlePendingChipClick);
    document.getElementById("implementedTypeFilter").addEventListener("click", handleImplementedTypeClick);
    document.getElementById("implementedRarityFilter").addEventListener("click", handleImplementedRarityClick);

    document.getElementById("pendingGrid").addEventListener("click", handlePendingGridClick);
    document.getElementById("implementedGrid").addEventListener("click", handleImplementedGridClick);

    document.getElementById("copyExportBtn").addEventListener("click", copyBuilderExport);
    document.getElementById("saveImplementedBtn").addEventListener("click", saveBuilderItem);
    document.getElementById("resetBuilderBtn").addEventListener("click", resetBuilder);
    document.getElementById("clearTemplateBtn").addEventListener("click", clearBuilderTemplate);
    document.getElementById("copyIconNameBtn").addEventListener("click", copySelectedIconName);
    document.getElementById("exportWorkspaceBtn").addEventListener("click", exportLocalWorkspace);
    document.getElementById("resetWorkspaceBtn").addEventListener("click", resetLocalWorkspace);

    const form = document.getElementById("itemForm");
    form.addEventListener("input", syncBuilderFormFromInputs);
    form.addEventListener("change", syncBuilderFormFromInputs);
}

function handlePendingChipClick(event) {
    const button = event.target.closest("[data-category]");
    if (!button) return;

    state.pendingCategory = button.dataset.category;
    renderPendingSection();
}

function handleImplementedTypeClick(event) {
    const button = event.target.closest("[data-type]");
    if (!button) return;

    state.implementedType = button.dataset.type;
    renderImplementedSection();
}

function handleImplementedRarityClick(event) {
    const button = event.target.closest("[data-rarity]");
    if (!button) return;

    state.implementedRarity = button.dataset.rarity;
    renderImplementedSection();
}

function handlePendingGridClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const { action, name } = button.dataset;
    if (action === "implement") {
        openBuilderFromPending(name);
    } else if (action === "copy-icon") {
        copyToClipboard(name, "Nome do icone copiado.");
    }
}

function handleImplementedGridClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const { action, name } = button.dataset;
    const item = getImplementedItemByName(name);
    if (!item) return;

    if (action === "copy-export") {
        copyToClipboard(buildLuaEntry(item), "Export do item copiado.");
        return;
    }

    if (action === "use-template") {
        applyTemplate(item);
        return;
    }

    if (action === "edit-local") {
        openBuilderForLocal(name);
        return;
    }

    if (action === "restore-pending") {
        restorePendingFromLocal(name);
    }
}

function renderAll() {
    renderHeroMeta();
    renderStats();
    renderView();
    renderPendingSection();
    renderImplementedSection();
    renderBuilder();
}

function renderHeroMeta() {
    const generatedAt = IMPLEMENTED_ITEMS_META && IMPLEMENTED_ITEMS_META.generatedAt
        ? new Date(IMPLEMENTED_ITEMS_META.generatedAt)
        : null;

    setText(
        "syncTimestamp",
        generatedAt
            ? generatedAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
            : "Snapshot indisponivel"
    );

    const summary = IMPLEMENTED_ITEMS_META
        ? `${IMPLEMENTED_ITEMS_META.totalItems} itens do servidor . ${IMPLEMENTED_ITEMS_META.copiedImages} imagens sincronizadas`
        : "Sem metadados do snapshot";

    setText("syncSummary", summary);
}

function renderStats() {
    const pendingCount = getPendingItems().length;
    const implementedItems = getAllImplementedItems();
    const localCount = Object.keys(state.customImplemented).length;

    setText("pendingCount", String(pendingCount));
    setText(
        "serverImplementedCount",
        String(implementedItems.filter((item) => item.source !== "local").length)
    );
    setText("localImplementedCount", String(localCount));
}

function renderView() {
    const pendingBtn = document.getElementById("viewPendingBtn");
    const implementedBtn = document.getElementById("viewImplementedBtn");
    const pendingView = document.getElementById("pendingView");
    const implementedView = document.getElementById("implementedView");

    pendingBtn.classList.toggle("active", state.activeView === "pending");
    implementedBtn.classList.toggle("active", state.activeView === "implemented");
    pendingView.classList.toggle("hidden", state.activeView !== "pending");
    implementedView.classList.toggle("hidden", state.activeView !== "implemented");
}

function renderPendingSection() {
    renderPendingCategoryFilters();
    renderPendingGrid();
}

function renderImplementedSection() {
    renderImplementedFilters();
    renderImplementedGrid();
}

function renderPendingCategoryFilters() {
    const container = document.getElementById("pendingCategoryFilter");
    const pendingItems = getPendingItems();
    const counts = new Map();

    for (const item of pendingItems) {
        counts.set(item.category, (counts.get(item.category) || 0) + 1);
    }

    const chips = [
        `<button class="chip-btn ${state.pendingCategory === "all" ? "active" : ""}" data-category="all" type="button">Todos (${pendingItems.length})</button>`,
        ...Array.from(counts.entries()).map(
            ([category, count]) =>
                `<button class="chip-btn ${state.pendingCategory === category ? "active" : ""}" data-category="${escapeHtmlAttribute(category)}" type="button">${escapeHtml(category)} (${count})</button>`
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

    grid.innerHTML = items
        .map((item) => {
            const statusLabel = item.conflict
                ? "Ja existe algo proximo no servidor"
                : "Pendente";
            const subtitle = item.conflict
                ? "Revise nome ou use outro identificador no builder."
                : item.category;

            return `
                <article class="item-card pending-card">
                    <div class="item-status-row">
                        <span class="status-pill ${item.conflict ? "conflict" : ""}">${statusLabel}</span>
                    </div>
                    <div class="item-preview">
                        <img data-candidates="${escapeHtmlAttribute(buildCandidateString(getPendingImageCandidates(item)))}" data-label="${escapeHtmlAttribute(item.name)}" alt="${escapeHtmlAttribute(item.name)}">
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
                </article>
            `;
        })
        .join("");

    hydrateImages(grid);
}

function renderImplementedFilters() {
    const typeContainer = document.getElementById("implementedTypeFilter");
    const rarityContainer = document.getElementById("implementedRarityFilter");
    const items = getAllImplementedItems();

    const typeCounts = new Map([["all", items.length]]);
    for (const type of TYPE_ORDER.filter((value) => value !== "all")) {
        typeCounts.set(type, items.filter((item) => item.type === type).length);
    }

    const rarityCounts = new Map([["all", items.length]]);
    for (const rarity of RARITY_ORDER) {
        rarityCounts.set(rarity, items.filter((item) => item.rarity === rarity).length);
    }

    typeContainer.innerHTML = TYPE_ORDER.map((type) => {
        const label = type === "all" ? "Todos" : type;
        return `<button class="chip-btn ${state.implementedType === type ? "active" : ""}" data-type="${type}" type="button">${escapeHtml(label)} (${typeCounts.get(type) || 0})</button>`;
    }).join("");

    rarityContainer.innerHTML = ["all", ...RARITY_ORDER].map((rarity) => {
        const label = rarity === "all" ? "Todas" : rarity;
        return `<button class="chip-btn ${state.implementedRarity === rarity ? "active" : ""}" data-rarity="${rarity}" type="button">${escapeHtml(label)} (${rarityCounts.get(rarity) || 0})</button>`;
    }).join("");
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

    grid.innerHTML = items
        .map((item) => {
            const sourceLabel = item.source === "local" ? "Local" : "Servidor";
            const actionButtons =
                item.source === "local"
                    ? `
                        <button class="card-action primary" data-action="copy-export" data-name="${escapeHtmlAttribute(item.name)}" type="button">Copiar export</button>
                        <button class="card-action" data-action="edit-local" data-name="${escapeHtmlAttribute(item.name)}" type="button">Editar</button>
                        <button class="card-action" data-action="restore-pending" data-name="${escapeHtmlAttribute(item.name)}" type="button">Reabrir</button>
                    `
                    : `
                        <button class="card-action primary" data-action="copy-export" data-name="${escapeHtmlAttribute(item.name)}" type="button">Copiar export</button>
                        <button class="card-action" data-action="use-template" data-name="${escapeHtmlAttribute(item.name)}" type="button">Usar template</button>
                    `;

            const metaParts = [item.type, `${item.weight}g`, item.image || "sem-imagem"];

            return `
                <article class="item-card implemented-card ${item.source === "local" ? "local-item" : ""}">
                    <div class="item-status-row">
                        <span class="source-pill">${escapeHtml(sourceLabel)}</span>
                        <span class="rarity-pill rarity-${escapeHtmlAttribute(item.rarity)}">${escapeHtml(item.rarity)}</span>
                    </div>
                    <div class="item-preview">
                        <img data-candidates="${escapeHtmlAttribute(buildCandidateString(getImplementedImageCandidates(item)))}" data-label="${escapeHtmlAttribute(item.label || item.name)}" alt="${escapeHtmlAttribute(item.label || item.name)}">
                    </div>
                    <div class="item-copy">
                        <strong class="item-title">${escapeHtml(item.label || item.name)}</strong>
                        <span class="item-subtitle">${escapeHtml(item.name)}</span>
                        <span class="item-meta">${escapeHtml(metaParts.join(" . "))}</span>
                    </div>
                    <div class="card-actions">
                        ${actionButtons}
                    </div>
                </article>
            `;
        })
        .join("");

    hydrateImages(grid);
}

function renderBuilder() {
    const idle = document.getElementById("builderIdle");
    const content = document.getElementById("builderContent");
    const badge = document.getElementById("builderModeBadge");
    const pendingItem = getBuilderPendingItem();

    if (!state.builder.form || !pendingItem) {
        idle.classList.remove("hidden");
        content.classList.add("hidden");
        badge.textContent = "Aguardando selecao";
        return;
    }

    idle.classList.add("hidden");
    content.classList.remove("hidden");
    badge.textContent = state.builder.editingLocalName ? "Editando item local" : "Novo implementado";

    setText("builderIconName", pendingItem.name);
    setText("builderIconCategory", pendingItem.category);
    setText("builderImageValue", state.builder.form.image || pendingItem.image);
    setText("builderSourceBadge", state.builder.editingLocalName ? "Local" : "Pendente");

    const templateItem = state.builder.templateName
        ? getImplementedItemByName(state.builder.templateName)
        : null;
    setText(
        "builderTemplateChip",
        templateItem ? `Template: ${templateItem.label || templateItem.name}` : "Sem template"
    );
    setText(
        "templateSummary",
        templateItem
            ? `${templateItem.label || templateItem.name} . ${templateItem.type} . ${templateItem.rarity}`
            : "Nenhum template aplicado."
    );

    syncBuilderInputs();

    const builderImage = document.getElementById("builderIconImage");
    applyImageCandidates(builderImage, getPendingImageCandidates(pendingItem), pendingItem.name);

    setText("luaExportPreview", buildLuaEntry(buildBuilderItemPreview()));
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
    document.getElementById("itemUseableInput").checked = form.useable;
    document.getElementById("itemShouldCloseInput").checked = form.shouldClose;
    document.getElementById("itemDecayInput").value = form.decay;
    document.getElementById("itemAmmoTypeInput").value = form.ammotype;
    document.getElementById("itemConsumeInput").value = form.consume;
    document.getElementById("itemAllowArmedSelect").value = form.allowArmed;
    document.getElementById("itemExtraLuaInput").value = form.extraLua;
    document.getElementById("itemImageInput").value = form.image;
}

function syncBuilderFormFromInputs() {
    if (!state.builder.form) return;

    const normalizedName = document
        .getElementById("itemNameInput")
        .value.trim()
        .toLowerCase()
        .replace(/\s+/g, "-");

    state.builder.form = {
        ...state.builder.form,
        name: normalizedName,
        label: document.getElementById("itemLabelInput").value.trim(),
        description: document.getElementById("itemDescriptionInput").value.trim(),
        weight: document.getElementById("itemWeightInput").value.trim(),
        type: document.getElementById("itemTypeSelect").value,
        rarity: document.getElementById("itemRaritySelect").value,
        unique: document.getElementById("itemUniqueInput").checked,
        useable: document.getElementById("itemUseableInput").checked,
        shouldClose: document.getElementById("itemShouldCloseInput").checked,
        decay: document.getElementById("itemDecayInput").value.trim(),
        ammotype: document.getElementById("itemAmmoTypeInput").value.trim(),
        consume: document.getElementById("itemConsumeInput").value.trim(),
        allowArmed: document.getElementById("itemAllowArmedSelect").value,
        extraLua: document.getElementById("itemExtraLuaInput").value,
        image: document.getElementById("itemImageInput").value.trim(),
    };

    document.getElementById("itemNameInput").value = normalizedName;
    setText("builderImageValue", state.builder.form.image);
    setText("luaExportPreview", buildLuaEntry(buildBuilderItemPreview()));
}

function openBuilderFromPending(name) {
    const item = getPendingItemByName(name);
    if (!item) return;

    state.builder.activePendingName = item.name;
    state.builder.editingLocalName = null;
    state.builder.templateName = null;
    state.builder.form = createDefaultFormFromPending(item);

    renderBuilder();
    showToast(`Builder carregado para ${item.name}.`);
}

function openBuilderForLocal(name) {
    const item = state.customImplemented[name];
    if (!item) return;

    state.builder.activePendingName = item.pendingIconName;
    state.builder.editingLocalName = name;
    state.builder.templateName = null;
    state.builder.form = createFormFromImplementedItem(item, item.pendingIconName);

    renderBuilder();
    showToast(`Editando ${item.name}.`);
}

function applyTemplate(item) {
    if (!state.builder.form || !getBuilderPendingItem()) {
        showToast("Selecione um item pendente primeiro.");
        return;
    }

    const current = state.builder.form;
    const template = createFormFromImplementedItem(item, getBuilderPendingItem().name);

    state.builder.templateName = item.name;
    state.builder.form = {
        ...current,
        type: template.type,
        rarity: template.rarity,
        weight: template.weight,
        unique: template.unique,
        useable: template.useable,
        shouldClose: template.shouldClose,
        decay: template.decay,
        ammotype: template.ammotype,
        consume: template.consume,
        allowArmed: template.allowArmed,
        extraLua: template.extraLua,
        description: current.description || template.description,
    };

    renderBuilder();
    showToast(`Template ${item.name} aplicado.`);
}

function clearBuilderTemplate() {
    if (state.builder.editingLocalName) {
        openBuilderForLocal(state.builder.editingLocalName);
        return;
    }

    if (!state.builder.activePendingName) {
        showToast("Nenhum builder ativo.");
        return;
    }

    openBuilderFromPending(state.builder.activePendingName);
}

function resetBuilder() {
    clearBuilderTemplate();
}

function copySelectedIconName() {
    const pending = getBuilderPendingItem();
    if (!pending) {
        showToast("Nenhum item selecionado.");
        return;
    }

    copyToClipboard(pending.name, "Nome do icone copiado.");
}

function copyBuilderExport() {
    if (!state.builder.form || !getBuilderPendingItem()) {
        showToast("Selecione um item para gerar o export.");
        return;
    }

    copyToClipboard(buildLuaEntry(buildBuilderItemPreview()), "Export copiado.");
}

function saveBuilderItem() {
    const pending = getBuilderPendingItem();
    const validation = validateBuilder();
    if (!pending || !validation.ok) {
        showToast(validation.message || "Selecione um item pendente.");
        return;
    }

    const previewItem = buildBuilderItemPreview();
    const previousName = state.builder.editingLocalName;

    if (previousName && previousName !== previewItem.name) {
        delete state.customImplemented[previousName];
    }

    state.customImplemented[previewItem.name] = normalizeLocalItem({
        ...previewItem,
        source: "local",
        pendingIconName: pending.name,
        pendingCategory: pending.category,
        imageSource: "pending",
        savedAt: new Date().toISOString(),
    });

    if (!state.archivedPending.includes(pending.name)) {
        state.archivedPending.push(pending.name);
    }

    saveWorkspaceState();
    state.activeView = "implemented";
    openBuilderForLocal(previewItem.name);
    renderAll();
    showToast(`Item ${previewItem.name} salvo em implementados.`);
}

function restorePendingFromLocal(name) {
    const item = state.customImplemented[name];
    if (!item) return;

    delete state.customImplemented[name];
    state.archivedPending = state.archivedPending.filter(
        (entry) => entry !== item.pendingIconName
    );

    if (state.builder.editingLocalName === name) {
        openBuilderFromPending(item.pendingIconName);
    }

    saveWorkspaceState();
    renderAll();
    showToast(`Item ${name} voltou para pendentes.`);
}

function exportLocalWorkspace() {
    const localItems = Object.values(state.customImplemented);
    if (localItems.length === 0) {
        showToast("Nao ha implementacoes locais para exportar.");
        return;
    }

    const blob = new Blob(
        [
            JSON.stringify(
                {
                    exportedAt: new Date().toISOString(),
                    localItems,
                },
                null,
                2
            ),
        ],
        { type: "application/json" }
    );

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "undercity-item-workbench-locais.json";
    link.click();
    URL.revokeObjectURL(link.href);

    showToast("Export local gerado.");
}

function resetLocalWorkspace() {
    if (!window.confirm("Isso vai remover os itens implementados localmente e reabrir os pendentes correspondentes. Continuar?")) {
        return;
    }

    state.customImplemented = {};
    state.archivedPending = [];
    state.builder = {
        activePendingName: null,
        editingLocalName: null,
        templateName: null,
        form: null,
    };

    localStorage.removeItem(STORAGE_KEY);
    renderAll();
    showToast("Workspace local limpo.");
}

function validateBuilder() {
    const form = state.builder.form;
    if (!form) {
        return { ok: false, message: "Nenhum item em edicao." };
    }

    if (!form.name) {
        return { ok: false, message: "Defina o nome do item." };
    }

    if (!/^[a-z0-9_][a-z0-9_-]*$/.test(form.name)) {
        return {
            ok: false,
            message: "Use apenas minusculas, numeros, underline ou hifen no nome do item.",
        };
    }

    if (!form.label) {
        return { ok: false, message: "Defina o label do item." };
    }

    const weight = Number(form.weight);
    if (!Number.isFinite(weight) || weight < 0) {
        return { ok: false, message: "Informe um peso valido." };
    }

    const existing = getImplementedItemByName(form.name);
    const isEditingSameLocal =
        state.builder.editingLocalName && state.builder.editingLocalName === form.name;

    if (existing && !isEditingSameLocal) {
        return { ok: false, message: "Ja existe um item implementado com esse nome." };
    }

    return { ok: true };
}

function buildBuilderItemPreview() {
    const pending = getBuilderPendingItem();
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
        pendingIconName: pending ? pending.name : stripExtension(form.image || form.name),
        pendingCategory: pending ? pending.category : "Local",
        extraLua: form.extraLua.trim(),
    };

    if (form.decay !== "") {
        item.decay = Number(form.decay);
    }
    if (form.ammotype) {
        item.ammotype = form.ammotype;
    }
    if (form.consume !== "") {
        item.consume = Number(form.consume);
    }
    if (form.allowArmed === "true") {
        item.allowArmed = true;
    } else if (form.allowArmed === "false") {
        item.allowArmed = false;
    }

    return item;
}

function createDefaultFormFromPending(item) {
    return {
        name: item.name,
        label: toDisplayLabel(item.name),
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
        extraLua: "",
        image: item.image,
    };
}

function createFormFromImplementedItem(item, pendingIconName) {
    return {
        name: item.name || pendingIconName,
        label: item.label || toDisplayLabel(pendingIconName || item.name),
        description: item.description || "",
        weight: String(item.weight ?? 0),
        type: item.type || "item",
        rarity: item.rarity || "common",
        unique: Boolean(item.unique),
        useable: Boolean(item.useable),
        shouldClose: item.shouldClose !== false,
        decay: item.decay !== undefined && item.decay !== null ? String(item.decay) : "",
        ammotype: item.ammotype || "",
        consume: item.consume !== undefined && item.consume !== null ? String(item.consume) : "",
        allowArmed:
            item.allowArmed === true ? "true" : item.allowArmed === false ? "false" : "",
        extraLua: item.extraLua || buildExtraLuaFromItem(item),
        image: `${pendingIconName || item.pendingIconName || stripExtension(item.image || item.name)}.${CONFIG.ICON_EXTENSION}`,
    };
}

function buildExtraLuaFromItem(item) {
    const extraFields = {};

    for (const [key, value] of Object.entries(item)) {
        if (ITEM_EXPORT_ORDER.includes(key) || ITEM_META_KEYS.has(key)) continue;
        if (value === undefined || value === null || value === "") continue;
        extraFields[key] = value;
    }

    const lines = Object.entries(extraFields).map(
        ([key, value]) => `['${key}'] = ${serializeLuaValue(value, 1)},`
    );

    return lines.join("\n");
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
        const rawLines = item.extraLua
            .trim()
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => `    ${line}`);

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

function serializeLuaValue(value, depth = 0) {
    if (typeof value === "string") {
        return `'${escapeLuaString(value)}'`;
    }

    if (typeof value === "number") {
        return String(value);
    }

    if (typeof value === "boolean") {
        return value ? "true" : "false";
    }

    if (Array.isArray(value)) {
        if (value.length === 0) return "{}";
        const indent = "    ".repeat(depth + 1);
        const closeIndent = "    ".repeat(depth);
        const parts = value.map((entry) => `${indent}${serializeLuaValue(entry, depth + 1)},`);
        return `{\n${parts.join("\n")}\n${closeIndent}}`;
    }

    if (value && typeof value === "object") {
        const entries = Object.entries(value);
        if (entries.length === 0) return "{}";

        const indent = "    ".repeat(depth + 1);
        const closeIndent = "    ".repeat(depth);
        const parts = entries.map(
            ([key, entryValue]) =>
                `${indent}['${key}'] = ${serializeLuaValue(entryValue, depth + 1)},`
        );

        return `{\n${parts.join("\n")}\n${closeIndent}}`;
    }

    return "nil";
}

function escapeLuaString(value) {
    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/\r/g, "")
        .replace(/\n/g, "\\n");
}

function getPendingItems() {
    const archived = new Set(state.archivedPending);
    return state.basePendingItems
        .map((item) => ({
            ...item,
            conflict: hasServerConflict(item.name),
        }))
        .filter((item) => !archived.has(item.name));
}

function hasServerConflict(iconName) {
    const lowerName = iconName.toLowerCase();
    const implementedItems = getAllImplementedItems().filter((item) => item.source !== "local");
    return implementedItems.some(
        (item) =>
            item.name.toLowerCase() === lowerName ||
            stripExtension(item.image || "").toLowerCase() === lowerName
    );
}

function getFilteredPendingItems() {
    return getPendingItems().filter((item) => {
        const categoryMatch =
            state.pendingCategory === "all" || item.category === state.pendingCategory;
        const searchMatch =
            !state.pendingSearch ||
            item.name.toLowerCase().includes(state.pendingSearch) ||
            item.category.toLowerCase().includes(state.pendingSearch);

        return categoryMatch && searchMatch;
    });
}

function getAllImplementedItems() {
    const localItems = Object.values(state.customImplemented).map(normalizeLocalItem);
    const combined = [...state.baseImplementedItems, ...localItems];

    return combined.sort((a, b) => {
        if (a.source !== b.source) {
            return a.source === "local" ? -1 : 1;
        }
        return (a.label || a.name).localeCompare(b.label || b.name, "pt-BR");
    });
}

function getFilteredImplementedItems() {
    return getAllImplementedItems().filter((item) => {
        const typeMatch =
            state.implementedType === "all" || item.type === state.implementedType;
        const rarityMatch =
            state.implementedRarity === "all" || item.rarity === state.implementedRarity;
        const haystack = [
            item.name,
            item.label,
            item.description,
            item.image,
            item.type,
            item.rarity,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
        const searchMatch =
            !state.implementedSearch || haystack.includes(state.implementedSearch);

        return typeMatch && rarityMatch && searchMatch;
    });
}

function getPendingItemByName(name) {
    return state.basePendingItems.find((item) => item.name === name) || null;
}

function getImplementedItemByName(name) {
    const target = String(name || "").toLowerCase();
    return getAllImplementedItems().find((item) => item.name.toLowerCase() === target) || null;
}

function getBuilderPendingItem() {
    if (!state.builder.activePendingName) return null;

    const fromBase = getPendingItemByName(state.builder.activePendingName);
    if (fromBase) return fromBase;

    const editingItem = state.builder.editingLocalName
        ? state.customImplemented[state.builder.editingLocalName]
        : null;
    if (!editingItem) return null;

    const pendingName =
        editingItem.pendingIconName || stripExtension(editingItem.image || editingItem.name);

    return {
        name: pendingName,
        category: editingItem.pendingCategory || "Local",
        image: `${pendingName}.${CONFIG.ICON_EXTENSION}`,
        displayPath: `${CONFIG.ICONS_FOLDER}/${pendingName}.${CONFIG.ICON_EXTENSION}`,
    };
}

function getPendingImageCandidates(item) {
    return [item.displayPath];
}

function getImplementedImageCandidates(item) {
    const candidates = [];

    if (item.source === "local" && item.pendingIconName) {
        candidates.push(`${CONFIG.ICONS_FOLDER}/${item.pendingIconName}.${CONFIG.ICON_EXTENSION}`);
    }

    if (item.image) {
        candidates.push(`server-icons/${item.image}`);
        candidates.push(`${CONFIG.ICONS_FOLDER}/${item.image}`);
        candidates.push(`${CONFIG.ICONS_FOLDER}/${stripExtension(item.image)}.${CONFIG.ICON_EXTENSION}`);
    }

    if (item.pendingIconName) {
        candidates.push(`${CONFIG.ICONS_FOLDER}/${item.pendingIconName}.${CONFIG.ICON_EXTENSION}`);
    }

    candidates.push(`${CONFIG.ICONS_FOLDER}/${item.name}.${CONFIG.ICON_EXTENSION}`);
    return Array.from(new Set(candidates.filter(Boolean)));
}

function hydrateImages(root) {
    root.querySelectorAll("img[data-candidates]").forEach((image) => {
        const candidates = parseCandidateString(image.dataset.candidates);
        applyImageCandidates(image, candidates, image.dataset.label || "item");
    });
}

function applyImageCandidates(image, candidates, label) {
    const list = candidates.filter(Boolean);
    let index = 0;

    image.classList.remove("missing-image");
    image.onerror = () => {
        index += 1;
        if (index < list.length) {
            image.src = list[index];
            return;
        }

        image.onerror = null;
        image.classList.add("missing-image");
        image.src = createPlaceholderDataUri(label);
    };

    image.src = list[0] || createPlaceholderDataUri(label);
}

function createPlaceholderDataUri(label) {
    const text = (label || "?")
        .replace(/[^A-Za-z0-9]/g, " ")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("") || "?";

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
            <rect width="96" height="96" rx="20" fill="#121925"/>
            <rect x="10" y="10" width="76" height="76" rx="16" fill="#1a2432" stroke="#2a3649"/>
            <text x="48" y="54" text-anchor="middle" fill="#9ab1c8" font-size="24" font-family="Arial, sans-serif">${text}</text>
        </svg>
    `.trim();

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function buildCandidateString(candidates) {
    return candidates.join("|");
}

function parseCandidateString(value) {
    return String(value || "")
        .split("|")
        .map((entry) => entry.trim())
        .filter(Boolean);
}

function copyToClipboard(text, message) {
    navigator.clipboard
        .writeText(text)
        .then(() => showToast(message || "Copiado."))
        .catch(() => {
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            showToast(message || "Copiado.");
        });
}

function showToast(message) {
    const toast = document.getElementById("toast");
    const text = document.getElementById("toastText");
    text.textContent = message;
    toast.classList.add("visible");

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove("visible");
    }, 2400);
}

function toDisplayLabel(name) {
    return name
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function stripExtension(fileName) {
    return String(fileName || "").replace(/\.[^.]+$/, "");
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function escapeHtmlAttribute(value) {
    return escapeHtml(value).replace(/\|/g, "&#124;");
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}
