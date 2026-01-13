
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    const start = '2026-01-01T00:00:00.000Z';
    const endYear = '2027-01-01T00:00:00.000Z';
    const now = new Date().toISOString();

    console.log('--- DEBUG START ---');
    console.log('Start:', start);
    console.log('End Year:', endYear);
    console.log('NOW:', now);

    // 1. Current Frontend Logic (Year Filter) -> End = 2027-01-01
    const { count: countYear, error: errYear } = await supabase
        .from('agendamentos')
        .select('*', { count: 'exact', head: true })
        .gte('data_atendimento', start)
        .lt('data_atendimento', endYear); // Mimics current frontend for "Ano"

    if (errYear) console.error('Error Year:', errYear);
    console.log('Count (Frontend Logic - Year Filter):', countYear);

    // 2. Strict SQL Logic -> End = NOW
    const { count: countNow, error: errNow } = await supabase
        .from('agendamentos')
        .select('*', { count: 'exact', head: true })
        .gte('data_atendimento', start)
        .lt('data_atendimento', now); // Matches SQL < NOW()

    if (errNow) console.error('Error Now:', errNow);
    console.log('Count (SQL Logic - < NOW()):', countNow);

    // 3. Difference?
    if (countYear !== countNow) {
        console.log('DISCREPANCY DETECTED!');
        console.log('Diff:', (countYear || 0) - (countNow || 0));

        // Fetch the future appointments to see what they are
        const { data: futureApps } = await supabase
            .from('agendamentos')
            .select('data_atendimento, id, compareceu')
            .gte('data_atendimento', now)
            .lt('data_atendimento', endYear);

        console.log('Future Appointments:', futureApps);
    } else {
        console.log('No discrepancy between Year and NOW logic.');
    }

    // 4. Any other potential issue?
    // Maybe "compareceu" filter? The user didn't mention it for "Total", usually "Total" is all.
    // But let's check basic count.
}

run();
