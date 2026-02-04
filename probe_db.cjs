const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function probe() {
    console.log('--- PROBING DB ---');
    const tablesToTry = ['doc_seg', 'doc_seg_history', 'doc_seg_audit', 'rework_logs', 'logs', 'audit_logs'];

    for (const table of tablesToTry) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                console.log(`Table '${table}' not found or error: ${error.message}`);
            } else {
                console.log(`Table '${table}' exists.`);
                if (data && data.length > 0) {
                    console.log(`Sample columns from ${table}:`, Object.keys(data[0]));
                }
            }
        } catch (e) {
            console.log(`Error probing ${table}:`, e.message);
        }
    }
}

probe();
