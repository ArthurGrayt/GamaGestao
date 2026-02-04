const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function probe() {
    console.log('--- DETAILED PROBE ---');

    // Check all columns of doc_seg
    const { data: docData, error: docError } = await supabase.from('doc_seg').select('*').limit(1);
    if (docData && docData.length > 0) {
        console.log('doc_seg columns:', Object.keys(docData[0]));
    }

    // Check logs columns
    const { data: logData, error: logError } = await supabase.from('logs').select('*').limit(1);
    if (logData && logData.length > 0) {
        console.log('logs columns:', Object.keys(logData[0]));
        console.log('logs sample:', logData[0]);
    }
}

probe();
