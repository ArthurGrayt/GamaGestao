const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function probe() {
    console.log('--- LOGS SEARCH ---');
    // Search for status keywords
    const keywords = ['concluido', 'entregue', 'pendente', 'andamento'];
    for (const kw of keywords) {
        const { data, error } = await supabase
            .from('logs')
            .select('*')
            .ilike('logtxt', `%${kw}%`)
            .limit(5);

        if (data) {
            data.forEach(l => console.log(`[${l.timelog}] [${l.appname}] ${l.logtxt}`));
        }
    }
}

probe();
