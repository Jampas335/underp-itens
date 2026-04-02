/**
 * ============================================================
 *  APP.JS - UnderCity Icon Catalog
 * ============================================================
 */

// ===== STATE =====
let currentCategory = "all";
let searchQuery = "";
let allIcons = [];
let categories = [];

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
    parseIcons();
    renderCategories();
    renderGrid();
    updateStats();
    setupSearch();
    updateUrlDisplay();
});

// ===== PARSE ICONS FROM REGISTRY =====
function parseIcons() {
    allIcons = [];
    categories = [];

    for (const [category, items] of Object.entries(ICONS)) {
        categories.push(category);
        for (const name of items) {
            allIcons.push({
                name: name,
                category: category,
                url: getIconUrl(name),
                displayPath: getIconDisplayPath(name),
            });
        }
    }
}

// ===== URL HELPERS =====
// Caminho local/relativo para exibir a imagem (funciona local e no GitHub Pages)
function getIconDisplayPath(name) {
    return `${CONFIG.ICONS_FOLDER}/${name}.${CONFIG.ICON_EXTENSION}`;
}

// URL completa do GitHub Pages para copiar e usar no FiveM
function getIconUrl(name) {
    return `${CONFIG.BASE_URL}/${CONFIG.ICONS_FOLDER}/${name}.${CONFIG.ICON_EXTENSION}`;
}

function updateUrlDisplay() {
    const el = document.getElementById("urlStructure");
    if (el) {
        el.innerHTML = `${CONFIG.BASE_URL}/${CONFIG.ICONS_FOLDER}/<span class="url-highlight">nome-do-item</span>.${CONFIG.ICON_EXTENSION}`;
    }
}

// ===== RENDER CATEGORIES =====
function renderCategories() {
    const container = document.getElementById("categoryFilter");
    if (!container) return;

    let html = `<button class="category-btn active" onclick="filterCategory('all', this)">Todos</button>`;

    for (const cat of categories) {
        const count = ICONS[cat].length;
        html += `<button class="category-btn" onclick="filterCategory('${cat.replace(/'/g, "\\'")}', this)">${cat} <span style="opacity:0.5;font-size:11px;margin-left:2px;">(${count})</span></button>`;
    }

    container.innerHTML = html;
}

// ===== FILTER BY CATEGORY =====
function filterCategory(category, btn) {
    currentCategory = category;

    // Update active state
    document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");

    renderGrid();
}

// ===== SEARCH =====
function setupSearch() {
    const input = document.getElementById("searchInput");
    const clearBtn = document.getElementById("searchClear");
    if (!input) return;

    input.addEventListener("input", (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        clearBtn.classList.toggle("visible", searchQuery.length > 0);
        renderGrid();
    });

    // ESC to clear
    input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            clearSearch();
        }
    });
}

function clearSearch() {
    const input = document.getElementById("searchInput");
    const clearBtn = document.getElementById("searchClear");
    if (input) input.value = "";
    searchQuery = "";
    if (clearBtn) clearBtn.classList.remove("visible");
    renderGrid();
}

// ===== RENDER GRID =====
function renderGrid() {
    const grid = document.getElementById("catalogGrid");
    const emptyState = document.getElementById("emptyState");
    if (!grid) return;

    // Filter icons
    let filtered = allIcons;

    if (currentCategory !== "all") {
        filtered = filtered.filter(icon => icon.category === currentCategory);
    }

    if (searchQuery) {
        filtered = filtered.filter(icon =>
            icon.name.toLowerCase().includes(searchQuery) ||
            icon.category.toLowerCase().includes(searchQuery)
        );
    }

    // Show empty state if needed
    if (filtered.length === 0) {
        grid.innerHTML = "";
        if (emptyState) emptyState.style.display = "flex";
        return;
    }

    if (emptyState) emptyState.style.display = "none";

    // Render cards
    let html = "";
    filtered.forEach((icon, index) => {
        const delay = Math.min(index * 30, 600);
        html += `
            <div class="icon-card" onclick="openModal('${icon.name.replace(/'/g, "\\'")}')" style="animation-delay: ${delay}ms">
                <div class="icon-actions">
                    <button class="icon-action-btn" onclick="event.stopPropagation(); copyIconLink('${icon.name}')" title="Copiar link">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                    </button>
                </div>
                <div class="icon-image-container">
                    <img class="icon-image" 
                         src="${icon.displayPath}" 
                         alt="${icon.name}"
                         loading="lazy"
                         onerror="this.style.opacity='0.15'; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22 viewBox=%220 0 64 64%22><rect width=%2264%22 height=%2264%22 fill=%22%23333%22 rx=%228%22/><text x=%2232%22 y=%2236%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2212%22>?</text></svg>'">
                </div>
                <span class="icon-name">${icon.name}</span>
                <span class="icon-category-tag">${icon.category}</span>
            </div>
        `;
    });

    grid.innerHTML = html;
}

// ===== UPDATE STATS =====
function updateStats() {
    const totalEl = document.getElementById("totalIcons");
    const catEl = document.getElementById("totalCategories");

    if (totalEl) {
        animateNumber(totalEl, allIcons.length);
    }
    if (catEl) {
        animateNumber(catEl, categories.length);
    }
}

function animateNumber(el, target) {
    let current = 0;
    const step = Math.max(1, Math.floor(target / 30));
    const interval = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(interval);
        }
        el.textContent = current;
    }, 20);
}

// ===== COPY FUNCTIONS =====
function copyIconLink(name) {
    const url = getIconUrl(name);
    copyToClipboard(url, "Link do ícone copiado!");
}

function copyUrlStructure() {
    const url = `${CONFIG.BASE_URL}/${CONFIG.ICONS_FOLDER}/NOME_DO_ITEM.${CONFIG.ICON_EXTENSION}`;
    copyToClipboard(url, "Estrutura do link copiada!");
}

function copyModalLink() {
    const code = document.getElementById("modalLink");
    if (code) copyToClipboard(code.textContent, "Link copiado!");
}

function copyModalLua() {
    const code = document.getElementById("modalLuaCode");
    if (code) copyToClipboard(code.textContent, "Código Lua copiado!");
}

function copyToClipboard(text, message) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(message || "Copiado!");
    }).catch(() => {
        // Fallback
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        showToast(message || "Copiado!");
    });
}

// ===== TOAST =====
let toastTimeout = null;

function showToast(message) {
    const toast = document.getElementById("toast");
    const text = document.getElementById("toastText");
    if (!toast || !text) return;

    text.textContent = message;
    toast.classList.add("visible");

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove("visible");
    }, 2500);
}

// ===== MODAL =====
function openModal(name) {
    const icon = allIcons.find(i => i.name === name);
    if (!icon) return;

    const overlay = document.getElementById("modalOverlay");
    const img = document.getElementById("modalImage");
    const nameEl = document.getElementById("modalName");
    const catEl = document.getElementById("modalCategory");
    const linkEl = document.getElementById("modalLink");
    const luaEl = document.getElementById("modalLuaCode");

    if (img) {
        img.src = icon.displayPath;
        img.alt = icon.name;
    }
    if (nameEl) nameEl.textContent = icon.name;
    if (catEl) catEl.textContent = icon.category;
    if (linkEl) linkEl.textContent = icon.url;
    if (luaEl) {
        luaEl.textContent = `"${icon.url}"`;
    }

    if (overlay) overlay.classList.add("active");

    // Close on ESC
    document.addEventListener("keydown", handleModalEsc);
}

function closeModal() {
    const overlay = document.getElementById("modalOverlay");
    if (overlay) overlay.classList.remove("active");
    document.removeEventListener("keydown", handleModalEsc);
}

function handleModalEsc(e) {
    if (e.key === "Escape") closeModal();
}
