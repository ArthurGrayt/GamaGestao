
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspect() {
    console.log("--- TABLE: chamados ---");
    const { data, error } = await supabase
        .from('chamados')
        .select('*')
        .limit(3);

    if (error) {
        console.error("Error fetching chamados:", error.message);
    } else if (data && data.length > 0) {
        data.forEach((row, i) => {
            console.log(`Row ${i + 1}:`, JSON.stringify(row, null, 2));
        });
        console.log("Columns:", Object.keys(data[0]).join(', '));

        // Count statuses
        const { data: stats } = await supabase.from('chamados').select('status, responsavel');
        const counts = stats.reduce((acc, row) => {
            const s = row.status || 'null';
            const r = row.responsavel || 'null';
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {});
        console.log("Status counts:", counts);

        const respCounts = stats.reduce((acc, row) => {
            const r = row.responsavel || 'null';
            acc[r] = (acc[r] || 0) + 1;
            return acc;
        }, {});
        console.log("Responsible counts:", respCounts);
    } else {
        console.log("No data in chamados table.");
    }
}

inspect();
