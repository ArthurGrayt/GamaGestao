
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('Starting verification...');

    const startDate = '2025-12-01T00:00:00Z'; // Mock dates
    const endDate = '2025-12-31T23:59:59Z';

    // 1. Fetch Atendimentos
    const { data: atendimentosData, error: atError } = await supabase
        .from('atendimentos')
        .select('*, users(username)')
        .limit(5);

    if (atError) {
        console.error('Error fetching atendimentos:', atError);
        return;
    }
    console.log(`Fetched ${atendimentosData.length} atendimentos.`);

    if (atendimentosData.length > 0) {
        console.log('Sample atendimento:', {
            id: atendimentosData[0].id,
            user: atendimentosData[0].users,
            agendamento_id: atendimentosData[0].agendamento_id
        });

        // 2. Fetch Agendamentos
        const ids = atendimentosData.map(a => a.agendamento_id).filter(Boolean);
        if (ids.length > 0) {
            const { data: agendamentos, error: agError } = await supabase
                .from('agendamentos')
                .select('id, tipo, status, exames_snapshot')
                .in('id', ids);

            if (agError) {
                console.error('Error fetching agendamentos:', agError);
            } else {
                console.log(`Fetched ${agendamentos.length} agendamentos details.`);
                console.log('Sample agendamento:', agendamentos[0]);
            }
        }
    }

    console.log('Verification complete.');
}

verify();
