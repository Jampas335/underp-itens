/**
 * ============================================================
 *  REGISTRO DE ÍCONES - UnderCity Icon Catalog
 * ============================================================
 *  Total: 475 ícones organizados por categoria
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
        "armor-piercing-round",
        "box-magazine",
        "bullet-press",
        "compensator",
        "drum-clip",
        "extended-clip",
        "flashlight-attatchment",
        "grip",
        "incendiary-round",
        "metal-jacket-round",
        "muzzle-brake",
        "scope",
        "suppressor",
        "tracer-round",
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
        "pearls_mobydick",
        "pearls_mudcrab",
        "pearls_pinotgris",
        "pearls_piratepunch",
        "pearls_sauvignonblanc",
        "pearls_scallops",
        "pearls_sexonthepier",
    ],

    // ===== COMIDA - JAPONESA =====
    "Comida Japonesa": [
        "bento-1",
        "bento-2",
        "bento-3",
        "bento-4",
        "bento-5",
        "bento-6",
        "bento-box",
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
        "bwok-bwok",
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
        "moonberry-juice",
        "orange-juice",
        "peach-iced-tea",
        "smoothie",
        "spring-water",
        "strawberry-milkshake",
        "water",
    ],

    // ===== BEBIDAS - ALCOÓLICAS =====
    "Bebidas Alcoólicas": [
        "asahi",
        "blue-label",
        "corona",
        "gin",
        "great-northern",
        "heineken",
        "spided-rum",
        "tequila",
        "vb",
        "vodka",
    ],

    // ===== BEBIDAS - BAHAMA =====
    "Bahama Drinks": [
        "bahama-cruiser",
        "bahama-ga",
        "bahama-glowstick",
        "bahama-hennesey",
        "bahama-malibu",
        "bahama-vip",
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

    // ===== ÓRGÃOS HUMANOS =====
    "Órgãos Humanos": [
        "humanarm",
        "humanbone",
        "humanbones",
        "humanbrain",
        "humanear",
        "humaneye",
        "humanhand",
        "humanhead",
        "humanheart",
        "humanintestines",
        "humanleg",
        "humanliver",
        "humanlungs",
        "humannail",
        "humanpancreas",
        "humanskull",
        "humantongue",
        "humantooth",
        "humantorso",
        "kidney",
        "severed-finger",
        "finger",
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
        "advanced-yellow-laptop",
        "blue-laptop",
        "communication-jammer",
        "electronics",
        "electrical-cable",
        "nokia",
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
        "diamond-box",
        "diamond-necklace",
        "diamond-ring",
        "dirty-money",
        "dragons-eye-bracelet",
        "eagle-statue",
        "gold-rolex",
        "gucci-brooch",
        "pearl-lady",
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

    // ===== CASSINO & JOGOS =====
    "Cassino & Jogos": [
        "arcade-token",
        "blackjack-card",
        "flipping-coin",
        "legacy-dice",
        "legacy-ultra-dice",
        "scratchy-ticket",
        "super-scratchy-ticket",
        "ultra-dice",
    ],

    // ===== MERGULHO =====
    "Mergulho": [
        "heavy-diving",
        "light-diving",
        "binoculars",
        "night-vision",
        "parachute",
    ],

    // ===== ARTE & PINTURAS =====
    "Arte": [
        "abstract-girl",
        "dimitris-creation-of-seb",
        "mona-lisa",
        "renaissance-twerk",
        "the-last-supper",
    ],

    // ===== FUMANTES =====
    "Fumantes": [
        "cigar",
        "cigarette",
        "lighter",
    ],

    // ===== CANECAS =====
    "Canecas": [
        "bean-mug-box",
        "mug-booty",
        "mug-burger",
        "mug-emoji",
        "mug-grenade",
        "mug-mrpotato",
        "mug-poop",
        "mug-shark",
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

    // ===== PAC-MAN =====
    "Pac-Man": [
        "pac-blue",
        "pac-man",
        "pac-pink",
        "pac-red",
    ],

    // ===== POTIONS =====
    "Poções": [
        "boss-fairy-dust",
        "mana-blue",
        "mana-red",
        "molten-shield",
        "tidepod",
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
        "cherry-popper",
        "crotch-rocket",
        "dot-with-colour",
        "dudes",
        "edgy-violence",
        "good-boi-dog",
        "gruppe6-intel",
        "intimate-banana",
        "larevolution-pin",
        "loot-crate",
        "ls-beach",
        "mario",
        "mirror",
        "naughty-text",
        "penetrator",
        "pepe-hands",
        "pet rock",
        "place-holder",
        "power-site-keycard",
        "rainbow-road",
        "rocket-grab",
        "rose",
        "shoryukun",
        "simple-eggplant",
        "square",
        "squidward",
        "sturdy-rod",
        "tripping-racoon",
        "violence",
        "vroom",
        "fishing-rod",
    ],
};
