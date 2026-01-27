const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectDocSeg() {
    console.log('--- Inspecting doc_seg ---');
    const { data, error } = await supabase
        .from('doc_seg')
        .select('*')
        .limit(3);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No data');
        console.log('Sample data:', JSON.stringify(data, null, 2));
    }
}

inspectDocSeg();
