
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

// 2. The Search Function
async function searchLoads() {
    
    loadingIndicator.style.display = 'block';
    resultsDiv.innerHTML = '';
    
    // Take all data from the SQL table
    let request = _supabase.from('shotshell_loads').select('*');
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

    const { data, error } = await request.limit(20);

    const countElement = document.getElementById('loadCount');

    if (data) {
        countElement.innerText = data.length;
    } else {
        countElement.innerText = '0';
    }

    console.log( data, error );
    loadingIndicator.style.display = 'none';

    if (error) {
        resultsDiv.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
        return;
    }

    renderResults(data);
}

// 3. Helper function to show data on screen
function renderResults(loads) {
    const resultsDiv = document.getElementById('results');
    
    if (loads.length === 0) {
        resultsDiv.innerHTML = "<p>No loads found.</p>";
        return;
    }

    resultsDiv.innerHTML = loads.map(item => `
    <div class="result-item">
        <div class="load-main">
            <div class="load-title">
                <span class="gauge-pill">${item.gauge}ga <strong>${item.hull}</strong></div>
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