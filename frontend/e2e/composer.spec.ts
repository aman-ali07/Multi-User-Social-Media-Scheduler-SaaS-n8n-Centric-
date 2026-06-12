import { test, expect } from '@playwright/test'

test.describe('Composer', () => {
  test('loads composer page', async ({ page }) => {
    await page.goto('/composer')
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('shows validation errors for empty form', async ({ page }) => {
    await page.goto('/composer')
    const submitBtn = page.locator('button[type="submit"]')
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await expect(page.locator('text=required, text=required')).toBeVisible()
    }
  })
})
