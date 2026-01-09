
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    console.log("Testing column 'nome'...");
    const { data: dataNome, error: errorNome } = await supabase.from('perfil_med').select('nome');
    if (errorNome) {
        console.error("Column 'nome' error:", errorNome.message);
    } else {
        console.log("Column 'nome' exists!");
    }

    console.log("Testing column 'acesso'...");
    const { data: dataAcesso, error: errorAcesso } = await supabase.from('perfil_med').select('acesso');
    if (errorAcesso) {
        console.error("Column 'acesso' error:", errorAcesso.message);
    } else {
        console.log("Column 'acesso' exists!");
    }
}

run();
