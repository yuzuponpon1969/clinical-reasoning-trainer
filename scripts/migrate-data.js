const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
let envContent = fs.readFileSync(envPath, 'utf-8');

// Parse using Regex for safety against bad formatting
const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*([^\s]+)/);
const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*([^\s]+)/);

const SUPABASE_URL = urlMatch ? urlMatch[1] : null;
const SUPABASE_KEY = keyMatch ? keyMatch[1] : null;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing Supabase credentials in .env.local");
    console.log("File content debug (masked): ", envContent.replace(/sb_[\w-]+/g, '***').replace(/sk-[\w-]+/g, '***'));
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrate() {
    console.log("Starting migration...");
    
    // 2. Read cases.json
    const casesPath = path.join(__dirname, '..', 'src', 'data', 'cases.json');
    if (!fs.existsSync(casesPath)) {
        console.error("cases.json not found!");
        return;
    }
    
    const casesData = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));
    console.log(`Found ${casesData.length} cases.`);

    let successCount = 0;
    let failCount = 0;

    for (const c of casesData) {
        try {
            const { error } = await supabase
                .from('cases')
                .upsert({
                    id: c.id,
                    title: c.title,
                    archetype_id: c.archetypeId || 'unknown',
                    region_id: c.regionId || 'unknown',
                    category_id: c.categoryId || 'unknown',
                    content: c
                });
            
            if (error) {
                console.error(`Failed to insert ${c.id}:`, error.message);
                failCount++;
            } else {
                successCount++;
            }
        } catch (e) {
            console.error(`Error processing ${c.id}:`, e.message);
            failCount++;
        }
    }

    console.log(`Migration Complete. Success: ${successCount}, Failed: ${failCount}`);
}

migrate();
