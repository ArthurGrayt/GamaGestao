const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function probeSpecific() {
    const testData = {
        colaborador: 'Test',
        tipo: 'Test',
        descricao: 'Test',
        is_completed: false,
        gut_g: 1,
        gut_u: 1,
        gut_t: 1
    };

    const { data, error } = await supabase.from('metas_usuarios').insert([testData]).select();

    if (error) {
        console.log(`Specific probe failed: ${error.message}`);
    } else {
        console.log('Columns colaborador, tipo, descricao, is_completed, gut_g, gut_u, gut_t exist!');
        if (data && data[0] && data[0].id) {
            await supabase.from('metas_usuarios').delete().eq('id', data[0].id);
        }
    }
}

probeSpecific();
