const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function probe() {
    const { data, error } = await supabase
        .from('doc_seg')
        .select('*')
        .ilike('obs', '%retrabalho%')
        .limit(10);

    if (data && data.length > 0) {
        console.log('Found records with "retrabalho" in obs:');
        data.forEach(d => console.log(`ID: ${d.id}, Obs: ${d.obs}, Status: ${d.status}`));
    } else {
        console.log('No records found with "retrabalho" in obs.');
    }
}

probe();
