
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function probe() {
    const { data: users, error } = await supabase.from('users').select('*').limit(1);
    if (users && users.length > 0) {
        console.log('User Keys:', Object.keys(users[0]));
        console.log('User Sample:', users[0]);
    } else {
        console.log('No users found or error:', error);
    }
}

probe();
