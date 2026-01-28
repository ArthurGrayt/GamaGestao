const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    // We are looking for 16,805.49 and 27,974.04

    const startDate = '2026-01-01T00:00:00.000Z';
    const endDate = '2026-02-01T00:00:00.000Z';

    // Try all combinations
    const { data: all } = await supabase.from('financeiro_receitas').select('*');

    console.log('Total records:', all.length);

    // Filter by data_projetada
    const proj = all.filter(r => r.data_projetada >= startDate && r.data_projetada < endDate);
    const projSum = proj.reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0);
    const projPaid = proj.filter(r => r.data_executada).reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0);

    // Filter by data_executada
    const exec = all.filter(r => r.data_executada >= startDate && r.data_executada < endDate);
    const execSum = exec.reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0);

    console.log('Range:', startDate, 'to', endDate);
    console.log('Sum data_projetada (Bruto?):', projSum.toFixed(2));
    console.log('Sum data_projetada PAID (Subset?):', projPaid.toFixed(2));
    console.log('Sum data_executada (Cash Flow?):', execSum.toFixed(2));

    // Try ALL despesas
    const { data: desp } = await supabase.from('financeiro_despesas').select('*');
    const despSum = desp.filter(d => d.data_projetada >= startDate && d.data_projetada < endDate).reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
    console.log('Sum Despesas:', despSum.toFixed(2));
}

run();
