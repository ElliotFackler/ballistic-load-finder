// 1. Initialize connection
const _supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

// 2. The Search Function
async function searchLoads() {
    const query = document.getElementById('searchInput').value;
    const gauge = Number(document.getElementById('gaugeFilter').value);
    const resultsDiv = document.getElementById('results');

    let request = _supabase.from('shotshell_loads').select('*');

    

    // Filter by gauge if selected
    if (gauge) {
        request = request.eq('gauge', gauge);
    }

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

// 4. Run once on page load
window.onload = searchLoads;