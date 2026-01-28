const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.server' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    // Current date range (simulate a typical filter, e.g., current month)
    const startDate = '2026-01-01T00:00:00.000Z';
    const endDate = '2026-02-01T00:00:00.000Z';

    console.log(`Checking range: ${startDate} to ${endDate}`);

    // 1. Receitas Projetadas
    const { data: receitasProjetadas } = await supabase
        .from('financeiro_receitas')
        .select('valor_total, data_executada, data_projetada')
        .gte('data_projetada', startDate)
        .lt('data_projetada', endDate);

    const faturamentoBruto = receitasProjetadas.reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0);
    const faturamentoRecebido_BillingBased = receitasProjetadas.reduce((acc, r) => {
        return acc + (r.data_executada ? (Number(r.valor_total) || 0) : 0);
    }, 0);

    // 2. Receitas Executadas (Cash Flow)
    const { data: receitasExecutadas } = await supabase
        .from('financeiro_receitas')
        .select('valor_total')
        .gte('data_executada', startDate)
        .lt('data_executada', endDate);

    const totalCashFlow = receitasExecutadas.reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0);

    // 3. Despesas
    const { data: despesasProjetadas } = await supabase
        .from('financeiro_despesas')
        .select('valor')
        .gte('data_projetada', startDate)
        .lt('data_projetada', endDate);

    const totalDespesas = despesasProjetadas.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);

    console.log('--- RESULTS ---');
    console.log('Faturamento Bruto (Proj):', faturamentoBruto);
    console.log('Paid portion of that billing (Recebido fix):', faturamentoRecebido_BillingBased);
    console.log('Total Cash Flow (Executado no período):', totalCashFlow);
    console.log('Total Despesas (Proj):', totalDespesas);
    console.log('Líquido (Bruto - Despesas):', faturamentoBruto - totalDespesas);
}

check();
