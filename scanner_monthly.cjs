const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    const { data: all } = await supabase.from('financeiro_receitas').select('*');

    const monthlyData = {};

    all.forEach(r => {
        if (!r.data_projetada) return;
        const month = r.data_projetada.substring(0, 7);
        if (!monthlyData[month]) monthlyData[month] = { proj: 0, paid: 0, exec: 0 };
        monthlyData[month].proj += (Number(r.valor_total) || 0);
        if (r.data_executada) monthlyData[month].paid += (Number(r.valor_total) || 0);
    });

    all.forEach(r => {
        if (!r.data_executada) return;
        const month = r.data_executada.substring(0, 7);
        if (!monthlyData[month]) monthlyData[month] = { proj: 0, paid: 0, exec: 0 };
        monthlyData[month].exec += (Number(r.valor_total) || 0);
    });

    console.log('--- MONTHLY SCAN ---');
    Object.keys(monthlyData).sort().forEach(m => {
        console.log(`Month: ${m}`);
        console.log(`  Billed (Proj): ${monthlyData[m].proj.toFixed(2)}`);
        console.log(`  Paid Portion of Billed: ${monthlyData[m].paid.toFixed(2)}`);
        console.log(`  Cash In (Exec): ${monthlyData[m].exec.toFixed(2)}`);
    });
}

run();
