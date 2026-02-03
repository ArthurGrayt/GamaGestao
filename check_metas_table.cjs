const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTable() {
    const { data, error } = await supabase.from('metas_usuarios').select('*').limit(1);

    if (error) {
        console.log(`Table 'metas_usuarios' error/not found: ${error.message}`);
    } else {
        console.log(`Table 'metas_usuarios' exists.`);
        if (data && data.length > 0) {
            console.log('Sample data:', data[0]);
            console.log('Columns:', Object.keys(data[0]));
        } else {
            console.log('Table exists but is empty.');
        }
    }
}

checkTable();
