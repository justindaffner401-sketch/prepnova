/**
 * Test setup. Provides the environment variables the modules under test read at
 * import time. These are fake values — no test ever calls a real service.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
process.env.NEXT_PUBLIC_SITE_URL ??= "https://test.campvoice.com";
