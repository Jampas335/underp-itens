import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";
import { html } from "https://esm.sh/htm@3.1.1/react?deps=react@18.3.1";
import {
    ReactFlow,
    Background,
    Controls,
    Handle,
    MarkerType,
    MiniMap,
    Position,
    ReactFlowProvider,
    addEdge,
    useEdgesState,
    useNodesState,
    useReactFlow,
} from "https://esm.sh/@xyflow/react@12.3.5?deps=react@18.3.1,react-dom@18.3.1";

const ITEM_EXPORT_URL = "https://jampas335.github.io/underp-itens/data/ready-items-export.json";
const STORAGE_KEY = "underrp-progression-map-v1";
const GITHUB_TOKEN_KEY = "underrp-github-token";
const GITHUB_TOKEN_MASK = "....................";
const GITHUB_API_VERSION = "2022-11-28";
const GITHUB_OWNER = "Jampas335";
const GITHUB_REPO = "underp-itens";
const GITHUB_GRAPH_PATH = "data/progression-map.json";
const GITHUB_GRAPH_URL = "https://jampas335.github.io/underp-itens/data/progression-map.json";
const GRAPH_SCHEMA = "underrp.progression-map.v1";

const NODE_KINDS = {
    item: { label: "Item", color: "#34d399", tone: "green" },
    activity: { label: "Atividade", color: "#f87171", tone: "red" },
    job: { label: "Emprego", color: "#60a5fa", tone: "blue" },
    faction: { label: "Facao", color: "#a78bfa", tone: "purple" },
    craft: { label: "Craft", color: "#fb923c", tone: "orange" },
    market: { label: "Mercado", color: "#facc15", tone: "yellow" },
    progression: { label: "Progressao", color: "#38bdf8", tone: "cyan" },
    sink: { label: "Consumo", color: "#fb7185", tone: "pink" },
};

const RELATIONS = {
    drop: { label: "DROPA", color: "#34d399", source: true },
    reward: { label: "RECOMPENSA", color: "#22c55e", source: true },
    requirement: { label: "REQUISITO", color: "#60a5fa", sink: true },
    craft: { label: "CRAFT", color: "#fb923c", sink: true, source: true },
    consume: { label: "CONSUMO", color: "#fb7185", sink: true },
    sell: { label: "VENDA", color: "#facc15", sink: true },
    unlock: { label: "DESBLOQUEIA", color: "#a78bfa", sink: true },
};

const EMPTY_CATALOG = {
    items: [],
    categories: [],
    count: 0,
};

const seededNodes = [
    makeNode("activity-boosting-c", "activity", "Boosting Classe C", "Roubos / carros", { x: 40, y: 120 }, {
        rate: 40,
        rewards: [
            createSlotItem({
                name: "laptop",
                label: "Laptop",
                rarity: "rare",
                weight: 1000,
                category: "Eletronica",
                imageUrl: "https://jampas335.github.io/underp-itens/icons/laptop.png",
            }, { id: "reward-laptop", chance: 15, amountPerHour: 20, value: 2500 }),
            createSlotItem({
                name: "chip",
                label: "Chip",
                rarity: "uncommon",
                weight: 120,
                category: "Eletronica",
                imageUrl: "https://jampas335.github.io/underp-itens/icons/chip.png",
            }, { id: "reward-chip", chance: 25, amountPerHour: 32, value: 900 }),
        ],
    }),
    makeNode("craft-crypto-notebook", "craft", "Notebook Criptografado", "Laptop + Chip", { x: 460, y: 120 }, {
        value: 6500,
        requirements: [
            createSlotItem({
                name: "laptop",
                label: "Laptop",
                rarity: "rare",
                weight: 1000,
                category: "Eletronica",
                imageUrl: "https://jampas335.github.io/underp-itens/icons/laptop.png",
            }, { id: "requirement-laptop", amountPerHour: 10, value: 2500 }),
            createSlotItem({
                name: "chip",
                label: "Chip",
                rarity: "uncommon",
                weight: 120,
                category: "Eletronica",
                imageUrl: "https://jampas335.github.io/underp-itens/icons/chip.png",
            }, { id: "requirement-chip", amountPerHour: 10, value: 900 }),
        ],
        rewards: [
            createSlotItem({
                name: "notebook_crypto",
                label: "Notebook Criptografado",
                rarity: "epic",
                weight: 1200,
                category: "Craft",
                imageUrl: "",
            }, { id: "reward-notebook-crypto", amountPerHour: 10, value: 6500 }),
        ],
    }),
    makeNode("activity-fleeca", "activity", "Banco Fleeca", "Progressao criminal", { x: 880, y: 120 }, {
        rate: 16,
        requirements: [
            createSlotItem({
                name: "notebook_crypto",
                label: "Notebook Criptografado",
                rarity: "epic",
                weight: 1200,
                category: "Craft",
                imageUrl: "",
            }, { id: "requirement-notebook-crypto", amountPerHour: 8, value: 6500 }),
        ],
        rewards: [
            createSlotItem({
                name: "gold_bar",
                label: "Ouro",
                rarity: "legendary",
                weight: 400,
                category: "Mineracao",
                imageUrl: "https://jampas335.github.io/underp-itens/ready-items/icons/gold_bar.png",
            }, { id: "reward-gold", amountPerHour: 16, value: 4200 }),
        ],
    }),
    makeNode("market-black", "market", "Mercado Negro", "Venda ilegal", { x: 1300, y: 120 }, {
        rate: 22,
        requirements: [
            createSlotItem({
                name: "gold_bar",
                label: "Ouro",
                rarity: "legendary",
                weight: 400,
                category: "Mineracao",
                imageUrl: "https://jampas335.github.io/underp-itens/ready-items/icons/gold_bar.png",
            }, { id: "requirement-gold-market", amountPerHour: 18, value: 4200 }),
        ],
    }),
];

const seededEdges = [
    makeEdge("edge-boosting-craft", "activity-boosting-c", "craft-crypto-notebook", "unlock", { amountPerHour: 10 }),
    makeEdge("edge-craft-fleeca", "craft-crypto-notebook", "activity-fleeca", "requirement", { amountPerHour: 8 }),
    makeEdge("edge-fleeca-market", "activity-fleeca", "market-black", "sell", { amountPerHour: 18 }),
];

function makeNode(id, kind, title, subtitle, position, extra = {}) {
    return {
        id,
        type: "economicNode",
        position,
        data: {
            kind,
            title,
            subtitle,
            value: extra.value || 0,
            rate: extra.rate || 0,
            note: extra.note || "",
            item: extra.item || null,
            requirements: Array.isArray(extra.requirements) ? extra.requirements : [],
            rewards: Array.isArray(extra.rewards) ? extra.rewards : [],
        },
    };
}

function makeEdge(id, source, target, relation, data = {}) {
    const meta = RELATIONS[relation] || RELATIONS.requirement;
    return {
        id,
        source,
        target,
        type: "smoothstep",
        animated: relation === "craft" || relation === "unlock",
        label: meta.label,
        data: {
            relation,
            chance: data.chance || 0,
            amountPerHour: data.amountPerHour || 0,
            note: data.note || "",
        },
        style: { stroke: meta.color, strokeWidth: 2.6 },
        markerEnd: { type: MarkerType.ArrowClosed, color: meta.color },
        labelStyle: { fill: "#f8fafc", fontWeight: 800, fontSize: 10 },
        labelBgStyle: { fill: "#111827", fillOpacity: 0.86 },
        labelBgPadding: [8, 5],
        labelBgBorderRadius: 8,
    };
}

function readSavedGraph() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) return null;
        return parsed;
    } catch (err) {
        console.warn("Falha ao ler mapa salvo:", err);
        return null;
    }
}

function getGitHubToken() {
    return localStorage.getItem(GITHUB_TOKEN_KEY) || "";
}

function setGitHubToken(token) {
    if (token) localStorage.setItem(GITHUB_TOKEN_KEY, token.trim());
    else localStorage.removeItem(GITHUB_TOKEN_KEY);
}

function isMaskedGitHubTokenValue(value) {
    return value === GITHUB_TOKEN_MASK;
}

function getGitHubHeaders(tokenOverride = null, includeJson = false) {
    const headers = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
    };
    const token = tokenOverride ?? getGitHubToken();
    if (token) headers.Authorization = `Bearer ${token}`;
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
        message += ` | Revise o PAT: Resource owner = ${GITHUB_OWNER}, repositorio ${GITHUB_REPO}, Contents: Read and write.`;
    }
    return message;
}

async function validateGitHubToken(token) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
    const resp = await fetch(url, { headers: getGitHubHeaders(token), cache: "no-store" });
    if (!resp.ok) throw new Error(await parseGitHubApiError(resp));
    const data = await resp.json();
    return {
        fullName: data.full_name || `${GITHUB_OWNER}/${GITHUB_REPO}`,
        hasPushPermission: data.permissions ? data.permissions.push !== false : null,
    };
}

async function githubGetFile(path, options = {}) {
    const bustCache = options.bustCache === true;
    const cacheParam = bustCache ? `${path.includes("?") ? "&" : "?"}t=${Date.now()}` : "";
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}${cacheParam}`;
    const token = getGitHubToken();
    let resp = await fetch(url, { headers: getGitHubHeaders(token), cache: "no-store" });
    if ((resp.status === 401 || resp.status === 403) && token) {
        resp = await fetch(url, { headers: getGitHubHeaders(""), cache: "no-store" });
    }
    if (resp.status === 404) return null;
    if (!resp.ok) throw new Error(await parseGitHubApiError(resp));
    return resp.json();
}

async function githubPutFile(path, base64Content, sha, message) {
    const token = getGitHubToken();
    if (!token) throw new Error("Token do GitHub nao configurado.");
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
    const body = { message, content: base64Content };
    if (sha) body.sha = sha;
    const resp = await fetch(url, {
        method: "PUT",
        headers: getGitHubHeaders(token, true),
        body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(await parseGitHubApiError(resp));
    return resp.json();
}

function base64Decode(str) {
    const binary = atob(String(str || "").replace(/\s/g, ""));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

function base64Encode(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
}

function buildGraphDocument(nodes, edges) {
    return {
        schema: GRAPH_SCHEMA,
        updatedAt: new Date().toISOString(),
        source: {
            repository: `${GITHUB_OWNER}/${GITHUB_REPO}`,
            path: GITHUB_GRAPH_PATH,
            publicUrl: GITHUB_GRAPH_URL,
            itemCatalogUrl: ITEM_EXPORT_URL,
        },
        nodes: nodes.map(stripRuntimeNodeState),
        edges: edges.map(stripRuntimeEdgeState),
    };
}

function stripRuntimeNodeState(node) {
    const data = { ...(node.data || {}) };
    delete data.focusState;
    delete data.canEdit;
    delete data.onSlotDrop;
    delete data.onSlotRemove;
    return {
        ...node,
        data,
    };
}

function stripRuntimeEdgeState(edge) {
    const relation = edge.data?.relation || "requirement";
    return normalizeEdge({
        ...edge,
        data: { ...(edge.data || {}), relation },
    });
}

function parseGraphDocument(document) {
    if (!document || !Array.isArray(document.nodes) || !Array.isArray(document.edges)) {
        throw new Error("Arquivo de mapa invalido.");
    }
    return {
        nodes: document.nodes.map(stripRuntimeNodeState),
        edges: document.edges.map(normalizeEdge),
        updatedAt: document.updatedAt || "",
    };
}

function createSlotItem(item, extra = {}) {
    const source = item?.item || item || {};
    const name = source.name || source.id || "item";
    return {
        id: extra.id || `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        item: {
            name,
            label: source.label || source.name || name,
            rarity: source.rarity || source.inventory?.rarity || "common",
            weight: Number(source.weight || source.inventory?.weight || 0),
            category: source.category || "",
            imageUrl: source.imageUrl || "",
            imageCandidates: source.imageCandidates || [],
            inventory: source.inventory || null,
            lua: source.lua || "",
        },
        chance: Number(extra.chance || source.chance || 0),
        amountPerHour: Number(extra.amountPerHour || source.amountPerHour || 0),
        value: Number(extra.value || source.value || 0),
        note: extra.note || source.note || "",
    };
}

function getSlotItems(data, key) {
    return Array.isArray(data?.[key]) ? data[key] : [];
}

function getSlotEntryItem(entry) {
    return entry?.item || entry || {};
}

function createBlankNode(kind, position) {
    const meta = NODE_KINDS[kind] || NODE_KINDS.activity;
    const id = `${kind}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const defaultTitle = {
        activity: "Nova Atividade",
        job: "Novo Emprego",
        faction: "Nova Facao",
        craft: "Novo Craft",
        market: "Novo Mercado",
        progression: "Nova Progressao",
        sink: "Novo Consumo",
    }[kind] || meta.label;

    return makeNode(id, kind, defaultTitle, meta.label, position, {
        rate: kind === "item" ? 0 : 10,
    });
}

function relationEdge(params, relationType) {
    return makeEdge(
        `edge-${params.source}-${params.target}-${Date.now()}`,
        params.source,
        params.target,
        relationType,
        { amountPerHour: relationType === "drop" || relationType === "reward" ? 10 : 5 }
    );
}

function normalizeEdge(edge) {
    const relation = edge.data?.relation || "requirement";
    const meta = RELATIONS[relation] || RELATIONS.requirement;
    return {
        ...edge,
        label: meta.label,
        animated: relation === "craft" || relation === "unlock",
        style: { ...(edge.style || {}), stroke: meta.color, strokeWidth: 2.6 },
        markerEnd: { type: MarkerType.ArrowClosed, color: meta.color },
        labelStyle: { fill: "#f8fafc", fontWeight: 800, fontSize: 10 },
        labelBgStyle: { fill: "#111827", fillOpacity: 0.86 },
        labelBgPadding: [8, 5],
        labelBgBorderRadius: 8,
    };
}

function EconomicNode({ id, data, selected }) {
    const meta = NODE_KINDS[data.kind] || NODE_KINDS.activity;
    const item = data.item || {};
    const imageUrl = item.imageUrl || "";
    const focus = data.focusState || "normal";
    const requirements = getSlotItems(data, "requirements");
    const rewards = getSlotItems(data, "rewards");
    const isItemNode = data.kind === "item";
    const className = [
        "econ-node",
        `node-${meta.tone}`,
        selected ? "selected" : "",
        focus === "dim" ? "dimmed" : "",
        focus === "focus" ? "focused" : "",
    ].filter(Boolean).join(" ");

    return html`
        <div className=${className} style=${{ "--node-color": meta.color }}>
            <${Handle} className="node-handle" type="target" position=${Position.Top} />
            <${Handle} className="node-handle" type="target" position=${Position.Left} />
            <div className="node-head">
                <div className="node-icon">
                    ${imageUrl
                        ? html`<img src=${imageUrl} alt=${item.label || data.title} loading="lazy" />`
                        : html`<span>${meta.label.slice(0, 2).toUpperCase()}</span>`}
                </div>
                <div className="node-title-wrap">
                    <span className="node-kind">${meta.label}</span>
                    <strong>${data.title}</strong>
                    <code>${data.subtitle || item.name || ""}</code>
                </div>
            </div>
            <div className="node-metrics">
                ${data.kind === "item" && html`<span>${item.rarity || "common"}</span>`}
                ${data.kind === "item" && html`<span>${Number(item.weight || 0)}g</span>`}
                ${data.value ? html`<span>$${formatNumber(data.value)}</span>` : null}
                ${data.rate ? html`<span>${formatNumber(data.rate)}/h</span>` : null}
            </div>
            ${!isItemNode ? html`
                <div className="node-slot-grid">
                    <${SlotLane}
                        nodeId=${id}
                        slotKey="requirements"
                        title="Requisitos"
                        items=${requirements}
                        canEdit=${data.canEdit}
                        onDropItem=${data.onSlotDrop}
                        onRemoveItem=${data.onSlotRemove}
                    />
                    <${SlotLane}
                        nodeId=${id}
                        slotKey="rewards"
                        title="Recompensas"
                        items=${rewards}
                        canEdit=${data.canEdit}
                        onDropItem=${data.onSlotDrop}
                        onRemoveItem=${data.onSlotRemove}
                    />
                </div>
            ` : null}
            <${Handle} className="node-handle" type="source" position=${Position.Right} />
            <${Handle} className="node-handle" type="source" position=${Position.Bottom} />
        </div>
    `;
}

function SlotLane({ nodeId, slotKey, title, items, canEdit, onDropItem, onRemoveItem }) {
    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = canEdit ? "copy" : "none";
    };
    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!canEdit) return;
        const raw = event.dataTransfer.getData("application/x-underrp-item");
        if (!raw) return;
        try {
            onDropItem?.(nodeId, slotKey, JSON.parse(raw));
        } catch (err) {
            console.error("Item invalido no drop:", err);
        }
    };

    return html`
        <section
            className=${`slot-lane ${items.length ? "filled" : "empty"}`}
            onDragOver=${handleDragOver}
            onDrop=${handleDrop}
        >
            <header>
                <span>${title}</span>
                <b>${items.length}</b>
            </header>
            <div className="slot-items">
                ${items.length
                    ? items.map((entry) => {
                        const slotItem = getSlotEntryItem(entry);
                        return html`
                            <article className="slot-item" key=${entry.id || slotItem.name}>
                                <img src=${slotItem.imageUrl || ""} alt=${slotItem.label || slotItem.name} loading="lazy" />
                                <div>
                                    <strong>${slotItem.label || slotItem.name}</strong>
                                    <span>${entry.chance ? `${entry.chance}%` : ""}${entry.amountPerHour ? ` ${formatNumber(entry.amountPerHour)}/h` : ""}</span>
                                </div>
                                ${canEdit ? html`
                                    <button
                                        type="button"
                                        title="Remover"
                                        onMouseDown=${(event) => event.stopPropagation()}
                                        onClick=${(event) => {
                                            event.stopPropagation();
                                            onRemoveItem?.(nodeId, slotKey, entry.id || slotItem.name);
                                        }}
                                    >x</button>
                                ` : null}
                            </article>
                        `;
                    })
                    : html`<p>${canEdit ? "Arraste um item aqui" : "Sem itens"}</p>`
                }
            </div>
        </section>
    `;
}

const nodeTypes = { economicNode: EconomicNode };

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error) {
        console.error(error);
    }

    render() {
        if (this.state.error) {
            return html`
                <div className="boot-status error">
                    Erro no mapa: ${this.state.error.message || String(this.state.error)}
                </div>
            `;
        }
        return this.props.children;
    }
}

function App() {
    useEffect(() => {
        document.getElementById("boot-status")?.remove();
    }, []);

    return html`
        <${ReactFlowProvider}>
            <${ProgressionMap} />
        <//>
    `;
}

function ProgressionMap() {
    const saved = useMemo(readSavedGraph, []);
    const initialNodes = saved?.nodes || seededNodes;
    const initialEdges = (saved?.edges || seededEdges).map(normalizeEdge);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [catalog, setCatalog] = useState(EMPTY_CATALOG);
    const [catalogState, setCatalogState] = useState("loading");
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [rarity, setRarity] = useState("all");
    const [relationType, setRelationType] = useState("requirement");
    const [selected, setSelected] = useState(null);
    const [focusId, setFocusId] = useState(null);
    const [panelTab, setPanelTab] = useState("inspector");
    const [savedAt, setSavedAt] = useState(saved?.savedAt || "");
    const [cloudStatus, setCloudStatus] = useState("Carregando mapa do GitHub...");
    const [cloudSha, setCloudSha] = useState(null);
    const [cloudLoadedAt, setCloudLoadedAt] = useState("");
    const [isCloudSaving, setIsCloudSaving] = useState(false);
    const [isTokenOpen, setIsTokenOpen] = useState(false);
    const [hasGitHubToken, setHasGitHubToken] = useState(Boolean(getGitHubToken()));
    const canEdit = hasGitHubToken;
    const fileInputRef = useRef(null);
    const { screenToFlowPosition, fitView } = useReactFlow();

    useEffect(() => {
        let alive = true;
        fetch(ITEM_EXPORT_URL, { cache: "no-store" })
            .then((response) => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then((data) => {
                if (!alive) return;
                setCatalog({
                    items: Array.isArray(data.items) ? data.items : [],
                    categories: Array.isArray(data.categories) ? data.categories : [],
                    count: Number(data.count || data.items?.length || 0),
                });
                setCatalogState("ready");
            })
            .catch((err) => {
                console.error("Falha ao carregar itens:", err);
                if (alive) setCatalogState("error");
            });
        return () => { alive = false; };
    }, []);

    useEffect(() => {
        const payload = { nodes, edges, savedAt: new Date().toISOString() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setSavedAt(payload.savedAt);
    }, [nodes, edges]);

    const loadCloudGraph = useCallback(async () => {
        setCloudStatus("Carregando mapa do GitHub...");
        try {
            const file = await githubGetFile(GITHUB_GRAPH_PATH, { bustCache: true });
            if (!file) {
                setCloudSha(null);
                setCloudStatus("Mapa GitHub ainda nao existe. Salve para criar.");
                return;
            }
            const parsed = parseGraphDocument(JSON.parse(base64Decode(file.content)));
            setNodes(parsed.nodes);
            setEdges(parsed.edges);
            setCloudSha(file.sha);
            setCloudLoadedAt(parsed.updatedAt || new Date().toISOString());
            setFocusId(null);
            setSelected(null);
            setCloudStatus("Mapa sincronizado do GitHub.");
        } catch (err) {
            setCloudStatus(`Falha ao carregar GitHub: ${err.message}`);
        }
    }, [setNodes, setEdges]);

    useEffect(() => {
        loadCloudGraph();
    }, [loadCloudGraph]);

    const saveCloudGraph = useCallback(async () => {
        if (!getGitHubToken()) {
            setIsTokenOpen(true);
            setCloudStatus("Configure o token para salvar no GitHub.");
            return;
        }

        setIsCloudSaving(true);
        setCloudStatus("Salvando mapa no GitHub...");
        try {
            const latestFile = await githubGetFile(GITHUB_GRAPH_PATH, { bustCache: true });
            const document = buildGraphDocument(nodes, edges);
            const result = await githubPutFile(
                GITHUB_GRAPH_PATH,
                base64Encode(JSON.stringify(document, null, 2)),
                latestFile ? latestFile.sha : cloudSha,
                "feat: update progression map"
            );
            setCloudSha(result.content?.sha || null);
            setCloudLoadedAt(document.updatedAt);
            setCloudStatus("Mapa salvo no GitHub.");
        } catch (err) {
            setCloudStatus(`Falha ao salvar GitHub: ${err.message}`);
        } finally {
            setIsCloudSaving(false);
        }
    }, [nodes, edges, cloudSha]);

    const visibleItems = useMemo(() => {
        const term = search.toLowerCase().trim();
        return catalog.items
            .filter((item) => {
                const categoryOk = category === "all" || item.category === category;
                const rarityOk = rarity === "all" || item.rarity === rarity;
                const text = [item.name, item.label, item.category, item.rarity]
                    .filter(Boolean).join(" ").toLowerCase();
                return categoryOk && rarityOk && (!term || text.includes(term));
            })
            .slice(0, 140);
    }, [catalog.items, category, rarity, search]);

    const addItemToNodeSlot = useCallback((nodeId, slotKey, item) => {
        if (!canEdit) {
            setCloudStatus("Conecte o GitHub para adicionar itens aos slots.");
            return;
        }
        const normalizedSlot = slotKey === "requirements" ? "requirements" : "rewards";
        let changed = false;
        setNodes((current) => current.map((node) => {
            if (node.id !== nodeId || node.data.kind === "item") return node;
            const existing = getSlotItems(node.data, normalizedSlot);
            const nextEntry = createSlotItem(item);
            const itemName = nextEntry.item.name;
            if (existing.some((entry) => getSlotEntryItem(entry).name === itemName)) return node;
            changed = true;
            return {
                ...node,
                data: {
                    ...node.data,
                    [normalizedSlot]: existing.concat(nextEntry),
                },
            };
        }));
        setCloudStatus(changed
            ? `Item adicionado em ${normalizedSlot === "requirements" ? "Requisitos" : "Recompensas"}.`
            : "Esse item ja existe nesse slot."
        );
    }, [canEdit, setNodes]);

    const removeItemFromNodeSlot = useCallback((nodeId, slotKey, itemId) => {
        if (!canEdit) {
            setCloudStatus("Conecte o GitHub para remover itens dos slots.");
            return;
        }
        const normalizedSlot = slotKey === "requirements" ? "requirements" : "rewards";
        setNodes((current) => current.map((node) => {
            if (node.id !== nodeId) return node;
            return {
                ...node,
                data: {
                    ...node.data,
                    [normalizedSlot]: getSlotItems(node.data, normalizedSlot)
                        .filter((entry) => (entry.id || getSlotEntryItem(entry).name) !== itemId),
                },
            };
        }));
        setCloudStatus("Item removido do slot.");
    }, [canEdit, setNodes]);

    const focusSet = useMemo(() => buildFocusSet(focusId, nodes, edges), [focusId, nodes, edges]);
    const renderedNodes = useMemo(() => nodes.map((node) => ({
        ...node,
        data: {
            ...node.data,
            focusState: !focusId ? "normal" : focusSet.nodes.has(node.id) ? "focus" : "dim",
            canEdit,
            onSlotDrop: addItemToNodeSlot,
            onSlotRemove: removeItemFromNodeSlot,
        },
    })), [nodes, focusId, focusSet, canEdit, addItemToNodeSlot, removeItemFromNodeSlot]);

    const renderedEdges = useMemo(() => edges.map((edge) => {
        if (!focusId) return edge;
        const isFocused = focusSet.edges.has(edge.id);
        return {
            ...edge,
            style: {
                ...(edge.style || {}),
                opacity: isFocused ? 1 : 0.12,
                strokeWidth: isFocused ? 3.4 : 1.4,
            },
        };
    }), [edges, focusId, focusSet]);

    const selectedNode = selected?.type === "node"
        ? nodes.find((node) => node.id === selected.id) || null
        : null;
    const selectedEdge = selected?.type === "edge"
        ? edges.find((edge) => edge.id === selected.id) || null
        : null;

    const metrics = useMemo(() => buildEconomyMetrics(nodes, edges), [nodes, edges]);

    const guardedNodesChange = useCallback((changes) => {
        const readOnlySafe = changes.every((change) => change.type === "select" || change.type === "dimensions");
        if (canEdit || readOnlySafe) onNodesChange(changes);
    }, [canEdit, onNodesChange]);

    const guardedEdgesChange = useCallback((changes) => {
        const readOnlySafe = changes.every((change) => change.type === "select");
        if (canEdit || readOnlySafe) onEdgesChange(changes);
    }, [canEdit, onEdgesChange]);

    const onConnect = useCallback((params) => {
        if (!canEdit) {
            setCloudStatus("Conecte o GitHub para criar conexoes.");
            return;
        }
        const next = relationEdge(params, relationType);
        setEdges((current) => addEdge(next, current));
    }, [canEdit, relationType, setEdges]);

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = canEdit ? "copy" : "none";
    }, [canEdit]);

    const onDrop = useCallback((event) => {
        event.preventDefault();
        if (!canEdit) {
            setCloudStatus("Conecte o GitHub para adicionar itens aos slots.");
            return;
        }
        const raw = event.dataTransfer.getData("application/x-underrp-item");
        if (!raw) return;
        setCloudStatus("Arraste o item para Requisitos ou Recompensas dentro de um bloco.");
    }, [canEdit]);

    const addNode = useCallback((kind) => {
        if (!canEdit) {
            setCloudStatus("Conecte o GitHub para criar nodes.");
            return;
        }
        const position = screenToFlowPosition({
            x: Math.round(window.innerWidth * 0.52),
            y: Math.round(window.innerHeight * 0.42),
        });
        setNodes((current) => current.concat(createBlankNode(kind, position)));
    }, [canEdit, screenToFlowPosition, setNodes]);

    const addItemToCanvas = useCallback((item) => {
        if (!canEdit) {
            setCloudStatus("Conecte o GitHub para adicionar itens aos slots.");
            return;
        }
        const target = selected?.type === "node"
            ? nodes.find((node) => node.id === selected.id && node.data.kind !== "item")
            : null;
        if (!target) {
            setCloudStatus("Selecione um bloco e use +, ou arraste o item para um slot.");
            return;
        }
        addItemToNodeSlot(target.id, "rewards", item);
    }, [canEdit, selected, nodes, addItemToNodeSlot]);

    const focusExistingItem = useCallback((item) => {
        const found = nodes.find((node) => {
            const requirements = getSlotItems(node.data, "requirements");
            const rewards = getSlotItems(node.data, "rewards");
            return requirements.concat(rewards).some((entry) => getSlotEntryItem(entry).name === item.name);
        });
        if (found) {
            setFocusId(found.id);
            setSelected({ type: "node", id: found.id });
            setPanelTab("inspector");
            return;
        }
        setCloudStatus("Esse item ainda nao esta em nenhum bloco.");
    }, [nodes]);

    const updateNodeData = useCallback((id, patch) => {
        if (!canEdit) {
            setCloudStatus("Conecte o GitHub para editar nodes.");
            return;
        }
        setNodes((current) => current.map((node) => {
            if (node.id !== id) return node;
            return { ...node, data: { ...node.data, ...patch } };
        }));
    }, [canEdit, setNodes]);

    const updateEdgeData = useCallback((id, patch) => {
        if (!canEdit) {
            setCloudStatus("Conecte o GitHub para editar conexoes.");
            return;
        }
        setEdges((current) => current.map((edge) => {
            if (edge.id !== id) return edge;
            const nextData = { ...(edge.data || {}), ...patch };
            const relation = nextData.relation || "requirement";
            return normalizeEdge({ ...edge, data: nextData });
        }));
    }, [canEdit, setEdges]);

    const deleteSelection = useCallback(() => {
        if (!canEdit) {
            setCloudStatus("Conecte o GitHub para remover elementos.");
            return;
        }
        if (!selected) return;
        if (selected.type === "node") {
            setNodes((current) => current.filter((node) => node.id !== selected.id));
            setEdges((current) => current.filter((edge) => edge.source !== selected.id && edge.target !== selected.id));
        } else {
            setEdges((current) => current.filter((edge) => edge.id !== selected.id));
        }
        if (focusId === selected.id) setFocusId(null);
        setSelected(null);
    }, [canEdit, selected, focusId, setNodes, setEdges]);

    const exportMap = useCallback(() => {
        const blob = new Blob([JSON.stringify({ nodes, edges, exportedAt: new Date().toISOString() }, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `underrp-progression-map-${new Date().toISOString().slice(0, 10)}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
    }, [nodes, edges]);

    const importMap = useCallback((event) => {
        if (!canEdit) {
            setCloudStatus("Conecte o GitHub para importar mapas.");
            event.target.value = "";
            return;
        }
        const file = event.target.files?.[0];
        if (!file) return;
        file.text().then((text) => {
            const parsed = JSON.parse(text);
            if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
                throw new Error("Arquivo invalido");
            }
            setNodes(parsed.nodes);
            setEdges(parsed.edges.map(normalizeEdge));
            setFocusId(null);
            setSelected(null);
        }).catch((err) => alert(`Falha ao importar: ${err.message}`));
        event.target.value = "";
    }, [canEdit, setNodes, setEdges]);

    const resetMap = useCallback(() => {
        if (!canEdit) {
            setCloudStatus("Conecte o GitHub para resetar o mapa.");
            return;
        }
        if (!window.confirm("Resetar o mapa local?")) return;
        setNodes(seededNodes);
        setEdges(seededEdges);
        setSelected(null);
        setFocusId(null);
    }, [canEdit, setNodes, setEdges]);

    return html`
        <div className="app-shell">
            <aside className="item-sidebar">
                <div className="brand">
                    <img src="./under-icon.png" alt="" />
                    <div>
                        <span>underRP</span>
                        <strong>Progression Map</strong>
                    </div>
                </div>
                <div className="sidebar-stats">
                    <div><span>Itens</span><strong>${catalog.count || catalog.items.length}</strong></div>
                    <div><span>Nodes</span><strong>${nodes.length}</strong></div>
                    <div><span>Links</span><strong>${edges.length}</strong></div>
                </div>
                <div className="field-block">
                    <label>Buscar item</label>
                    <input value=${search} onInput=${(e) => setSearch(e.currentTarget.value)} placeholder="laptop, ouro, gps..." />
                </div>
                <div className="field-grid">
                    <label>
                        <span>Categoria</span>
                        <select value=${category} onChange=${(e) => setCategory(e.currentTarget.value)}>
                            <option value="all">Todas</option>
                            ${catalog.categories.map((cat) => html`<option key=${cat.name} value=${cat.name}>${cat.name}</option>`)}
                        </select>
                    </label>
                    <label>
                        <span>Raridade</span>
                        <select value=${rarity} onChange=${(e) => setRarity(e.currentTarget.value)}>
                            <option value="all">Todas</option>
                            ${["common", "uncommon", "rare", "epic", "legendary"].map((r) => html`<option key=${r} value=${r}>${r}</option>`)}
                        </select>
                    </label>
                </div>
                <div className=${`catalog-state ${catalogState}`}>
                    ${catalogState === "loading" ? "Carregando itens..." : catalogState === "error" ? "Falha ao carregar itens" : `${visibleItems.length} visiveis`}
                </div>
                <div className=${`cloud-state ${hasGitHubToken ? "token-on" : "token-off"}`}>
                    <span>${hasGitHubToken ? "GitHub conectado" : "GitHub somente leitura"}</span>
                    <strong>${cloudStatus}</strong>
                </div>
                <div className="item-list">
                    ${visibleItems.map((item) => html`
                        <${ItemRow}
                            key=${item.name}
                            item=${item}
                            canEdit=${canEdit}
                            onAdd=${addItemToCanvas}
                            onFocus=${focusExistingItem}
                        />
                    `)}
                </div>
            </aside>

            <main className="map-stage">
                <header className="topbar">
                    <div className="topbar-left">
                        <div>
                            <span className="eyebrow">Grafo economico</span>
                            <h1>Mapa economico</h1>
                        </div>
                        <select className="relation-select" disabled=${!canEdit} value=${relationType} onChange=${(e) => setRelationType(e.currentTarget.value)}>
                            ${Object.entries(RELATIONS).map(([key, meta]) => html`<option key=${key} value=${key}>${meta.label}</option>`)}
                        </select>
                    </div>
                    <div className="topbar-actions">
                        <button disabled=${!canEdit} onClick=${() => addNode("activity")}>Atividade</button>
                        <button disabled=${!canEdit} onClick=${() => addNode("job")}>Emprego</button>
                        <button disabled=${!canEdit} onClick=${() => addNode("faction")}>Facao</button>
                        <button disabled=${!canEdit} onClick=${() => addNode("craft")}>Craft</button>
                        <button disabled=${!canEdit} onClick=${() => addNode("market")}>Mercado</button>
                        <button disabled=${!canEdit} onClick=${() => addNode("progression")}>Progressao</button>
                        <button className=${hasGitHubToken ? "github-ready" : ""} onClick=${() => setIsTokenOpen(true)}>
                            ${hasGitHubToken ? "GitHub OK" : "Conectar GitHub"}
                        </button>
                    </div>
                </header>

                <section className="flow-wrap">
                    <${ReactFlow}
                        nodes=${renderedNodes}
                        edges=${renderedEdges}
                        nodeTypes=${nodeTypes}
                        onNodesChange=${guardedNodesChange}
                        onEdgesChange=${guardedEdgesChange}
                        onConnect=${onConnect}
                        onDragOver=${onDragOver}
                        onDrop=${onDrop}
                        onNodeClick=${(_, node) => { setSelected({ type: "node", id: node.id }); setPanelTab("inspector"); }}
                        onEdgeClick=${(_, edge) => { setSelected({ type: "edge", id: edge.id }); setPanelTab("inspector"); }}
                        onPaneClick=${() => setSelected(null)}
                        fitView=${true}
                        minZoom=${0.16}
                        maxZoom=${1.8}
                        panOnDrag=${[0]}
                        panOnScroll=${false}
                        zoomOnScroll=${true}
                        nodesDraggable=${canEdit}
                        nodesConnectable=${canEdit}
                        selectionOnDrag=${false}
                        deleteKeyCode=${canEdit ? "Backspace" : null}
                    >
                        <${Background} gap=${24} size=${1.2} color="#334155" />
                        <${Controls} position="bottom-left" />
                        <${MiniMap}
                            position="bottom-right"
                            nodeStrokeWidth=${3}
                            nodeColor=${(node) => NODE_KINDS[node.data?.kind]?.color || "#94a3b8"}
                            maskColor="rgba(5, 8, 16, 0.72)"
                        />
                    <//>
                </section>

                <footer className="statusbar">
                    <span>${savedAt ? `Local ${formatTime(savedAt)}` : "Mapa local"} ${cloudLoadedAt ? ` / GitHub ${formatTime(cloudLoadedAt)}` : ""}</span>
                    <button onClick=${loadCloudGraph}>Carregar GitHub</button>
                    <button className="primary-action" disabled=${isCloudSaving} onClick=${saveCloudGraph}>
                        ${isCloudSaving ? "Salvando..." : "Salvar GitHub"}
                    </button>
                    <button onClick=${() => fitView({ padding: 0.18, duration: 450 })}>Centralizar</button>
                    <button onClick=${() => setFocusId(null)}>Limpar foco</button>
                    <button onClick=${exportMap}>Exportar</button>
                    <button disabled=${!canEdit} onClick=${() => fileInputRef.current?.click()}>Importar</button>
                    <button className="danger" disabled=${!canEdit} onClick=${resetMap}>Reset</button>
                    <input ref=${fileInputRef} className="hidden-file" type="file" accept="application/json" onChange=${importMap} />
                </footer>
            </main>

            <aside className="right-panel">
                <div className="panel-tabs">
                    <button className=${panelTab === "inspector" ? "active" : ""} onClick=${() => setPanelTab("inspector")}>Inspector</button>
                    <button className=${panelTab === "dashboard" ? "active" : ""} onClick=${() => setPanelTab("dashboard")}>Economia</button>
                </div>
                ${panelTab === "inspector"
                    ? html`<${Inspector}
                        node=${selectedNode}
                        edge=${selectedEdge}
                        onNodeChange=${updateNodeData}
                        onEdgeChange=${updateEdgeData}
                        onDelete=${deleteSelection}
                        onFocus=${setFocusId}
                        canEdit=${canEdit}
                    />`
                    : html`<${EconomyDashboard} metrics=${metrics} onFocus=${setFocusId} />`
                }
            </aside>
            ${isTokenOpen ? html`
                <${GitHubTokenModal}
                    hasToken=${hasGitHubToken}
                    onClose=${() => setIsTokenOpen(false)}
                    onSaved=${() => {
                        setHasGitHubToken(Boolean(getGitHubToken()));
                        setIsTokenOpen(false);
                        setCloudStatus("Token salvo. Edicoes podem ser publicadas no GitHub.");
                    }}
                    onCleared=${() => {
                        setHasGitHubToken(false);
                        setCloudStatus("Token removido. Mapa em modo somente leitura no GitHub.");
                    }}
                />
            ` : null}
        </div>
    `;
}

function ItemRow({ item, canEdit, onAdd, onFocus }) {
    const dragStart = (event) => {
        if (!canEdit) {
            event.preventDefault();
            return;
        }
        event.dataTransfer.setData("application/x-underrp-item", JSON.stringify(item));
        event.dataTransfer.effectAllowed = "copy";
    };
    return html`
        <article className=${`item-row ${canEdit ? "" : "read-only"}`} draggable=${canEdit} onDragStart=${dragStart}>
            <img src=${item.imageUrl || ""} alt=${item.label || item.name} loading="lazy" />
            <div className="item-row-copy">
                <strong>${item.label || item.name}</strong>
                <code>${item.name}</code>
                <span>${item.category || "Sem categoria"} / ${item.rarity || "common"}</span>
            </div>
            <div className="item-row-actions">
                <button disabled=${!canEdit} title="Adicionar" onClick=${() => onAdd(item)}>+</button>
                <button title="Focar" onClick=${() => onFocus(item)}>F</button>
            </div>
        </article>
    `;
}

function GitHubTokenModal({ hasToken, onClose, onSaved, onCleared }) {
    const [value, setValue] = useState(hasToken ? GITHUB_TOKEN_MASK : "");
    const [visible, setVisible] = useState(false);
    const [status, setStatus] = useState(hasToken
        ? "Token ja salvo nesta maquina. Cole outro token somente se quiser substituir."
        : "Cole um token Fine-grained com acesso ao repositorio e Contents: Read and write."
    );
    const [statusType, setStatusType] = useState(hasToken ? "warn" : "ok");
    const [busy, setBusy] = useState(false);

    const saveToken = async () => {
        const token = value.trim();
        if (!token) {
            setStatus("Digite um token antes de salvar.");
            setStatusType("error");
            return;
        }
        if (isMaskedGitHubTokenValue(token) && getGitHubToken()) {
            setStatus("Token ja esta salvo nesta maquina.");
            setStatusType("warn");
            return;
        }

        setBusy(true);
        setStatus("Validando token no GitHub...");
        setStatusType("warn");
        try {
            const result = await validateGitHubToken(token);
            if (result.hasPushPermission === false) {
                setStatus(`Token valido para ${result.fullName}, mas sem permissao de escrita. Verifique Contents: Read and write.`);
                setStatusType("error");
                return;
            }
            setGitHubToken(token);
            setStatus(`Token valido para ${result.fullName}.`);
            setStatusType("ok");
            onSaved();
        } catch (err) {
            setStatus(`Falha ao validar token: ${err.message}`);
            setStatusType("error");
        } finally {
            setBusy(false);
        }
    };

    const clearToken = () => {
        setGitHubToken("");
        setValue("");
        setStatus("Token removido.");
        setStatusType("warn");
        onCleared();
    };

    return html`
        <div className="modal-layer" onClick=${(event) => { if (event.target === event.currentTarget) onClose(); }}>
            <section className="token-modal">
                <header>
                    <div>
                        <span className="eyebrow">GitHub API</span>
                        <h2>Controle de escrita</h2>
                    </div>
                    <button onClick=${onClose}>Fechar</button>
                </header>
                <p>Sem token, o mapa carrega do GitHub em modo leitura. Para salvar alteracoes de qualquer maquina, use um PAT com acesso a <strong>${GITHUB_OWNER}/${GITHUB_REPO}</strong>.</p>
                <label>
                    <span>Token</span>
                    <div className="token-input-row">
                        <input
                            type=${visible ? "text" : "password"}
                            value=${value}
                            placeholder="github_pat_xxxxxxxxxxxxxxxxxxxx"
                            onInput=${(event) => setValue(event.currentTarget.value)}
                        />
                        <button onClick=${() => setVisible((next) => !next)}>${visible ? "Ocultar" : "Ver"}</button>
                    </div>
                </label>
                <div className=${`modal-status ${statusType}`}>${status}</div>
                <footer>
                    <button className="primary-action" disabled=${busy} onClick=${saveToken}>${busy ? "Validando..." : "Salvar token"}</button>
                    <button className="danger" onClick=${clearToken}>Remover token</button>
                </footer>
            </section>
        </div>
    `;
}

function Inspector({ node, edge, onNodeChange, onEdgeChange, onDelete, onFocus, canEdit }) {
    if (!node && !edge) {
        return html`
            <div className="empty-panel">
                <span className="eyebrow">Selecao</span>
                <strong>Nenhum node selecionado</strong>
                <p>Sem dados ativos.</p>
            </div>
        `;
    }

    if (edge) {
        const data = edge.data || {};
        return html`
            <div className="inspector">
                <span className="eyebrow">Conexao</span>
                <strong>${edge.source} -> ${edge.target}</strong>
                ${!canEdit ? html`<p className="read-only-note">Modo leitura. Conecte o GitHub para editar.</p>` : null}
                <label>
                    <span>Tipo</span>
                    <select disabled=${!canEdit} value=${data.relation || "requirement"} onChange=${(e) => onEdgeChange(edge.id, { relation: e.currentTarget.value })}>
                        ${Object.entries(RELATIONS).map(([key, meta]) => html`<option key=${key} value=${key}>${meta.label}</option>`)}
                    </select>
                </label>
                <label>
                    <span>Chance %</span>
                    <input disabled=${!canEdit} type="number" min="0" max="100" step="1" value=${data.chance || 0} onInput=${(e) => onEdgeChange(edge.id, { chance: Number(e.currentTarget.value) })} />
                </label>
                <label>
                    <span>Qtd / hora</span>
                    <input disabled=${!canEdit} type="number" min="0" step="1" value=${data.amountPerHour || 0} onInput=${(e) => onEdgeChange(edge.id, { amountPerHour: Number(e.currentTarget.value) })} />
                </label>
                <label>
                    <span>Nota</span>
                    <textarea disabled=${!canEdit} rows="4" value=${data.note || ""} onInput=${(e) => onEdgeChange(edge.id, { note: e.currentTarget.value })}></textarea>
                </label>
                <button className="danger wide" disabled=${!canEdit} onClick=${onDelete}>Remover conexao</button>
            </div>
        `;
    }

    const data = node.data || {};
    const item = data.item || {};
    return html`
        <div className="inspector">
            <span className="eyebrow">Node</span>
            <strong>${data.title}</strong>
            ${!canEdit ? html`<p className="read-only-note">Modo leitura. Conecte o GitHub para editar.</p>` : null}
            ${item.imageUrl ? html`<img className="inspector-image" src=${item.imageUrl} alt=${data.title} />` : null}
            <label>
                <span>Tipo</span>
                <select disabled=${!canEdit} value=${data.kind} onChange=${(e) => onNodeChange(node.id, { kind: e.currentTarget.value })}>
                    ${Object.entries(NODE_KINDS).map(([key, meta]) => html`<option key=${key} value=${key}>${meta.label}</option>`)}
                </select>
            </label>
            <label>
                <span>Nome</span>
                <input disabled=${!canEdit} value=${data.title || ""} onInput=${(e) => onNodeChange(node.id, { title: e.currentTarget.value })} />
            </label>
            <label>
                <span>Spawn / contexto</span>
                <input disabled=${!canEdit} value=${data.subtitle || ""} onInput=${(e) => onNodeChange(node.id, { subtitle: e.currentTarget.value })} />
            </label>
            <div className="field-grid">
                <label>
                    <span>Valor</span>
                    <input disabled=${!canEdit} type="number" min="0" step="1" value=${data.value || 0} onInput=${(e) => onNodeChange(node.id, { value: Number(e.currentTarget.value) })} />
                </label>
                <label>
                    <span>Fluxo / h</span>
                    <input disabled=${!canEdit} type="number" min="0" step="1" value=${data.rate || 0} onInput=${(e) => onNodeChange(node.id, { rate: Number(e.currentTarget.value) })} />
                </label>
            </div>
            ${data.kind === "item" ? html`
                <div className="item-facts">
                    <span>${item.rarity || "common"}</span>
                    <span>${Number(item.weight || 0)}g</span>
                    <span>${item.category || "Sem categoria"}</span>
                </div>
            ` : null}
            <label>
                <span>Nota</span>
                <textarea disabled=${!canEdit} rows="4" value=${data.note || ""} onInput=${(e) => onNodeChange(node.id, { note: e.currentTarget.value })}></textarea>
            </label>
            <div className="panel-actions">
                <button onClick=${() => onFocus(node.id)}>Seguir</button>
                <button className="danger" disabled=${!canEdit} onClick=${onDelete}>Remover</button>
            </div>
        </div>
    `;
}

function EconomyDashboard({ metrics, onFocus }) {
    const totals = metrics.reduce((acc, row) => {
        acc.entries += row.entries;
        acc.exits += row.exits;
        acc.value += row.netValue;
        if (row.status === "excesso") acc.excess += 1;
        if (row.status === "escassez") acc.shortage += 1;
        return acc;
    }, { entries: 0, exits: 0, value: 0, excess: 0, shortage: 0 });

    return html`
        <div className="dashboard">
            <span className="eyebrow">Heatmap economico</span>
            <div className="dash-grid">
                <div><span>Entradas/h</span><strong>${formatNumber(totals.entries)}</strong></div>
                <div><span>Saidas/h</span><strong>${formatNumber(totals.exits)}</strong></div>
                <div><span>Excesso</span><strong>${totals.excess}</strong></div>
                <div><span>Escassez</span><strong>${totals.shortage}</strong></div>
            </div>
            <div className="metric-list">
                ${metrics.length === 0
                    ? html`<div className="empty-panel compact">Sem itens no mapa.</div>`
                    : metrics.map((row) => html`
                        <article className=${`metric-row ${row.status}`}>
                            <button onClick=${() => onFocus(row.nodeId)}>
                                <strong>${row.label}</strong>
                                <code>${row.name}</code>
                            </button>
                            <div className="metric-values">
                                <span>+${formatNumber(row.entries)}</span>
                                <span>-${formatNumber(row.exits)}</span>
                                <b>${row.status}</b>
                            </div>
                        </article>
                    `)}
            </div>
        </div>
    `;
}

function buildFocusSet(focusId, nodes, edges) {
    if (!focusId) return { nodes: new Set(), edges: new Set() };
    const nodeSet = new Set([focusId]);
    const edgeSet = new Set();
    let frontier = new Set([focusId]);

    for (let depth = 0; depth < 3; depth++) {
        const next = new Set();
        for (const edge of edges) {
            if (frontier.has(edge.source) || frontier.has(edge.target)) {
                edgeSet.add(edge.id);
                if (!nodeSet.has(edge.source)) next.add(edge.source);
                if (!nodeSet.has(edge.target)) next.add(edge.target);
                nodeSet.add(edge.source);
                nodeSet.add(edge.target);
            }
        }
        frontier = next;
        if (frontier.size === 0) break;
    }

    return { nodes: nodeSet, edges: edgeSet };
}

function buildEconomyMetrics(nodes, edges) {
    const rows = new Map();

    const getRow = (entry, node) => {
        const item = getSlotEntryItem(entry);
        const name = item.name || item.id || "item";
        if (!rows.has(name)) {
            rows.set(name, {
                nodeId: node.id,
                name,
                label: item.label || name,
                entries: 0,
                exits: 0,
                value: Number(entry.value || item.value || 0),
                sources: [],
                sinks: [],
            });
        }
        return rows.get(name);
    };

    for (const node of nodes) {
        for (const entry of getSlotItems(node.data, "rewards")) {
            const row = getRow(entry, node);
            row.entries += Number(entry.amountPerHour || 0);
            row.sources.push(node.data.title);
        }
        for (const entry of getSlotItems(node.data, "requirements")) {
            const row = getRow(entry, node);
            row.exits += Number(entry.amountPerHour || 0);
            row.sinks.push(node.data.title);
        }
    }

    return Array.from(rows.values()).map((row) => {
        const delta = row.entries - row.exits;
        const status = delta > 20 ? "excesso" : delta < -20 ? "escassez" : "ok";
        return {
            ...row,
            delta,
            status,
            netValue: delta * row.value,
        };
    }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

function formatNumber(value) {
    return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatTime(value) {
    try {
        return new Intl.DateTimeFormat("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(value));
    } catch {
        return "";
    }
}

createRoot(document.getElementById("root")).render(html`
    <${ErrorBoundary}>
        <${App} />
    <//>
`);
