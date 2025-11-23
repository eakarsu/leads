import { test, expect } from '@playwright/test';

test.describe('Login Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
  });

  test('should display login page with all required fields', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('LeadGenFlow AI');
    await expect(page.locator('h2')).toContainText('Sign In');

    // Check all form fields are present
    await expect(page.getByLabel('Business Sector')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show all business sector options', async ({ page }) => {
    // Click on business sector dropdown
    await page.getByLabel('Business Sector').click();

    // Check all sector options are present
    const sectors = [
      'Home Services (HVAC, Roofing, Solar)',
      'Legal Services (Personal Injury, Family Law)',
      'Financial Services (Insurance, Mortgages)',
      'Real Estate',
      'Healthcare (Dentists, Plastic Surgery)',
      'B2B SaaS (Enterprise Software)',
      'Education (Courses, Colleges)',
      'Automotive (Sales, Services)',
      'General / Other'
    ];

    for (const sector of sectors) {
      await expect(page.getByRole('option', { name: sector })).toBeVisible();
    }
  });

  test('should display demo accounts information', async ({ page }) => {
    // Check demo accounts section
    await expect(page.locator('text=Demo Accounts')).toBeVisible();
    await expect(page.locator('text=john@acmehvac.com')).toBeVisible();
    await expect(page.locator('text=michael@smithlawfirm.com')).toBeVisible();
    await expect(page.locator('text=lisa@premierinsurance.com')).toBeVisible();
  });

  test('should require all fields before submitting', async ({ page }) => {
    // Try to submit without filling fields
    const submitButton = page.getByRole('button', { name: /sign in/i });
    await submitButton.click();

    // Check that form validation prevents submission
    await expect(page).toHaveURL(/login/);
  });

  test('should login successfully with Home Services account', async ({ page }) => {
    // Fill in the form
    await page.getByLabel('Business Sector').click();
    await page.getByRole('option', { name: /home services/i }).click();

    await page.getByLabel('Email').fill('john@acmehvac.com');
    await page.getByLabel('Password').fill('password123');

    // Submit the form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Verify we're on the dashboard
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should login successfully with Legal Services account', async ({ page }) => {
    await page.getByLabel('Business Sector').click();
    await page.getByRole('option', { name: /legal services/i }).click();

    await page.getByLabel('Email').fill('michael@smithlawfirm.com');
    await page.getByLabel('Password').fill('password123');

    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should login successfully with Financial Services account', async ({ page }) => {
    await page.getByLabel('Business Sector').click();
    await page.getByRole('option', { name: /financial services/i }).click();

    await page.getByLabel('Email').fill('lisa@premierinsurance.com');
    await page.getByLabel('Password').fill('password123');

    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should show business sector on leads page after login', async ({ page }) => {
    // Login with Home Services account
    await page.getByLabel('Business Sector').click();
    await page.getByRole('option', { name: /home services/i }).click();
    await page.getByLabel('Email').fill('john@acmehvac.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to leads page
    await page.goto('http://localhost:3000/leads');

    // Verify business sector is displayed
    await expect(page.locator('text=Business Sector: Home Services')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.getByLabel('Business Sector').click();
    await page.getByRole('option', { name: /home services/i }).click();

    await page.getByLabel('Email').fill('invalid@email.com');
    await page.getByLabel('Password').fill('wrongpassword');

    await page.getByRole('button', { name: /sign in/i }).click();

    // Should stay on login page
    await expect(page).toHaveURL(/login/);

    // Should show error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('should show error with wrong password', async ({ page }) => {
    await page.getByLabel('Business Sector').click();
    await page.getByRole('option', { name: /home services/i }).click();

    await page.getByLabel('Email').fill('john@acmehvac.com');
    await page.getByLabel('Password').fill('wrongpassword');

    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/login/);
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('should test all 8 business sector logins', async ({ page }) => {
    const accounts = [
      { sector: 'Home Services', email: 'john@acmehvac.com', expectedSector: 'Home Services' },
      { sector: 'Legal Services', email: 'michael@smithlawfirm.com', expectedSector: 'Legal Services' },
      { sector: 'Financial Services', email: 'lisa@premierinsurance.com', expectedSector: 'Financial Services' },
      { sector: 'Real Estate', email: 'jennifer@dreamhomerealty.com', expectedSector: 'Real Estate' },
      { sector: 'Healthcare', email: 'james@brightsmile.com', expectedSector: 'Healthcare' },
      { sector: 'B2B SaaS', email: 'alex@cloudflow.io', expectedSector: 'B2B Saas' },
      { sector: 'Education', email: 'maria@techacademy.edu', expectedSector: 'Education' },
      { sector: 'Automotive', email: 'robert@premierauto.com', expectedSector: 'Automotive' },
    ];

    for (const account of accounts) {
      console.log(`Testing login for ${account.sector}...`);

      // Go to login page
      await page.goto('http://localhost:3000/login');

      // Select business sector
      await page.getByLabel('Business Sector').click();
      await page.getByRole('option', { name: new RegExp(account.sector, 'i') }).click();

      // Fill credentials
      await page.getByLabel('Email').fill(account.email);
      await page.getByLabel('Password').fill('password123');

      // Submit
      await page.getByRole('button', { name: /sign in/i }).click();

      // Wait for dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });

      // Navigate to leads
      await page.goto('http://localhost:3000/leads');

      // Verify business sector is displayed
      await expect(page.locator(`text=Business Sector: ${account.expectedSector}`)).toBeVisible();

      // Logout
      await page.goto('http://localhost:3000/api/auth/signout');
      await page.getByRole('button', { name: /sign out/i }).click();

      console.log(`✓ ${account.sector} login successful`);
    }
  });
});
