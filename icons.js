/**
 * ============================================================
 *  REGISTRO DE ÍCONES - UnderCity Icon Catalog
 * ============================================================
 *  Total: 360 ícones organizados por categoria
 * ============================================================
 */

const ICONS = {
    // ===== ARMAS - PISTOLAS =====
    "Pistolas": [
        "ap-pistol",
        "combat-pistol",
        "desert-eagle",
        "double-action-revolver",
        "heavy-pistol",
        "machine-pistol",
        "marksman-pistol",
        "pistol",
        "revolver",
        "sns-pistol",
        "vintage-pistol",
        "flare-gun",
        "taser",
    ],

    // ===== ARMAS - RIFLES & SMGs =====
    "Rifles & SMGs": [
        "assult-rifle",
        "assult-smg",
        "bullpop",
        "bullpop-shotgun",
        "carbine",
        "combat-rifle",
        "micro-smg",
        "musket",
        "pump-shotgun",
        "sawed-off-shotgun",
        "sawn-off",
        "scorpion",
        "smg",
        "smg-mrk2",
        "special-carbine",
        "tommy-gun",
    ],

    // ===== ARMAS - PESADAS =====
    "Armas Pesadas": [
        "firework-launcher",
        "grenade-launcher",
        "heavy-sniper",
        "launcher",
        "rpg",
    ],

    // ===== ARMAS - CORPO A CORPO =====
    "Corpo a Corpo": [
        "axe",
        "baseball-bat",
        "broken-bottle",
        "crowbar",
        "dagger",
        "golf-club",
        "hammer",
        "knuckle-dusters",
        "machete",
        "nightstick",
        "pool-que",
        "stone-axe",
        "switchblade",
    ],

    // ===== MUNIÇÃO & ACESSÓRIOS DE ARMA =====
    "Munição & Attachments": [
        "ammo-container",
        "box-magazine",
        "compensator",
        "drum-clip",
        "extended-clip",
        "flashlight-attatchment",
        "grip",
        "muzzle-brake",
        "scope",
        "suppressor",
    ],

    // ===== EXPLOSIVOS =====
    "Explosivos": [
        "blasting-cap",
        "c4",
        "dynamite",
        "frag-grenade",
        "grenade",
        "molotov",
        "nitroglycerin",
        "pipe-bomb",
        "proximity-mine",
        "sticky-bomb",
        "teargas",
        "time-bomb",
    ],

    // ===== COMIDA - BURGER SHOT =====
    "Burger Shot": [
        "bs-bag",
        "bs-bleeder",
        "bs-creampie",
        "bs-donut",
        "bs-fries",
        "bs-heartstopper",
        "bs-icecream",
        "bs-milkshake",
        "bs-moneyshot",
        "bs-murder-meal",
        "bs-mystery-burger",
        "bs-namuh",
        "bs-patty",
        "bs-raw-patty",
        "bs-soda",
        "bs-torpedo",
        "bs-weiner",
    ],

    // ===== COMIDA - INGREDIENTES =====
    "Ingredientes": [
        "bs-carrot",
        "bs-cheese",
        "bs-coffee-beans",
        "bs-garlic",
        "bs-lettuce",
        "bs-mushroom",
        "bs-potato",
        "bs-tomato",
    ],

    // ===== COMIDA - PIZZA =====
    "Pizza": [
        "pizza-1",
        "pizza-2",
        "pizza-3",
        "pizza-big-d'izza",
        "pizza-box",
        "pizza-bruschetta",
        "pizza-calamari",
        "pizza-campari",
        "pizza-canolli",
        "pizza-garlic-bread",
        "pizza-gelato",
        "pizza-k'aesar-salad",
        "pizza-la-castle",
        "pizza-la-kitchetta",
        "pizza-lee'sagna",
        "pizza-red-wine",
        "pizza-sanpelegrino",
        "pizza-tiramisu",
    ],

    // ===== COMIDA - PEARLS =====
    "Pearls Seafood": [
        "pearls_baybugs",
        "pearls_bbqkingprawns",
        "pearls_beerbatteredfish",
        "pearls_calamari",
        "pearls_charcoalgrilledsalmon",
        "pearls_coconutprawnsalad",
        "pearls_dozenoysters",
        "pearls_fishbowl",
        "pearls_giantoctopus",
        "pearls_largechips",
        "pearls_lobster",
        "pearls_mudcrab",
        "pearls_piratepunch",
        "pearls_sauvignonblanc",
        "pearls_scallops",
        "pearls_sexonthepier",
    ],

    // ===== COMIDA - JAPONESA =====
    "Comida Japonesa": [
        "miso-ramen",
        "mochi-icecream",
        "sushimi",
        "taiyaki",
        "katsu-sandwich",
    ],

    // ===== COMIDA - GERAL =====
    "Comida": [
        "banana",
        "burger-n-shake",
        "chicken-salad",
        "chocolate-brownie",
        "churros",
        "dino-nuggies",
        "eggs-benedict",
        "fair-corndog",
        "fair-cotton-candy",
        "fair-popcorn",
        "fair-popsicle",
        "fair-pretzel",
        "fairy-bread",
        "glazed-donuts",
        "golden-apple",
        "gummi-bears",
        "jalapenio-poppers",
        "jam-donut",
        "loaded-fries",
        "lollipop",
        "panini",
        "passionfruit-cheesecake",
        "penut-butter-cup",
        "sandwich",
        "strawberry-shortcake",
    ],

    // ===== BEBIDAS - CAFÉ =====
    "Café": [
        "americano",
        "bs-coffee",
        "cuppacino",
        "esspresso",
        "frappuccino",
        "hot-chocolate",
        "iced-caramel-macchiato",
        "iced-chocolate",
        "latte",
        "long-black",
        "matcha-latte",
    ],

    // ===== BEBIDAS - DRINKS =====
    "Bebidas": [
        "bubble-tea",
        "cherry-pop",
        "coke-can",
        "earl-grey-tea",
        "orange-juice",
        "peach-iced-tea",
        "smoothie",
        "strawberry-milkshake",
        "water",
    ],

    // ===== BEBIDAS - BAHAMA =====
    "Bahama Drinks": [
        "bahama-hennesey",
        "bahama-malibu",
        "bahamas-angel-tit",
        "bahamas-goonbag",
    ],

    // ===== BEBIDAS - TEQUILA =====
    "Tequila Bar": [
        "tequila-brave-bull",
        "tequila-el-diablo",
        "tequila-sour",
        "tequila-sunrise",
        "tequila-tequilano",
    ],

    // ===== BEBIDAS - VU =====
    "VU Bar": [
        "vu-b52-shot",
        "vu-longisland-tea",
        "vu-mimosa",
        "vu-pina-colada",
        "vu-wetpussy-shot",
    ],

    // ===== DROGAS =====
    "Drogas": [
        "2kg-cocaine",
        "4kg-cocaine",
        "6kg-cocaine",
        "acid",
        "benzo",
        "benzo-damaged",
        "bump",
        "coca-leaves",
        "coca-leaves-damaged",
        "joint",
        "lysergic-acid",
        "magic-mushroom",
        "mdma",
        "mdma-2kg",
        "mdma-5kg",
        "mdma-6kg",
        "mdma-10kg",
        "mdma-pouch",
        "molly",
        "paper-tabs",
        "weed-2kg",
        "weed-4kg",
        "weed-6kg",
        "weed-bags",
        "weed-plant",
    ],

    // ===== DROGAS - MATERIAIS =====
    "Materiais de Droga": [
        "damaged-drying-agent",
        "damaged-filters",
        "damaged-solvent",
        "drying-agent",
        "filters",
        "hydrazine",
        "methanol",
        "methanol-damaged",
        "palladium",
        "palladium-damaged",
        "solvent",
    ],

    // ===== MÉDICO =====
    "Médico": [
        "bandages",
        "ems-bandage",
        "ems-medkit",
        "ems-painkillers",
        "ems-restraints",
        "ems-splint",
        "firstaid-kit",
        "gauze",
        "med-kit",
        "organ-replacement-kit",
        "scalple",
        "vicodin",
    ],

    // ===== FERRAMENTAS =====
    "Ferramentas": [
        "advanced-repair",
        "basic-repair",
        "bobcat-welder",
        "diamond-drill",
        "fire-extinguisher",
        "jerry-can",
        "landscaping-toolbox",
        "lockpick",
        "mechanic-toolbox",
        "pliers",
        "rope",
        "scissors",
        "scissors-damaged",
        "torch",
        "tresure-toolbox",
        "underwater-blowtorch",
        "wrench",
    ],

    // ===== PEÇAS DE VEÍCULO =====
    "Peças de Veículo": [
        "alternator",
        "battery",
        "brakes",
        "engine",
        "fog-light",
        "fuel-injector",
        "fuel-tank",
        "headlight",
        "radiator",
        "steering-wheel",
        "suspension",
        "transmission",
        "wheels",
        "wipers",
    ],

    // ===== COMBUSTÍVEL =====
    "Combustível": [
        "diluted-gasoline",
        "premium-gasoline",
    ],

    // ===== ELETRÔNICA =====
    "Eletrônica": [
        "communication-jammer",
        "electronics",
        "electrical-cable",
        "phone",
        "radio",
        "satelite-scanner",
        "tresure-scanner",
        "trucking-gps",
    ],

    // ===== POLICIAL =====
    "Policial": [
        "bolice-badge",
        "gsr-testing-kit",
        "handcuffs",
        "impound-order",
        "spike-strips",
        "ziptie",
    ],

    // ===== DOCUMENTOS =====
    "Documentos": [
        "golden-ticket",
        "green-card",
        "landscaping-job-sheet",
        "notepad",
        "pink-card",
        "reciept",
        "secret-file",
        "ticket",
        "trucking-job-sheet",
        "tresure-job-sheet",
        "yellow-card",
    ],

    // ===== JÓIAS & VALORES =====
    "Jóias & Valores": [
        "cash",
        "diamond",
        "diamond-necklace",
        "diamond-ring",
        "dirty-money",
        "dragons-eye-bracelet",
        "gold-rolex",
        "ring-1",
        "ring-2",
        "ring-3",
        "ring-4",
        "trophy",
    ],

    // ===== MINERAÇÃO =====
    "Mineração": [
        "brick",
        "dirt-block",
        "ore_coal",
        "ore_diamond",
        "rock",
    ],

    // ===== MERGULHO =====
    "Mergulho": [
        "heavy-diving",
        "light-diving",
        "binoculars",
        "night-vision",
        "parachute",
    ],

    // ===== FUMANTES =====
    "Fumantes": [
        "cigar",
        "cigarette",
        "lighter",
    ],

    // ===== PELÚCIAS =====
    "Pelúcias": [
        "plushy-blue",
        "plushy-brown",
        "plushy-green",
        "plushy-purple",
        "plushy-red",
        "plushy-yellow",
        "teddy-bear",
        "troll-doll",
    ],

    // ===== GATOS =====
    "Coleção Gatos": [
        "cat-balla",
        "cat-biker",
        "cat-box",
        "cat-business",
        "cat-cop",
        "cat-doctor",
        "cat-maid",
        "cat-onecrew",
        "cat-robber",
        "cat-tradie",
        "cat-wizard",
        "gentlecat",
    ],

    // ===== TRUCKING =====
    "Trucking": [
        "sorbent-pads",
        "transport-bag",
        "truck-spawner",
        "portable-laundry",
    ],

    // ===== PROTEÇÃO =====
    "Proteção": [
        "body-armour",
        "flare",
        "snowball",
    ],

    // ===== OUTROS =====
    "Outros": [
        "ball",
        "box",
        "car-fisher",
        "gruppe6-intel",
        "ls-beach",
        "mirror",
        "power-site-keycard",
        "rose",
        "sturdy-rod",
        "fishing-rod",
    ],
};
