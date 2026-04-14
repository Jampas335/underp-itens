const fs = require('fs');
const path = require('path');

const DEFAULT_INVENTORY_PATH =
    'C:\\Users\\noobg\\Desktop\\UnderCity\\txData\\Qbox_A4EC90.base\\resources\\[essenciais]\\prea-inventory';

const PROJECT_ROOT = __dirname;
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'implemented-items.js');
const OUTPUT_ICON_DIR = path.join(PROJECT_ROOT, 'server-icons');
const REMOVED_ITEMS_FILE = path.join(PROJECT_ROOT, 'data', 'implemented-removed.json');

function readText(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function readRemovedImplementedItems() {
    if (!fs.existsSync(REMOVED_ITEMS_FILE)) {
        return new Set();
    }

    try {
        const parsed = JSON.parse(readText(REMOVED_ITEMS_FILE));
        const names = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed?.items)
                ? parsed.items
                : [];
        return new Set(names.map((name) => String(name || '').trim().toLowerCase()).filter(Boolean));
    } catch (err) {
        throw new Error(`Falha ao ler ${path.basename(REMOVED_ITEMS_FILE)}: ${err.message}`);
    }
}

function extractBraceBlock(source, anchorPattern) {
    const match = anchorPattern.exec(source);
    if (!match) {
        throw new Error(`Nao encontrei bloco para ${anchorPattern}`);
    }

    const start = source.indexOf('{', match.index);
    if (start === -1) {
        throw new Error(`Nao encontrei abertura de tabela apos ${anchorPattern}`);
    }

    let depth = 0;
    let inString = false;
    let stringQuote = null;
    let inLineComment = false;

    for (let i = start; i < source.length; i += 1) {
        const char = source[i];
        const next = source[i + 1];

        if (inLineComment) {
            if (char === '\n') {
                inLineComment = false;
            }
            continue;
        }

        if (inString) {
            if (char === '\\') {
                i += 1;
                continue;
            }
            if (char === stringQuote) {
                inString = false;
                stringQuote = null;
            }
            continue;
        }

        if (char === '-' && next === '-') {
            inLineComment = true;
            i += 1;
            continue;
        }

        if (char === '\'' || char === '"') {
            inString = true;
            stringQuote = char;
            continue;
        }

        if (char === '{') {
            depth += 1;
        } else if (char === '}') {
            depth -= 1;
            if (depth === 0) {
                return source.slice(start, i + 1);
            }
        }
    }

    throw new Error(`Bloco nao fechado para ${anchorPattern}`);
}

function tokenizeLua(source) {
    const tokens = [];
    let i = 0;

    while (i < source.length) {
        const char = source[i];
        const next = source[i + 1];

        if (/\s/.test(char)) {
            i += 1;
            continue;
        }

        if (char === '-' && next === '-') {
            while (i < source.length && source[i] !== '\n') {
                i += 1;
            }
            continue;
        }

        if (char === '\'' || char === '"') {
            const quote = char;
            let value = '';
            i += 1;

            while (i < source.length) {
                const current = source[i];

                if (current === '\\') {
                    const escaped = source[i + 1];
                    value += escaped ?? '';
                    i += 2;
                    continue;
                }

                if (current === quote) {
                    i += 1;
                    break;
                }

                value += current;
                i += 1;
            }

            tokens.push({ type: 'string', value });
            continue;
        }

        if (char === '-' || /\d/.test(char)) {
            const numberMatch = source.slice(i).match(/^-?\d+(?:\.\d+)?/);
            if (numberMatch) {
                tokens.push({ type: 'number', value: Number(numberMatch[0]) });
                i += numberMatch[0].length;
                continue;
            }
        }

        if (/[A-Za-z_]/.test(char)) {
            const identMatch = source.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
            tokens.push({ type: 'identifier', value: identMatch[0] });
            i += identMatch[0].length;
            continue;
        }

        if ('{}[](),=.'.includes(char)) {
            tokens.push({ type: char, value: char });
            i += 1;
            continue;
        }

        throw new Error(`Token desconhecido perto de "${source.slice(i, i + 20)}"`);
    }

    return tokens;
}

class LuaParser {
    constructor(tokens) {
        this.tokens = tokens;
        this.index = 0;
    }

    current() {
        return this.tokens[this.index];
    }

    peek(offset = 1) {
        return this.tokens[this.index + offset];
    }

    is(type, value) {
        const token = this.current();
        if (!token) return false;
        if (token.type !== type) return false;
        if (value !== undefined && token.value !== value) return false;
        return true;
    }

    expect(type, value) {
        const token = this.current();
        if (!this.is(type, value)) {
            throw new Error(`Esperado ${type}${value ? ` ${value}` : ''}, encontrado ${token ? `${token.type} ${token.value}` : 'EOF'}`);
        }
        this.index += 1;
        return token;
    }

    parseValue() {
        const token = this.current();
        if (!token) {
            throw new Error('Valor inesperadamente ausente');
        }

        if (token.type === '{') {
            return this.parseTable();
        }

        if (token.type === 'string' || token.type === 'number') {
            this.index += 1;
            return token.value;
        }

        if (token.type === 'identifier') {
            if (token.value === 'true') {
                this.index += 1;
                return true;
            }
            if (token.value === 'false') {
                this.index += 1;
                return false;
            }
            if (token.value === 'nil') {
                this.index += 1;
                return null;
            }
            if (this.peek() && this.peek().type === '(') {
                return this.parseCall();
            }

            this.index += 1;
            return { __identifier: token.value };
        }

        throw new Error(`Nao sei parsear token ${token.type}`);
    }

    parseCall() {
        const name = this.expect('identifier').value;
        this.expect('(');

        const args = [];
        while (!this.is(')')) {
            args.push(this.parseValue());
            if (this.is(',')) {
                this.expect(',');
            }
        }

        this.expect(')');
        return { __call: name, args };
    }

    parseTable() {
        this.expect('{');

        const object = {};
        const array = [];
        let hasNamedKeys = false;

        while (!this.is('}')) {
            if (this.is(',')) {
                this.expect(',');
                continue;
            }

            let key = null;

            if (this.is('[')) {
                this.expect('[');
                const rawKey = this.parseValue();
                this.expect(']');
                this.expect('=');
                key = typeof rawKey === 'object' ? JSON.stringify(rawKey) : String(rawKey);
            } else if (this.is('identifier') && this.peek() && this.peek().type === '=') {
                key = this.expect('identifier').value;
                this.expect('=');
            }

            if (key !== null) {
                object[key] = this.parseValue();
                hasNamedKeys = true;
            } else {
                array.push(this.parseValue());
            }

            if (this.is(',')) {
                this.expect(',');
            }
        }

        this.expect('}');
        return hasNamedKeys ? object : array;
    }
}

function parseLuaTable(source) {
    const tokens = tokenizeLua(source);
    const parser = new LuaParser(tokens);
    return parser.parseValue();
}

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

function mergeInto(target, source) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
        return target;
    }

    for (const [key, value] of Object.entries(source)) {
        target[key] = deepClone(value);
    }

    return target;
}

function buildCompatItem(callExpression, fallbackName) {
    if (!callExpression || callExpression.__call !== 'compatItem') {
        throw new Error(`Entrada de compat invalida para ${fallbackName}`);
    }

    const [nameArg, labelArg, imageArg, weightArg, uniqueArg, useableArg, extraArg] = callExpression.args;
    const name = typeof nameArg === 'string' ? nameArg : fallbackName;

    const item = {
        name,
        label: typeof labelArg === 'string' ? labelArg : name,
        weight: typeof weightArg === 'number' ? weightArg : 0,
        type: 'item',
        image: typeof imageArg === 'string' && imageArg.length > 0 ? imageArg : `${name}.png`,
        unique: Boolean(uniqueArg),
        useable: Boolean(useableArg),
        shouldClose: true,
        rarity: 'common',
    };

    if (extraArg && typeof extraArg === 'object' && !Array.isArray(extraArg)) {
        mergeInto(item, extraArg);
    }

    return item;
}

function extractTable(source, pattern) {
    return parseLuaTable(extractBraceBlock(source, pattern));
}

function normalizeItemRecord(name, item, source) {
    const normalized = deepClone(item);
    normalized.name = normalized.name || name;
    normalized.label = normalized.label || normalized.name;
    normalized.weight = Number(normalized.weight || 0);
    normalized.type = normalized.type || 'item';
    normalized.image = normalized.image || `${normalized.name}.png`;
    normalized.unique = Boolean(normalized.unique);
    normalized.useable = Boolean(normalized.useable);
    normalized.rarity = normalized.rarity || 'common';
    normalized.source = source;
    return normalized;
}

function parseSharedItems(inventoryPath) {
    const sharedItemsPath = path.join(inventoryPath, 'shared', 'items.lua');
    const source = readText(sharedItemsPath);
    const table = extractTable(source, /ItemList\s*=\s*\{/);
    const items = {};

    for (const [name, item] of Object.entries(table)) {
        items[name] = normalizeItemRecord(name, item, 'shared');
    }

    return items;
}

function parseCompatItems(inventoryPath) {
    const compatPath = path.join(inventoryPath, 'shared', 'v_compat_items.lua');
    const source = readText(compatPath);

    const compatibilitySeed = extractTable(source, /local\s+compatibilityItems\s*=\s*\{/);
    const ammoItems = extractTable(source, /local\s+ammoItems\s*=\s*\{/);
    const ammoOverrides = extractTable(source, /local\s+ammoOverrides\s*=\s*\{/);
    const attachmentPrefixes = extractTable(source, /local\s+attachmentPrefixes\s*=\s*\{/);
    const attachmentSuffixes = extractTable(source, /local\s+attachmentSuffixes\s*=\s*\{/);
    const requiredAttachments = extractTable(source, /local\s+requiredAttachments\s*=\s*\{/);
    const tintItems = extractTable(source, /local\s+tintItems\s*=\s*\{/);

    const compatibilityItems = {};

    for (const [name, item] of Object.entries(compatibilitySeed)) {
        compatibilityItems[name] = buildCompatItem(item, name);
    }

    for (const [name, data] of Object.entries(ammoItems)) {
        compatibilityItems[name] = buildCompatItem(
            {
                __call: 'compatItem',
                args: [name, data.label, data.image, data.weight, false, false],
            },
            name
        );
    }

    for (const [name, data] of Object.entries(ammoOverrides)) {
        if (!compatibilityItems[name]) continue;
        compatibilityItems[name].label = data.label || compatibilityItems[name].label;
        compatibilityItems[name].description = data.description || compatibilityItems[name].description;
        compatibilityItems[name].useable = true;
    }

    for (const [prefix, prefixLabel] of Object.entries(attachmentPrefixes)) {
        for (const [suffix, suffixData] of Object.entries(attachmentSuffixes)) {
            const itemName = `${prefix}_${suffix}`;
            if (!requiredAttachments[itemName]) continue;

            compatibilityItems[itemName] = buildCompatItem(
                {
                    __call: 'compatItem',
                    args: [
                        itemName,
                        `${prefixLabel} ${suffixData.label}`,
                        suffixData.image,
                        100,
                        false,
                        false,
                    ],
                },
                itemName
            );
        }
    }

    for (const [name, data] of Object.entries(tintItems)) {
        compatibilityItems[name] = buildCompatItem(
            {
                __call: 'compatItem',
                args: [name, data.label, data.image, 50, false, false],
            },
            name
        );
    }

    const normalized = {};
    for (const [name, item] of Object.entries(compatibilityItems)) {
        normalized[name] = normalizeItemRecord(name, item, 'compat');
    }

    return normalized;
}

function parseGeneratedItems(inventoryPath) {
    const generatedPath = path.join(inventoryPath, 'shared', 'generated_qbx_items.lua');
    const source = readText(generatedPath);
    const table = extractTable(source, /local\s+generatedItems\s*=\s*\{/);
    const items = {};

    for (const [name, item] of Object.entries(table)) {
        items[name] = normalizeItemRecord(name, item, 'generated');
    }

    return items;
}

function parseRuntimeOverrides(inventoryPath) {
    const overridesPath = path.join(inventoryPath, 'shared', 'z_runtime_overrides.lua');
    const source = readText(overridesPath);
    return extractTable(source, /local\s+overrides\s*=\s*\{/);
}

function syncImages(inventoryPath, items) {
    const sourceDir = path.join(inventoryPath, 'html', 'images');
    fs.rmSync(OUTPUT_ICON_DIR, { recursive: true, force: true });
    ensureDir(OUTPUT_ICON_DIR);

    const copiedImages = new Set();

    for (const item of items) {
        if (!item.image) continue;
        const sourceImage = path.join(sourceDir, item.image);
        if (!fs.existsSync(sourceImage)) continue;
        if (copiedImages.has(item.image)) continue;

        const destImage = path.join(OUTPUT_ICON_DIR, item.image);
        ensureDir(path.dirname(destImage));
        fs.copyFileSync(sourceImage, destImage);
        copiedImages.add(item.image);
    }

    return copiedImages.size;
}

function buildOutput(items, meta) {
    const payload =
        '/**\n' +
        ' * Snapshot dos itens implementados no prea-inventory.\n' +
        ' * Gerado automaticamente por sync-implemented-items.js.\n' +
        ' */\n\n' +
        `const IMPLEMENTED_ITEMS_META = ${JSON.stringify(meta, null, 4)};\n\n` +
        `const IMPLEMENTED_ITEMS = ${JSON.stringify(items, null, 4)};\n`;

    fs.writeFileSync(OUTPUT_FILE, payload, 'utf8');
}

function main() {
    const inventoryPath = process.argv[2] || DEFAULT_INVENTORY_PATH;
    const removedNames = readRemovedImplementedItems();

    const sharedItems = parseSharedItems(inventoryPath);
    const compatItems = parseCompatItems(inventoryPath);
    const generatedItems = parseGeneratedItems(inventoryPath);
    const overrides = parseRuntimeOverrides(inventoryPath);

    const mergedItems = { ...sharedItems };

    for (const [name, item] of Object.entries(compatItems)) {
        if (!mergedItems[name]) {
            mergedItems[name] = item;
        }
    }

    for (const [name, item] of Object.entries(generatedItems)) {
        if (!mergedItems[name]) {
            mergedItems[name] = item;
        }
    }

    for (const [name, data] of Object.entries(overrides)) {
        if (!mergedItems[name]) continue;
        mergeInto(mergedItems[name], data);
    }

    const implementedItems = Object.values(mergedItems)
        .map(item => normalizeItemRecord(item.name, item, item.source))
        .filter(item => !removedNames.has(String(item.name || '').toLowerCase()))
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

    const copiedImages = syncImages(inventoryPath, implementedItems);
    const sourceCounts = implementedItems.reduce((acc, item) => {
        const key = item.source || 'shared';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    buildOutput(implementedItems, {
        generatedAt: new Date().toISOString(),
        inventoryResource: "resources/[essenciais]/prea-inventory",
        totalItems: implementedItems.length,
        copiedImages,
        sources: {
            shared: sourceCounts.shared || 0,
            compat: sourceCounts.compat || 0,
            generated: sourceCounts.generated || 0,
        },
    });

    console.log(`Snapshot gerado com ${implementedItems.length} itens e ${copiedImages} imagens em server-icons.`);
}

main();
