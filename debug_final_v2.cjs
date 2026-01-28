const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    // Current month (January 2026)
    const startDate = '2026-01-01T00:00:00.000Z';
    const endDate = '2026-02-01T00:00:00.000Z';

    console.log(`Analyzing: ${startDate} to ${endDate}\n`);

    // 1. Receitas by Projection (Billing)
    const { data: proj } = await supabase
        .from('financeiro_receitas')
        .select('valor_total, data_executada, data_projetada')
        .gte('data_projetada', startDate)
        .lt('data_projetada', endDate);

    const bruto = proj.reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0);
    const paidOfProj = proj.filter(r => r.data_executada).reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0);

    // 2. Receitas by Execution (Cash Flow)
    const { data: exec } = await supabase
        .from('financeiro_receitas')
        .select('valor_total')
        .gte('data_executada', startDate)
        .lt('data_executada', endDate);

    const cashFlow = exec.reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0);

    // 3. Despesas by Projection
    const { data: desp } = await supabase
        .from('financeiro_despesas')
        .select('valor')
        .gte('data_projetada', startDate)
        .lt('data_projetada', endDate);

    const expensesTotal = desp.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);

    console.log('--- DATA ANALYSIS ---');
    console.log('Total Billed (Data Projetada):', bruto.toFixed(2));
    console.log('Paid portion of this Billing:', paidOfProj.toFixed(2));
    console.log('Total Cash In (Data Executada):', cashFlow.toFixed(2));
    console.log('Total Expenses:', expensesTotal.toFixed(2));
    console.log('Liquid Potential (Billed - Exp):', (bruto - expensesTotal).toFixed(2));
    console.log('Liquid Real (CashIn - Exp):', (cashFlow - expensesTotal).toFixed(2));
}

check();
