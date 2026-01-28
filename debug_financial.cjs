const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.server' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const startDate = '2026-01-01';
    const endDate = '2026-02-01';

    // 1. All receitas projected for Jan
    const { data: proj } = await supabase
        .from('financeiro_receitas')
        .select('valor_total, data_executada, data_projetada')
        .gte('data_projetada', startDate)
        .lt('data_projetada', endDate);

    const bruto = proj.reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0);
    const proj_pago = proj.filter(r => r.data_executada).reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0);

    // 2. All receitas executed in Jan
    const { data: exec } = await supabase
        .from('financeiro_receitas')
        .select('valor_total, data_projetada, data_executada')
        .gte('data_executada', startDate)
        .lt('data_executada', endDate);

    const recebido_caixa = exec.reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0);

    // 3. Despesas Jan
    const { data: desp } = await supabase
        .from('financeiro_despesas')
        .select('valor')
        .gte('data_projetada', startDate)
        .lt('data_projetada', endDate);

    const despesas = desp.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);

    console.log('--- JANUARY 2026 ---');
    console.log('Bruto (Projected):', bruto);
    console.log('Received from this month\'s billing (Proj & Paid):', proj_pago);
    console.log('Total Cash Received thisMonth (regardless of due date):', recebido_caixa);
    console.log('Total Expenses (Projected):', despesas);
    console.log('Net (Bruto - Desp):', bruto - despesas);
    console.log('Net (Received_Caixa - Desp):', recebido_caixa - despesas);
}

check();
