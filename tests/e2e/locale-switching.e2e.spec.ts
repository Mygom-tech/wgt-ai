import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

/**
 * Regression guard for the header language switcher (next-intl, localePrefix
 * 'as-needed'). Protects against:
 *  - the dropdown silently collapsing to only the default locale, and
 *  - switching to a non-default locale "reverting" back to English.
 *
 * Assumes Site Settings has at least English + Latvian enabled.
 */
test.describe('Locale switching', () => {
  test.beforeEach(async ({ context }) => {
    // Start each test from a clean slate so a stale NEXT_LOCALE cookie can't
    // mask a regression.
    await context.clearCookies()
  })

  test('header dropdown lists more than just English', async ({ page }) => {
    await page.goto(BASE_URL)

    const trigger = page.locator('button[aria-haspopup="listbox"]').first()
    await trigger.click()

    const listbox = page.locator('[role="listbox"]').first()
    await expect(listbox.getByRole('option', { name: /English/i })).toBeVisible()
    await expect(listbox.getByRole('option', { name: /Latvian/i })).toBeVisible()
  })

  test('switching to Latvian lands on /lv and stays there', async ({ page }) => {
    await page.goto(BASE_URL)

    const trigger = page.locator('button[aria-haspopup="listbox"]').first()
    await trigger.click()
    await page
      .getByRole('option', { name: /Latvian/i })
      .first()
      .click()

    // next-intl forces the /lv prefix and updates the cookie; the URL must
    // settle on /lv rather than bouncing back to the default locale.
    await page.waitForURL(/\/lv(\/|$|\?)/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'lv')
  })

  test('switching back to English lands on the unprefixed root', async ({ page }) => {
    await page.goto(`${BASE_URL}/lv`)
    await expect(page.locator('html')).toHaveAttribute('lang', 'lv')

    const trigger = page.locator('button[aria-haspopup="listbox"]').first()
    await trigger.click()
    await page
      .getByRole('option', { name: /English/i })
      .first()
      .click()

    await page.waitForURL((url) => url.pathname === '/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })
})
