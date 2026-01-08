const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugSchema() {
    console.log('--- Debugging Schema ---');

    const { data, error } = await supabase
        .from('form_hse_dimensions')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching one dimension:', error);
    } else {
        console.log('Dimension columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No data found');
        console.log('Sample Data:', data);
    }
}

debugSchema();
