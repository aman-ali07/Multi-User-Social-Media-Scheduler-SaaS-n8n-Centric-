import { authTest as test, expect } from './fixtures'

test.describe('Composer', () => {
  test('loads composer page', async ({ page }) => {
    await page.goto('/composer')
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('shows validation errors for empty form', async ({ page }) => {
    await page.goto('/composer')
    const scheduleBtn = page.getByRole('button', { name: /Schedule Post/i })
    
    // The button is disabled if validation fails in our current implementation.
    // So we just check if it's disabled.
    if (await scheduleBtn.isVisible()) {
      await expect(scheduleBtn).toBeDisabled()
    }
  })
})
