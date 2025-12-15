// PokeAPI endpoints
const API_BASE = "https://pokeapi.co/api/v2";
const MAX_ID = 1010; // Generations up to SV; safe cap

const spriteEl = document.getElementById("sprite");
const nameEl = document.getElementById("name");
const cardEl = document.getElementById("card");
const rootStyle = document.documentElement.style;

let state = {
    currentId: null,
    revealed: false,
    typeName: null,
};

async function fetchPokemon(id) {
    const res = await fetch(`${API_BASE}/pokemon/${id}`);
    if (!res.ok) throw new Error(`Pokemon fetch failed: ${res.status}`);
    return res.json();
}

async function fetchSpecies(id) {
    const res = await fetch(`${API_BASE}/pokemon-species/${id}`);
    if (!res.ok) throw new Error(`Species fetch failed: ${res.status}`);
    return res.json();
}

function getRandomId() {
    // Skip missing or glitched ids if needed; simple uniform for now
    return Math.floor(Math.random() * MAX_ID) + 1;
}

function findJapaneseKanaName(speciesJson) {
    // language.name === 'ja-Hrkt' gives Katakana/Hiragana (kana)
    const entry = speciesJson.names?.find(n => n.language?.name === 'ja-Hrkt');
    return entry?.name || speciesJson.name;
}

async function loadRandomPokemon() {
    state.revealed = false;
    nameEl.textContent = "";
    nameEl.setAttribute("aria-hidden", "true");

    // Try until we get a usable sprite
    for (let tries = 0; tries < 5; tries++) {
        const id = getRandomId();
        try {
            const poke = await fetchPokemon(id);
            const sprite = poke.sprites?.other?.['official-artwork']?.front_default || poke.sprites?.front_default;
            if (!sprite) continue; // no image, retry

            const species = await fetchSpecies(id);
            const jpKana = findJapaneseKanaName(species);
            const primaryType = poke.types?.[0]?.type?.name || null;

            state.currentId = id;
            state.typeName = primaryType;
            spriteEl.src = sprite;
            spriteEl.alt = `ランダムなポケモン (${jpKana})`;
            applyTypeColors(primaryType);
            // Cache hint state
            return;
        } catch (e) {
            // retry with another id
            continue;
        }
    }

    // Fallback
    spriteEl.removeAttribute('src');
    spriteEl.alt = "画像を取得できませんでした";
}

// Type color mapping based on common palette
const TYPE_COLORS = {
    normal: '#A8A77A',
    fire: '#EE8130',
    water: '#6390F0',
    electric: '#F7D02C',
    grass: '#7AC74C',
    ice: '#96D9D6',
    fighting: '#C22E28',
    poison: '#A33EA1',
    ground: '#E2BF65',
    flying: '#A98FF3',
    psychic: '#F95587',
    bug: '#A6B91A',
    rock: '#B6A136',
    ghost: '#735797',
    dragon: '#6F35FC',
    dark: '#705746',
    steel: '#B7B7CE',
    fairy: '#D685AD'
};

function applyTypeColors(typeName) {
    const base = TYPE_COLORS[typeName] || '#f5f5f5';
    // Derive card bg as a lightened version for contrast
    const cardBg = base;
    rootStyle.setProperty('--type-color', base);
    rootStyle.setProperty('--type-card-bg', '#ffffff');
    rootStyle.setProperty('--type-card-shadow', 'rgba(0,0,0,0.1)');
}

async function revealOrNext() {
    if (!state.revealed) {
        // Reveal Japanese kana name for current species
        try {
            const species = await fetchSpecies(state.currentId);
            const jpKana = findJapaneseKanaName(species);
            nameEl.textContent = jpKana;
            nameEl.setAttribute("aria-hidden", "false");
            state.revealed = true;
        } catch (e) {
            nameEl.textContent = "名前取得に失敗";
            nameEl.setAttribute("aria-hidden", "false");
            state.revealed = true;
        }
    } else {
        await loadRandomPokemon();
    }
}

// Input handlers: click/tap and keyboard Enter/Space
cardEl.addEventListener('click', revealOrNext);
cardEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        revealOrNext();
    }
});

// Initial load
loadRandomPokemon();

// Register service worker (relative path + scoped to current directory)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js', { scope: './' }).catch(() => { });
    });
}
