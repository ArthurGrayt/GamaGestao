const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function listTables() {
    const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .like('table_name', 'form_hse_%')
        .eq('table_schema', 'public');

    // Supabase API usually blocks access to information_schema.
    // Try RPC or just list known tables by attempting selects.

    // Alternative: Try to select from known potential tables
    const potentialTables = [
        'form_hse_dimensions',
        'form_hse_rules',
        'form_hse_config',
        'form_hse_form_dimensions',
        'form_hse_reports',
        'form_hse_report_items'
    ];

    for (const t of potentialTables) {
        const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
        if (!error) {
            console.log(`Table exists: ${t} (Rows: ${count})`);
        } else {
            console.log(`Table check failed: ${t} - ${error.message}`);
        }
    }
}

listTables();
