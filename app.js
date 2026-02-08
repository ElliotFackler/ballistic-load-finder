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

    // Filter by text if user typed 2+ characters
    if (query.length > 1) {
        request = request.or(`hull.ilike.%${query}%,powder.ilike.%${query}%`);
    }

    const { data, error } = await request.limit(20);

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
            <strong>${item.gauge}ga - ${item.hull}</strong><br>
            <small>Powder: ${item.powder} | Velocity: ${item.velocity} FPS</small>
        </div>
    `).join('');
}

// 4. Run once on page load
window.onload = searchLoads;