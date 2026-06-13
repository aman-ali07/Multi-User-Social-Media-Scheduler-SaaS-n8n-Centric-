import { test } from '@playwright/test'
import { authTest, expect } from './fixtures'

test.describe('Dashboard', () => {
  authTest('loads dashboard page', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('redirects when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/')
    await expect(page.locator('h1').first()).toBeVisible()
  })
})
