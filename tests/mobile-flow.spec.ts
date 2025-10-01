import { test, expect, devices } from '@playwright/test'

test.use({
  ...devices['iPhone 14'],
})

test.describe('Mobile-First User Flow', () => {
  test('complete user journey: auth → create project → edit → profile', async ({ page }) => {
    // Navigate to app
    await page.goto('/')

    // Should redirect to auth or show sign in
    await page.waitForLoadState('networkidle')

    // Test Sign Up Flow
    await page.goto('/auth')
    
    // Fill signup form
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    
    await page.fill('input[type="email"]', testEmail)
    await page.fill('input[type="password"]', testPassword)
    
    // Click signup button
    await page.click('button:has-text("Sign Up")')
    
    // Wait for redirect after signup
    await page.waitForURL(/\/(projects|)/, { timeout: 10000 })

    // Navigate to create project
    await page.goto('/projects/new')
    
    // Fill project form
    await page.fill('input[placeholder*="project title"]', 'Test Mobile Project')
    await page.selectOption('select', 'pre')
    await page.fill('input[type="number"]', '100000')
    
    // Submit project form
    await page.click('button[type="submit"]')
    
    // Wait for redirect to projects list
    await page.waitForURL('/projects', { timeout: 10000 })
    
    // Verify project appears in list
    await expect(page.locator('text=Test Mobile Project')).toBeVisible()
    
    // Click on project to view details
    await page.click('text=Test Mobile Project')
    
    // Wait for project detail page
    await page.waitForURL(/\/projects\/.*[^\/edit]$/)
    
    // Click edit button
    await page.click('button:has-text("Edit Project")')
    
    // Wait for edit page
    await page.waitForURL(/\/projects\/.*\/edit/)
    
    // Update project title
    await page.fill('input[placeholder*="project title"]', 'Updated Mobile Project')
    
    // Save changes
    await page.click('button[type="submit"]')
    
    // Wait for redirect back to detail page
    await page.waitForURL(/\/projects\/.*[^\/edit]$/)
    
    // Verify updated title
    await expect(page.locator('text=Updated Mobile Project')).toBeVisible()
    
    // Navigate to profile via bottom nav
    await page.click('nav[role="navigation"] a[href="/profile"]')
    
    // Wait for profile page
    await page.waitForURL('/profile')
    
    // Fill profile form
    await page.fill('input[placeholder*="name"]', 'Test User')
    
    // Save profile
    await page.click('button:has-text("Save")')
    
    // Verify success message
    await expect(page.locator('text=Profile updated')).toBeVisible({ timeout: 5000 })
    
    // Test bottom navigation
    const bottomNav = page.locator('nav[role="navigation"]')
    await expect(bottomNav).toBeVisible()
    
    // Verify all nav items are present
    await expect(bottomNav.locator('a[href="/"]')).toBeVisible()
    await expect(bottomNav.locator('a[href="/projects"]')).toBeVisible()
    await expect(bottomNav.locator('a[href="/projects/new"]')).toBeVisible()
    await expect(bottomNav.locator('a[href="/profile"]')).toBeVisible()
    
    // Test navigation to home
    await bottomNav.locator('a[href="/"]').click()
    await page.waitForURL('/')
    
    // Test tap targets (minimum 44x44px for mobile)
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const box = await buttons.nth(i).boundingBox()
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    }
  })

  test('mobile navigation and responsive design', async ({ page }) => {
    await page.goto('/')
    
    // Verify viewport is mobile
    const viewportSize = page.viewportSize()
    expect(viewportSize?.width).toBeLessThanOrEqual(390) // iPhone 14 width
    
    // Bottom nav should be sticky and visible
    const bottomNav = page.locator('nav[role="navigation"]')
    await expect(bottomNav).toBeVisible()
    
    // Check bottom nav is at bottom
    const navBox = await bottomNav.boundingBox()
    const viewportHeight = viewportSize?.height || 844
    if (navBox) {
      expect(navBox.y + navBox.height).toBeGreaterThan(viewportHeight - 100)
    }
    
    // Test header is visible
    const header = page.locator('header').first()
    await expect(header).toBeVisible()
  })

  test('file upload on mobile', async ({ page }) => {
    // Login first
    await page.goto('/auth')
    await page.fill('input[type="email"]', `test-${Date.now()}@example.com`)
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button:has-text("Sign Up")')
    await page.waitForURL(/\/(projects|)/, { timeout: 10000 })
    
    // Go to profile
    await page.goto('/profile')
    
    // Test avatar upload
    const fileInput = page.locator('input[type="file"]').first()
    await expect(fileInput).toBeAttached()
    
    // Check accept attribute for images
    const acceptAttr = await fileInput.getAttribute('accept')
    expect(acceptAttr).toContain('image')
  })

  test('mobile gestures and scrolling', async ({ page }) => {
    await page.goto('/projects')
    
    // Test scroll behavior
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)
    
    // Verify bottom nav still visible after scroll
    const bottomNav = page.locator('nav[role="navigation"]')
    await expect(bottomNav).toBeVisible()
    
    // Test pull to refresh doesn't break layout
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(300)
  })
})
