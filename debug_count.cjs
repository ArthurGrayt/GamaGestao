
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    const start = '2026-01-01T00:00:00.000Z';
    const endYear = '2027-01-01T00:00:00.000Z';

    // 4. Hypothesis: "End of Today" (Start of Tomorrow UTC)
    // Today is Jan 13. End of Today is Jan 14 00:00 UTC.
    const endOfToday = '2026-01-14T00:00:00.000Z';

    console.log('--- DEBUG STATUS ANALYSIS ---');
    console.log('Range:', start, 'to', endOfToday);

    const { data: dataEoT, error } = await supabase
        .from('agendamentos')
        .select('status')
        .gte('data_atendimento', start)
        .lt('data_atendimento', endOfToday);

    if (error) {
        console.error(error);
        return;
    }

    console.log('Count (End of Today):', dataEoT.length);

    const statusCounts = {};
    dataEoT.forEach(r => {
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });
    console.log('Status Breakdown:', statusCounts);

    // Check if total count minus "Cancelado" equals 419?
    const cancelled = statusCounts['Cancelado'] || 0;
    const total = dataEoT.length;
    console.log('Total - Cancelado:', total - cancelled);

    // Check other statuses
}

run();
