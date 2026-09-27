import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TEST_ADMIN_EMAIL || !TEST_ADMIN_PASSWORD) {
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD. Use a test project.');
  process.exit(1);
}
if (TEST_ADMIN_PASSWORD.length < 12) throw new Error('Use a password of at least 12 characters.');
const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const { error: schemaError } = await client.from('store_roles').select('user_id').limit(1);
if (schemaError) throw new Error('Apply catalog migrations before provisioning an administrator.');
const { data, error } = await client.auth.admin.createUser({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD, email_confirm: true });
if (error) throw error;
const { error: roleError } = await client.from('store_roles').insert({ user_id: data.user.id, role: 'admin' });
if (roleError) throw new Error(`User created (${data.user.id}), but role assignment failed. Retry role assignment through an authorized server.`);
const { data: verified, error: verifyError } = await client.auth.admin.getUserById(data.user.id);
const { data: role, error: readError } = await client.from('store_roles').select('role').eq('user_id', data.user.id).single();
if (verifyError || readError || !verified.user.email_confirmed_at || role?.role !== 'admin') throw new Error('Administrator verification failed.');
console.log(`Verified administrator: ${data.user.id}; email confirmed; role admin.`);
