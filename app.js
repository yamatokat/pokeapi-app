// PokeAPI endpoints
const API_BASE = "https://pokeapi.co/api/v2";
const MAX_ID = 1010; // Generations up to SV; safe cap

const spriteEl = document.getElementById("sprite");
const nameEl = document.getElementById("name");
const cardEl = document.getElementById("card");

let state = {
    currentId: null,
    revealed: false,
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

            state.currentId = id;
            spriteEl.src = sprite;
            spriteEl.alt = `ランダムなポケモン (${jpKana})`;
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

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').catch(() => { });
    });
}
