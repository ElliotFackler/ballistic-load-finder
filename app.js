
// 1. Initialize connection & create constants
const _supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
const query = document.getElementById('searchInput').value;
const gauge = Number(document.getElementById('gaugeFilter').value);
const resultsDiv = document.getElementById('results');
const fpsSlider = document.getElementById('fps-slider');
const psiSlider = document.getElementById('psi-slider');
const fpsMinLabel = document.getElementById('fps-min-label');
const fpsMaxLabel = document.getElementById('fps-max-label');
const psiMinLabel = document.getElementById('psi-min-label');
const psiMaxLabel = document.getElementById('psi-max-label');

// 2. The Search Function
async function searchLoads() {
    
    // Take all data from the SQL table
    let request = _supabase.from('shotshell_loads').select('*');

    // Get values of slider
    values = fpsSlider.noUiSlider.get();
    psiValues = psiSlider.noUiSlider.get();
    
    // Filter by gauge if selected
    if (gauge) {
        request = request.eq('gauge', gauge);
    }

    request = request.gte('velocity', Math.round(values[0])).lte('velocity', Math.round(values[1]));
    request = request.gte('pressure', Math.round(psiValues[0])).lte('pressure', Math.round(psiValues[1]));

    if (query.length > 1) {
        const searchString = `hull.ilike.%${query}%,powder.ilike.%${query}%,wad.ilike.%${query}%,primer.ilike.%${query}%,shot.ilike.%${query}%`;
        request = request.or(searchString);
    }

    const { data, error } = await request.limit(20);

    const countElement = document.getElementById('loadCount');

    if (data) {
        countElement.innerText = data.length;
    } else {
        countElement.innerText = '0';
    }

    console.log( data, error );

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
        </div>
    </div>
`).join('');
}

function createSlider() {
    noUiSlider.create(fpsSlider, {
        start: [1000, 2000],
        connect: true,
        step: 1,
        range: {
            min: 1000, 
            max: 2000
        }
    });

    fpsSlider.noUiSlider.on('update', function (values, handle) {
    if (handle === 0) {
        fpsMinLabel.innerHTML = values[0];
    } else {
        fpsMaxLabel.innerHTML = values[1];
    }
    });

    fpsSlider.noUiSlider.on('change', function () {
        searchLoads();
    });
}


function createpsiSlider() {
    noUiSlider.create(psiSlider, {
        start: [1000, 20000],
        connect: true,
        step: 1,
        range: {
            min: 1000, 
            max: 20000
        }
    });

    psiSlider.noUiSlider.on('update', function (values, handle) {
    if (handle === 0) {
        psiMinLabel.innerHTML = values[0];
    } else {
        psiMaxLabel.innerHTML = values[1];
    }
    });

    psiSlider.noUiSlider.on('change', function () {
        searchLoads();
    });
}

// 4. Run once on page load
function initApp() {
    createSlider();
    createpsiSlider();
    searchLoads();
}

// Start the app
document.addEventListener('DOMContentLoaded', initApp);