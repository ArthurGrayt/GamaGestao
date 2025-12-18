
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function probe() {
    console.log('--- USERS TABLE ---');
    const { data: users, error: usersError } = await supabase.from('users').select('*').limit(3);
    if (usersError) console.error('Users Error:', usersError);
    else console.log('Users:', users);

    console.log('--- PONTO_REGISTROS TABLE ---');
    const { data: points, error: pointsError } = await supabase.from('ponto_registros').select('*').limit(1);
    if (pointsError) console.error('Points Error:', pointsError);
    else console.log('Points:', points);
}

probe();
