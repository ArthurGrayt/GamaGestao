const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifySchema() {
    console.log('1. Fetching users to find valid IDs...');
    let { data: users, error: userError } = await supabase.from('users').select('user_id, username').limit(2);

    if (userError) {
        console.log('Could not select user_id, trying id...');
        const { data: users2, error: userError2 } = await supabase.from('users').select('id, username').limit(2);
        if (userError2) {
            console.error('Failed to fetch users:', userError2);
            return;
        }
        users = users2.map(u => ({ user_id: u.id, username: u.username }));
    }

    if (!users || users.length < 1) {
        console.error('No users found to test with.');
        return;
    }

    const testUser = users[0];
    const senderUser = users[0];
    console.log(`Using user: ${testUser.username} (${testUser.user_id})`);

    const testGoal = {
        id_meta: Math.floor(Math.random() * 1000000), // Try random integer for PK/ID
        destinatario_id: testUser.user_id,
        remetente_id: senderUser.user_id,
        tipo: 'TEST_TYPE',
        descricao: 'TEST_GOAL_SCHEMA_VERIFICATION',
        data_limite: new Date().toISOString()
    };

    console.log('2. Inserting test goal with id_meta...');
    const { data: inserted, error: insertError } = await supabase
        .from('metas_usuarios')
        .insert([testGoal])
        .select()
        .single();

    if (insertError) {
        console.error('Insert failed:', JSON.stringify(insertError, null, 2));
        return;
    }
    console.log('Insert success:', inserted);

    console.log('3. Updating data_entregue (Completion)...');
    const { error: updateError } = await supabase
        .from('metas_usuarios')
        .update({ data_entregue: new Date().toISOString() })
        .eq('id', inserted.id); // Check if 'id' is returned, or if we need to use 'id_meta'

    if (updateError) {
        console.error('Update failed:', updateError);
    } else {
        console.log('Update success.');
    }

    console.log('4. Cleaning up...');
    await supabase.from('metas_usuarios').delete().eq('id', inserted.id);
    console.log('Done.');
}

verifySchema();
