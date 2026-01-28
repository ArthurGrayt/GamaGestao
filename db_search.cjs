const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    const tables = ['financeiro_receitas', 'financeiro_despesas', 'financeiro_parcelas', 'agendamentos', 'exames'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*');
        if (error) continue;

        for (const row of data) {
            for (const key in row) {
                const val = row[key];
                if (typeof val === 'number') {
                    if (val.toFixed(2) === '16805.49' || val.toFixed(2) === '27974.04') {
                        console.log(`FOUND ${val} in ${table} row ${row.id} column ${key}`);
                    }
                }
            }
        }
    }
    console.log('Search complete.');
}

run();
