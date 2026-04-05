/**
 * Test mode bypasses all Supabase auth and database calls.
 * Enable by setting NEXT_PUBLIC_TEST_MODE=true in .env.local
 */
export const TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE === "true";
