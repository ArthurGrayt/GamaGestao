const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugData() {
    console.log('--- Debugging HSE Data ---');

    // 1. Get Forms with HSE
    const { data: forms, error: formsError } = await supabase
        .from('forms')
        .select('id, title, hse_id')
        .not('hse_id', 'is', null);

    if (formsError) {
        console.error('Error fetching forms:', formsError);
        return;
    }

    console.log(`Found ${forms.length} HSE Forms.`);

    for (const form of forms) {
        console.log(`\nForm: [${form.id}] ${form.title}`);

        // 2. Get Dimensions for this form
        const { data: dims, error: dimsError } = await supabase
            .from('form_hse_dimensions')
            .select('*')
            .eq('form_id', form.id);

        if (dimsError) {
            console.error('  Error fetching dims:', dimsError);
            continue;
        }

        console.log(`  Dimensions (${dims.length}):`);

        const dimIds = dims.map(d => d.id);

        if (dimIds.length === 0) continue;

        // 3. Get Rules for these dimensions
        // Check filtering by dimension_id
        const { data: rules, error: rulesError } = await supabase
            .from('form_hse_rules')
            .select('*')
            .in('dimension_id', dimIds);

        if (rulesError) {
            console.error('  Error fetching rules:', rulesError);
        } else {
            console.log(`  Rules found (${rules.length}):`);
            rules.forEach(r => {
                console.log(`    - Rule [${r.id}] for Dim [${r.dimension_id}]: ${r.min_val}-${r.max_val} (${r.feedback_interpretativo || 'No feedback'})`);
            });

            // Debug Mismatch
            dims.forEach(d => {
                const rulesForDim = rules.filter(r => r.dimension_id === d.id);
                console.log(`    Dim [${d.id}] "${d.name}" (ID from DB: ${d.id}) -> has ${rulesForDim.length} rules.`);
            });
        }
    }
}

debugData();
