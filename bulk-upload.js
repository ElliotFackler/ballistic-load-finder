// bulk-upload.js
// Run this file using Node.js:
// 1. Install dependencies: npm init -y && npm install @supabase/supabase-js dotenv
// 2. Run script: node bulk-upload.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// IMPORTANT: For bulk uploading, you usually need your Service Role Key to bypass Row Level Security (RLS).
// DO NOT put the Service Role Key in your public config.js.
// Create a .env file in the root directory with the following variables:
// SUPABASE_URL=your_project_url
// SUPABASE_SERVICE_KEY=your_service_role_key

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase URL or Service Key in environment variables.");
  console.error("Please create a .env file with SUPABASE_URL and SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadData() {
  try {
    // 1. Read data from the JSON file
    const rawData = fs.readFileSync('./sample-loads.json', 'utf8');
    const loads = JSON.parse(rawData);

    console.log(`✅ Loaded ${loads.length} records from sample-loads.json`);
    console.log("⏳ Starting upload to 'shotshell_loads' table...");

    // 2. Perform the bulk insert
    // The .insert() method accepts an array of objects
    const { data, error } = await supabase
      .from('shotshell_loads')
      .insert(loads)
      .select();

    if (error) {
      throw error;
    }

    console.log(`🎉 Successfully uploaded ${data.length} records!`);
  } catch (err) {
    console.error("❌ Error uploading data:", err.message || err);
  }
}

uploadData();
