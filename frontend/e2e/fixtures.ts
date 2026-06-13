import { test as base } from '@playwright/test';

export const authTest = base.extend({
  page: async ({ page }, use) => {
    // Intercept Supabase Auth calls
    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '12345678-1234-1234-1234-123456789012',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'test@example.com',
            app_metadata: { provider: 'email' },
            user_metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        })
      });
    });

    // Also need to set fake local storage so supabase-js doesn't clear the session
    await page.addInitScript(() => {
      const session = {
        access_token: 'fake-token',
        refresh_token: 'fake-refresh',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: {
          id: '12345678-1234-1234-1234-123456789012',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'test@example.com',
          app_metadata: { provider: 'email' },
          user_metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
      window.localStorage.setItem('sb-local-auth-token', JSON.stringify(session));
    });

    await use(page);
  },
});
export { expect } from '@playwright/test';
