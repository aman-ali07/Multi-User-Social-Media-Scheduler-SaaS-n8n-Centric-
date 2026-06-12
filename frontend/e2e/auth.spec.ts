import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('loads landing page with login button', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1, h2').first()).toBeVisible()
    await expect(page.locator('a[href*="login"], button:has-text("Sign In")').first()).toBeVisible()
  })

  test('login page renders sign-in form', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('redirects unauthenticated to landing page', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/')
    await expect(page.locator('h1').first()).toBeVisible()
  })
})
