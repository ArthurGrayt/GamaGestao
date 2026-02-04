const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function probe() {
    console.log('--- LOGS ANALYSIS ---');
    const { data: logs, error } = await supabase
        .from('logs')
        .select('*')
        .ilike('logtxt', '%doc_seg%')
        .limit(10);

    if (logs) {
        logs.forEach(l => console.log(`[${l.created_at}] ${l.logtxt}`));
    } else {
        console.log('No logs found for doc_seg');
    }
}

probe();
