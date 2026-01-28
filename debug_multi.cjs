const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRange(start, end, label) {
    const { data: proj } = await supabase
        .from('financeiro_receitas')
        .select('valor_total, data_executada, data_projetada')
        .gte('data_projetada', start)
        .lt('data_projetada', end);

    const bruto = proj.reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0);
    const paidOfProj = proj.filter(r => r.data_executada).reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0);

    const { data: exec } = await supabase
        .from('financeiro_receitas')
        .select('valor_total')
        .gte('data_executada', start)
        .lt('data_executada', end);

    const cashFlow = exec?.reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0) || 0;

    console.log(`--- ${label} ---`);
    console.log('Bruto (Billing):', bruto.toFixed(2));
    console.log('Paid subset:', paidOfProj.toFixed(2));
    console.log('Cash Flow (Actually Received):', cashFlow.toFixed(2));
    console.log('');
}

async function run() {
    await checkRange('2025-11-01T00:00:00.000Z', '2025-12-01T00:00:00.000Z', 'NOV 2025');
    await checkRange('2025-12-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', 'DEC 2025');
    await checkRange('2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z', 'JAN 2026');
}

run();
