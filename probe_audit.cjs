const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function probe() {
    const list = [
        'audit', 'audit_log', 'audit_logs', 'history', 'transitions',
        'doc_seg_audit', 'doc_seg_history', 'doc_seg_logs', 'doc_seg_log'
    ];
    for (const name of list) {
        const { data, error } = await supabase.from(name).select('*').limit(1);
        if (!error) console.log(`Table '${name}' exists!`);
    }
}

probe();
