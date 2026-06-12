import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('landing page has auth links', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href="/auth/login"]').first()).toBeVisible()
    await expect(page.locator('a[href="/auth/register"]').first()).toBeVisible()
  })
})
