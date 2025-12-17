// PokeAPI endpoints
const API_BASE = "https://pokeapi.co/api/v2";
const MAX_ID = 1010; // Generations up to SV; safe cap

const spriteEl = document.getElementById("sprite");
const nameEl = document.getElementById("name");
const cardEl = document.getElementById("card");
const rootStyle = document.documentElement.style;
const displayNameEl = document.getElementById('display-name') || null;
const typesEl = document.getElementById('types') || null;
const strengthEl = document.getElementById('strength') || null;
const infoEl = document.querySelector('.info') || null;
const statVisitsEl = document.getElementById('stat-visits') || null;
const statQuizzesEl = document.getElementById('stat-quizzes') || null;

let state = {
    currentId: null,
    revealed: false,
    typeName: null,
    allTypes: [],
    strength: null,
    jpName: null,
    visits: 0,
    quizzes: 0,
};

// Simple localStorage counter helpers
function getCounter(key) {
    const raw = localStorage.getItem(key);
    const num = Number(raw);
    return Number.isFinite(num) && num >= 0 ? num : 0;
}

function setCounter(key, value) {
    try {
        localStorage.setItem(key, String(Math.max(0, Math.floor(value))));
    } catch (_) { /* ignore storage errors */ }
}

function incCounter(key) {
    const v = getCounter(key) + 1;
    setCounter(key, v);
    return v;
}

function updateStatsWidget() {
    if (statVisitsEl) statVisitsEl.textContent = String(state.visits);
    if (statQuizzesEl) statQuizzesEl.textContent = String(state.quizzes);
}

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
    // Count a quiz shown (each successful load increments)
    state.quizzes = getCounter('quizzes');
    state.revealed = false;
    nameEl.textContent = "";
    nameEl.setAttribute("aria-hidden", "true");
    // Clear info area until reveal
    if (typeof clearInfo === 'function') clearInfo();
    if (infoEl) infoEl.classList.remove('show');

    // Try until we get a usable sprite
    for (let tries = 0; tries < 5; tries++) {
        const id = getRandomId();
        try {
            const poke = await fetchPokemon(id);
            const sprite = poke.sprites?.other?.['official-artwork']?.front_default || poke.sprites?.front_default;
            if (!sprite) continue; // no image, retry

            const species = await fetchSpecies(id);
            const jpKana = findJapaneseKanaName(species);
            const types = (poke.types || []).map(t => t.type?.name).filter(Boolean);
            const primaryType = types[0] || null;
            const totalStats = (poke.stats || []).reduce((sum, s) => sum + (s.base_stat || 0), 0);

            state.currentId = id;
            state.typeName = primaryType;
            state.allTypes = types;
            state.strength = totalStats;
            state.jpName = jpKana;
            spriteEl.src = sprite;
            spriteEl.alt = `ランダムなポケモン (${jpKana})`;
            applyTypeColors(primaryType);
            // Increment quiz counter and update widget when a sprite is available
            state.quizzes = incCounter('quizzes');
            updateStatsWidget();
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

// Japanese labels for type names
const TYPE_LABEL_JA = {
    normal: 'ノーマル',
    fire: 'ほのお',
    water: 'みず',
    electric: 'でんき',
    grass: 'くさ',
    ice: 'こおり',
    fighting: 'かくとう',
    poison: 'どく',
    ground: 'じめん',
    flying: 'ひこう',
    psychic: 'エスパー',
    bug: 'むし',
    rock: 'いわ',
    ghost: 'ゴースト',
    dragon: 'ドラゴン',
    dark: 'あく',
    steel: 'はがね',
    fairy: 'フェアリー'
};

function applyTypeColors(typeName) {
    const base = TYPE_COLORS[typeName] || '#f5f5f5';
    // Derive card bg as a lightened version for contrast
    const cardBg = base;
    rootStyle.setProperty('--type-color', base);
    rootStyle.setProperty('--type-card-bg', '#ffffff');
    rootStyle.setProperty('--type-card-shadow', 'rgba(0,0,0,0.1)');
}

function renderInfo(jpName, types, totalStats) {
    if (displayNameEl) displayNameEl.textContent = jpName || '';
    if (typesEl) {
        typesEl.innerHTML = '';
        types.forEach((t) => {
            const badge = document.createElement('span');
            badge.className = 'type-badge';
            badge.textContent = TYPE_LABEL_JA[t] || t;
            badge.title = t;
            badge.style.backgroundColor = TYPE_COLORS[t] || '#888';
            typesEl.appendChild(badge);
        });
    }
    if (strengthEl) strengthEl.textContent = String(totalStats ?? '');
}

function clearInfo() {
    if (displayNameEl) displayNameEl.textContent = '';
    if (typesEl) typesEl.innerHTML = '';
    if (strengthEl) strengthEl.textContent = '';
}

async function revealOrNext() {
    if (!state.revealed) {
        const jpKana = state.jpName || '名前取得に失敗';
        nameEl.textContent = jpKana;
        nameEl.setAttribute("aria-hidden", "false");
        renderInfo(jpKana, state.allTypes || [], state.strength ?? '');
        if (infoEl) infoEl.classList.add('show');
        state.revealed = true;
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
// Count visit
state.visits = incCounter('visits');
updateStatsWidget();
// Load first quiz
loadRandomPokemon();

// Register service worker (relative path + scoped to current directory)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js', { scope: './' }).catch(() => { });
    });
}
