
// 1. Initialize connection & create constants
const _supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
const resultsDiv = document.getElementById('results');
const fpsSlider = document.getElementById('fps-slider');
const psiSlider = document.getElementById('psi-slider');
const fpsMinLabel = document.getElementById('fps-min-label');
const fpsMaxLabel = document.getElementById('fps-max-label');
const psiMinLabel = document.getElementById('psi-min-label');
const psiMaxLabel = document.getElementById('psi-max-label');
const loadingIndicator = document.getElementById('loadingIndicator');

// Favorites Logic
let showingFavorites = false;

function getFavorites() {
    return JSON.parse(localStorage.getItem('shotshell_favorites') || '[]');
}

function saveFavorites(favs) {
    localStorage.setItem('shotshell_favorites', JSON.stringify(favs));
}

function getItemId(item) {
    return item.id || `${item.gauge}-${item.hull}-${item.powder}-${item.velocity}-${item.pressure}`;
}

function isFavorite(item) {
    const favs = getFavorites();
    const id = getItemId(item);
    return favs.some(f => getItemId(f) === id);
}

// Global click handler to capture favorite toggling
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.favorite-icon-btn');
    if (btn) {
        const item = JSON.parse(btn.dataset.load);
        let favs = getFavorites();
        const id = getItemId(item);
        
        if (isFavorite(item)) {
            favs = favs.filter(f => getItemId(f) !== id);
            btn.classList.remove('active');
        } else {
            favs.push(item);
            btn.classList.add('active');
        }
        saveFavorites(favs);
        
        if (showingFavorites) {
            renderResults(favs);
            document.getElementById('loadCount').innerText = favs.length;
        }
    }
});

function toggleFavoritesView() {
    showingFavorites = !showingFavorites;
    const btn = document.getElementById('viewFavoritesBtn');
    
    if (showingFavorites) {
        btn.classList.add('active');
        btn.innerHTML = '<svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg> Back to Search';
        const favs = getFavorites();
        renderResults(favs);
        document.getElementById('loadCount').innerText = favs.length;
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg> View Favorites';
        searchLoads();
    }
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Pagination Variables
const PAGE_SIZE = 20;
let currentOffset = 0;
let currentLoads = [];

// 2. The Search Function
async function searchLoads(isLoadMore) {
    const isMore = isLoadMore === true;
    if (showingFavorites) return;
    
    if (!isMore) {
        currentOffset = 0;
        currentLoads = [];
        loadingIndicator.style.display = 'block';
        resultsDiv.innerHTML = '';
    } else {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) loadMoreBtn.innerText = 'Loading...';
    }
    
    // Take all data from the SQL table
    let request = _supabase.from('shotshell_loads').select('*', { count: 'exact' });
    const query = document.getElementById('searchInput').value;
    const gauge = Number(document.getElementById('gaugeFilter').value);

    // Get values of slider
    const values = fpsSlider.noUiSlider.get();
    const psiValues = psiSlider.noUiSlider.get();
    
    request = request.gte('velocity', Math.round(values[0])).lte('velocity', Math.round(values[1]));
    request = request.gte('pressure', Math.round(psiValues[0])).lte('pressure', Math.round(psiValues[1]));

    if (query.length > 1) {
        const searchString = `hull.ilike.%${query}%,powder.ilike.%${query}%,wad.ilike.%${query}%,primer.ilike.%${query}%,shot.ilike.%${query}%`;
        request = request.or(searchString);
    }

    // Filter by gauge if selected
    if (gauge) {
        console.log(gauge);
        request = request.eq('gauge', gauge);
    }

    const { data, error, count } = await request.range(currentOffset, currentOffset + PAGE_SIZE - 1);

    const countElement = document.getElementById('loadCount');

    if (!isMore && count !== null) {
        countElement.innerText = count;
    } else if (!isMore) {
        countElement.innerText = '0';
    }

    console.log( data, error, count );
    loadingIndicator.style.display = 'none';

    if (error) {
        if (!isMore) resultsDiv.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
        return;
    }

    if (!isMore) {
        currentLoads = data || [];
    } else {
        currentLoads = currentLoads.concat(data || []);
    }

    renderResults(currentLoads, count);
    
    currentOffset += PAGE_SIZE;
}

// 3. Helper function to show data on screen
function renderResults(loads, totalCount = 0) {
    const resultsDiv = document.getElementById('results');
    
    if (loads.length === 0) {
        resultsDiv.innerHTML = `
        <div class="empty-state">
            <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <h3 class="empty-title">No Loads Found</h3>
            <p class="empty-suggestion">Try expanding your FPS or PSI ranges, or clearing your search filters to find more recipes.</p>
        </div>`;
        return;
    }

    const loadsHtml = loads.map(item => `
    <div class="result-item">
        <div class="load-main">
            <div class="load-title" style="display: flex; align-items: center;">
                <span class="gauge-pill">${item.gauge}ga</span> <strong>${item.hull}</strong>
                <button class="favorite-icon-btn ${isFavorite(item) ? 'active' : ''}" title="Save to Favorites" data-load='${JSON.stringify(item).replace(/'/g, "&apos;").replace(/"/g, "&quot;")}'>
                    <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                </button>
            </div>
            <div class="badge-container">
                <span class="spec-badge">${item.shot}</span>
                <span class="spec-badge">${item.powder}</span>
                <span class="spec-badge">${item.wad}</span>
                <span class="spec-badge">${item.primer}</span>
            </div>
        </div>

        <div class="load-stats">
            <div class="stat-box">
                <span class="stat-label">FPS</span>
                <span class="stat-value">${item.velocity}</span>
            </div>
            <div class="stat-box">
                <span class="stat-label">PSI</span>
                <span class="stat-value">${item.pressure}</span>
            </div>
            <div class="button-wrapper" style="display: flex; align-items: center;">
                <button type="button" class="view-recipe-btn">
                    <svg style="width: 16px; height: 16px; margin-right: 8px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    View Recipe
                </button>
            </div>
        </div>
    </div>
`).join('');

    let loadMoreHtml = '';
    if (!showingFavorites && totalCount > loads.length) {
        loadMoreHtml = `
        <div style="text-align: center; margin-top: 20px;">
            <button id="loadMoreBtn" class="load-more-btn" onclick="searchLoads(true)">Load More</button>
        </div>
        `;
    }

    resultsDiv.innerHTML = loadsHtml + loadMoreHtml;
}

function initSlider(slider, minLabel, maxLabel, min, max) {
    noUiSlider.create(slider, {
        start: [min, max],
        connect: true,
        step: 1,
        range: {
            min: min, 
            max: max
        }
    });

    slider.noUiSlider.on('update', function (values, handle) {
        if (handle === 0) {
            minLabel.innerHTML = Math.round(values[0]);
        } else {
            maxLabel.innerHTML = Math.round(values[1]);
        }
    });

    slider.noUiSlider.on('change', function () {
        searchLoads();
    });
}

function setUpEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const gaugeFilter = document.getElementById('gaugeFilter');

    const debouncedSearch = debounce(searchLoads, 300);

    searchInput.addEventListener('input', debouncedSearch);
    gaugeFilter.addEventListener('change', searchLoads);
    
    const favBtn = document.getElementById('viewFavoritesBtn');
    if (favBtn) favBtn.addEventListener('click', toggleFavoritesView);
}

// 4. Run once on page load
function initApp() {
    initSlider(fpsSlider, fpsMinLabel, fpsMaxLabel, 1000, 2000);
    initSlider(psiSlider, psiMinLabel, psiMaxLabel, 1000, 20000);
    setUpEventListeners();
    searchLoads();
}

// Start the app
document.addEventListener('DOMContentLoaded', initApp);