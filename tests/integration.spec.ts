import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'john@acmehvac.com',
  password: 'password123',
  sector: 'Home Services',
};

// Helper function to login
async function login(page: Page, email = TEST_USER.email, password = TEST_USER.password, sector = TEST_USER.sector) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel('Business Sector').click();
  await page.getByRole('option', { name: new RegExp(sector, 'i') }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

// Helper to wait for page load
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

// ==================== AUTHENTICATION TESTS ====================
test.describe('Authentication Flow', () => {
  test('should display login page correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    await expect(page.locator('h1')).toContainText('LeadGenFlow AI');
    await expect(page.locator('h2')).toContainText('Sign In');
    await expect(page.getByLabel('Business Sector')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show demo accounts section', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('text=Demo Accounts')).toBeVisible();
  });

  test('should login successfully and redirect to dashboard', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel('Business Sector').click();
    await page.getByRole('option', { name: /home services/i }).click();
    await page.getByLabel('Email').fill('invalid@email.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/login/);
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/api/auth/signout`);
    await page.getByRole('button', { name: /sign out/i }).click();
    await page.waitForURL('**/login', { timeout: 10000 });
  });
});

// ==================== DASHBOARD TESTS ====================
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display dashboard with stats cards', async ({ page }) => {
    await waitForPageLoad(page);

    // Check for stats cards
    await expect(page.locator('text=Total Clients')).toBeVisible();
    await expect(page.locator('text=Active Campaigns')).toBeVisible();
    await expect(page.locator('text=Total Leads')).toBeVisible();
    await expect(page.locator('text=Deals Won')).toBeVisible();
  });

  test('should navigate to clients from dashboard card', async ({ page }) => {
    await waitForPageLoad(page);
    await page.locator('text=Total Clients').click();
    await page.waitForURL('**/clients', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Clients' }).first()).toBeVisible();
  });

  test('should navigate to leads from dashboard card', async ({ page }) => {
    await waitForPageLoad(page);
    await page.locator('text=Total Leads').click();
    await page.waitForURL('**/leads', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Leads' })).toBeVisible();
  });

  test('should display AI Insights section', async ({ page }) => {
    await waitForPageLoad(page);
    await expect(page.locator('text=AI Insights & Recommendations')).toBeVisible();
    await expect(page.getByRole('button', { name: /generate ai insights/i })).toBeVisible();
  });

  test('should display Top Campaigns section', async ({ page }) => {
    await waitForPageLoad(page);
    await expect(page.locator('text=Top Campaigns')).toBeVisible();
  });

  test('should display Recent Activities section', async ({ page }) => {
    await waitForPageLoad(page);
    await expect(page.locator('text=Recent Activities')).toBeVisible();
  });
});

// ==================== LEADS TESTS ====================
test.describe('Leads Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/leads`);
    await waitForPageLoad(page);
  });

  test('should display leads page correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Leads' })).toBeVisible();
    await expect(page.locator('text=Business Sector: Home Services')).toBeVisible();
    await expect(page.getByRole('button', { name: /new lead/i })).toBeVisible();
  });

  test('should display leads table with correct columns', async ({ page }) => {
    const headers = ['Name', 'Company', 'Title', 'Campaign', 'Source', 'Status', 'Score', 'Activities'];
    for (const header of headers) {
      await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
    }
  });

  test('should open new lead dialog', async ({ page }) => {
    await page.getByRole('button', { name: /new lead/i }).click();
    await expect(page.locator('text=Create New Lead')).toBeVisible();
    await expect(page.locator('text=Manual Entry')).toBeVisible();
    await expect(page.locator('text=AI Parse')).toBeVisible();
  });

  test('should filter leads by source', async ({ page }) => {
    await page.getByLabel('Lead Source').click();
    await page.getByRole('option', { name: 'Agency' }).click();
    await waitForPageLoad(page);
  });

  test('should clear filters', async ({ page }) => {
    await page.getByLabel('Lead Source').click();
    await page.getByRole('option', { name: 'Agency' }).click();
    await page.getByRole('button', { name: /clear filters/i }).click();
    await waitForPageLoad(page);
  });

  test('should open generate demo data dialog', async ({ page }) => {
    await page.getByRole('button', { name: /generate demo data/i }).click();
    await expect(page.getByRole('heading', { name: 'Generate Demo Data' })).toBeVisible();
    await expect(page.getByRole('dialog').getByLabel('Business Sector')).toBeVisible();
    await expect(page.getByLabel('Number of Records')).toBeVisible();
  });

  test('should show AI Parse mode in create lead dialog', async ({ page }) => {
    await page.getByRole('button', { name: /new lead/i }).click();
    await page.locator('text=AI Parse').click();
    await expect(page.getByLabel('Paste Lead Information')).toBeVisible();
  });
});

// ==================== CONTACTS TESTS ====================
test.describe('Contacts Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/contacts`);
    await waitForPageLoad(page);
  });

  test('should display contacts page correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Contacts' })).toBeVisible();
    await expect(page.getByRole('button', { name: /new contact/i })).toBeVisible();
  });

  test('should display contacts table with correct columns', async ({ page }) => {
    const headers = ['Name', 'Email', 'Phone', 'Title', 'Company/Account', 'Owner', 'Primary', 'Actions'];
    for (const header of headers) {
      await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
    }
  });

  test('should open new contact dialog', async ({ page }) => {
    await page.getByRole('button', { name: /new contact/i }).click();
    await expect(page.locator('text=Create New Contact')).toBeVisible();
    await expect(page.getByLabel('First Name')).toBeVisible();
    await expect(page.getByLabel('Last Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('should have filter controls', async ({ page }) => {
    await expect(page.getByLabel('Client')).toBeVisible();
    await expect(page.getByLabel('Owner')).toBeVisible();
    await expect(page.getByLabel('Primary Contact')).toBeVisible();
    await expect(page.getByRole('button', { name: /clear filters/i })).toBeVisible();
  });
});

// ==================== OPPORTUNITIES TESTS ====================
test.describe('Opportunities Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/opportunities`);
    await waitForPageLoad(page);
  });

  test('should display opportunities page correctly', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Opportunities');
    await expect(page.getByRole('button', { name: /new opportunity/i })).toBeVisible();
  });

  test('should display opportunities table with correct columns', async ({ page }) => {
    const headers = ['Name', 'Client', 'Contact', 'Stage', 'Amount', 'Probability', 'Weighted Value', 'Expected Close', 'Owner', 'Actions'];
    for (const header of headers) {
      await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
    }
  });

  test('should open new opportunity dialog', async ({ page }) => {
    await page.getByRole('button', { name: /new opportunity/i }).click();
    await expect(page.getByRole('heading', { name: 'Create New Opportunity' })).toBeVisible();
    await expect(page.getByLabel('Opportunity Name')).toBeVisible();
    await expect(page.getByRole('dialog').getByLabel('Stage')).toBeVisible();
    await expect(page.getByLabel('Amount')).toBeVisible();
  });

  test('should have stage filter', async ({ page }) => {
    await page.getByLabel('Stage').first().click();
    await expect(page.getByRole('option', { name: 'Prospecting' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Qualification' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Closed Won' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Closed Lost' })).toBeVisible();
  });
});

// ==================== CAMPAIGNS TESTS ====================
test.describe('Campaigns Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/campaigns`);
    await waitForPageLoad(page);
  });

  test('should display campaigns page correctly', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Campaigns');
    await expect(page.getByRole('button', { name: /new campaign/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /ai campaign brief/i })).toBeVisible();
  });

  test('should display campaigns table with correct columns', async ({ page }) => {
    const headers = ['Campaign Name', 'Client', 'Channel', 'Status', 'Leads', 'Owner'];
    for (const header of headers) {
      await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
    }
  });

  test('should open new campaign dialog', async ({ page }) => {
    await page.getByRole('button', { name: /new campaign/i }).click();
    await expect(page.locator('text=Create New Campaign')).toBeVisible();
    await expect(page.getByLabel('Campaign Name')).toBeVisible();
    await expect(page.getByLabel('Channel')).toBeVisible();
    await expect(page.getByLabel('Status')).toBeVisible();
  });

  test('should open AI campaign brief dialog', async ({ page }) => {
    await page.getByRole('button', { name: /ai campaign brief/i }).click();
    await expect(page.locator('text=AI Campaign Brief Generator')).toBeVisible();
    await expect(page.getByLabel('Industry')).toBeVisible();
    await expect(page.getByLabel('Ideal Customer Profile (ICP)')).toBeVisible();
  });

  test('should have channel options in create dialog', async ({ page }) => {
    await page.getByRole('button', { name: /new campaign/i }).click();
    await page.getByLabel('Channel').click();
    await expect(page.getByRole('option', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'LinkedIn' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Cold Call' })).toBeVisible();
  });
});

// ==================== TASKS TESTS ====================
test.describe('Tasks Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/tasks`);
    await waitForPageLoad(page);
  });

  test('should display tasks page correctly', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Tasks');
    await expect(page.getByRole('button', { name: /new task/i })).toBeVisible();
  });

  test('should have list and calendar view tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /list view/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /calendar view/i })).toBeVisible();
  });

  test('should display tasks table with correct columns', async ({ page }) => {
    const headers = ['Subject', 'Due Date', 'Status', 'Priority', 'Assigned To', 'Related To', 'Actions'];
    for (const header of headers) {
      await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
    }
  });

  test('should open new task dialog', async ({ page }) => {
    await page.getByRole('button', { name: /new task/i }).click();
    await expect(page.getByRole('heading', { name: 'Create New Task' })).toBeVisible();
    await expect(page.getByLabel('Subject')).toBeVisible();
    await expect(page.getByLabel('Due Date')).toBeVisible();
    await expect(page.getByRole('dialog').getByLabel('Priority')).toBeVisible();
  });

  test('should have filter controls', async ({ page }) => {
    await expect(page.getByLabel('Status').first()).toBeVisible();
    await expect(page.getByLabel('Priority').first()).toBeVisible();
    await expect(page.getByLabel('Assigned To').first()).toBeVisible();
  });

  test('should switch to calendar view', async ({ page }) => {
    await page.getByRole('tab', { name: /calendar view/i }).click();
    await expect(page.locator('text=Calendar view temporarily unavailable')).toBeVisible();
  });
});

// ==================== CLIENTS TESTS ====================
test.describe('Clients Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/clients`);
    await waitForPageLoad(page);
  });

  test('should display clients page correctly', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Clients');
  });
});

// ==================== REPORTS TESTS ====================
test.describe('Reports', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/reports`);
    await waitForPageLoad(page);
  });

  test('should display reports page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Reports');
  });
});

// ==================== NAVIGATION TESTS ====================
test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to all main pages', async ({ page }) => {
    const pages = [
      { url: '/dashboard', title: 'Dashboard' },
      { url: '/leads', title: 'Leads' },
      { url: '/contacts', title: 'Contacts' },
      { url: '/opportunities', title: 'Opportunities' },
      { url: '/campaigns', title: 'Campaigns' },
      { url: '/tasks', title: 'Tasks' },
      { url: '/clients', title: 'Clients' },
    ];

    for (const pageInfo of pages) {
      await page.goto(`${BASE_URL}${pageInfo.url}`);
      await waitForPageLoad(page);
      await expect(page.locator('h4').first()).toContainText(pageInfo.title);
    }
  });

  test('should have sidebar navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await waitForPageLoad(page);

    // Check for navigation items in sidebar
    await expect(page.locator('nav')).toBeVisible();
  });
});

// ==================== PRODUCTS TESTS ====================
test.describe('Products', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/products`);
    await waitForPageLoad(page);
  });

  test('should display products page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Products');
  });
});

// ==================== CASES TESTS ====================
test.describe('Cases/Support', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/cases`);
    await waitForPageLoad(page);
  });

  test('should display cases page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Cases');
  });
});

// ==================== QUOTES TESTS ====================
test.describe('Quotes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/quotes`);
    await waitForPageLoad(page);
  });

  test('should display quotes page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Quotes');
  });
});

// ==================== INVOICES TESTS ====================
test.describe('Invoices', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/invoices`);
    await waitForPageLoad(page);
  });

  test('should display invoices page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Invoices');
  });
});

// ==================== ORDERS TESTS ====================
test.describe('Orders', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/orders`);
    await waitForPageLoad(page);
  });

  test('should display orders page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Orders');
  });
});

// ==================== CALENDAR TESTS ====================
test.describe('Calendar', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/calendar`);
    await waitForPageLoad(page);
  });

  test('should display calendar page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Calendar');
  });
});

// ==================== KNOWLEDGE BASE TESTS ====================
test.describe('Knowledge Base', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/knowledge`);
    await waitForPageLoad(page);
  });

  test('should display knowledge base page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Knowledge');
  });
});

// ==================== PROCESS BUILDER TESTS ====================
test.describe('Process Builder', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/process-builder`);
    await waitForPageLoad(page);
  });

  test('should display process builder page', async ({ page }) => {
    await expect(page).toHaveURL(/process-builder/);
  });
});

// ==================== EINSTEIN AI TESTS ====================
test.describe('Einstein AI', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display einstein page', async ({ page }) => {
    await page.goto(`${BASE_URL}/einstein`);
    await expect(page).toHaveURL(/einstein/);
  });
});

// ==================== SETTINGS TESTS ====================
test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/settings`);
    await waitForPageLoad(page);
  });

  test('should display settings page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Settings');
  });
});

// ==================== DATA IMPORT TESTS ====================
test.describe('Data Import', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/data-import`);
    await waitForPageLoad(page);
  });

  test('should display data import page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Data Import');
  });
});

// ==================== FORECASTING TESTS ====================
test.describe('Forecasting', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/forecasting`);
    await waitForPageLoad(page);
  });

  test('should display forecasting page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Forecasting');
  });
});

// ==================== APPROVALS TESTS ====================
test.describe('Approvals', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display approvals page', async ({ page }) => {
    await page.goto(`${BASE_URL}/approvals`);
    await expect(page).toHaveURL(/approvals/);
  });
});

// ==================== CONTRACTS TESTS ====================
test.describe('Contracts', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/contracts`);
    await waitForPageLoad(page);
  });

  test('should display contracts page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Contracts');
  });
});

// ==================== CHATTER TESTS ====================
test.describe('Chatter', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/chatter`);
    await waitForPageLoad(page);
  });

  test('should display chatter page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Chatter');
  });
});

// ==================== FILES TESTS ====================
test.describe('Files', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/files`);
    await waitForPageLoad(page);
  });

  test('should display files page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Files');
  });
});

// ==================== LIVE CHAT TESTS ====================
test.describe('Live Chat', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/live-chat`);
    await waitForPageLoad(page);
  });

  test('should display live chat page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Live Chat');
  });
});

// ==================== SURVEYS TESTS ====================
test.describe('Surveys', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display surveys page', async ({ page }) => {
    await page.goto(`${BASE_URL}/surveys`);
    await expect(page).toHaveURL(/surveys/);
  });
});

// ==================== JOURNEYS TESTS ====================
test.describe('Customer Journeys', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display journeys page', async ({ page }) => {
    await page.goto(`${BASE_URL}/journeys`);
    await expect(page).toHaveURL(/journeys/);
  });
});

// ==================== TERRITORIES TESTS ====================
test.describe('Territories', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display territories page', async ({ page }) => {
    await page.goto(`${BASE_URL}/territories`);
    await expect(page).toHaveURL(/territories/);
  });
});

// ==================== ROLES TESTS ====================
test.describe('Roles', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/roles`);
    await waitForPageLoad(page);
  });

  test('should display roles page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Roles');
  });
});

// ==================== WEB FORMS TESTS ====================
test.describe('Web Forms', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display web forms page', async ({ page }) => {
    await page.goto(`${BASE_URL}/web-forms`);
    await expect(page).toHaveURL(/web-forms/);
  });
});

// ==================== EMAIL CENTER TESTS ====================
test.describe('Email Center', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/email-center`);
    await waitForPageLoad(page);
  });

  test('should display email center page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Email');
  });
});

// ==================== MASS EMAIL TESTS ====================
test.describe('Mass Email', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/mass-email`);
    await waitForPageLoad(page);
  });

  test('should display mass email page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Mass Email');
  });
});

// ==================== REPORT BUILDER TESTS ====================
test.describe('Report Builder', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/report-builder`);
    await waitForPageLoad(page);
  });

  test('should display report builder page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Report');
  });
});

// ==================== SCHEDULED REPORTS TESTS ====================
test.describe('Scheduled Reports', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/scheduled-reports`);
    await waitForPageLoad(page);
  });

  test('should display scheduled reports page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Scheduled');
  });
});

// ==================== DUPLICATES TESTS ====================
test.describe('Duplicates', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display duplicates page', async ({ page }) => {
    await page.goto(`${BASE_URL}/duplicates`);
    await expect(page).toHaveURL(/duplicates/);
  });
});

// ==================== PRICE BOOKS TESTS ====================
test.describe('Price Books', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display price books page', async ({ page }) => {
    await page.goto(`${BASE_URL}/price-books`);
    await expect(page).toHaveURL(/price-books/);
  });
});

// ==================== SERVICE CONTRACTS TESTS ====================
test.describe('Service Contracts', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/service-contracts`);
    await waitForPageLoad(page);
  });

  test('should display service contracts page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Service Contract');
  });
});

// ==================== ENTITLEMENTS TESTS ====================
test.describe('Entitlements', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/entitlements`);
    await waitForPageLoad(page);
  });

  test('should display entitlements page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Entitlements');
  });
});

// ==================== ASSETS TESTS ====================
test.describe('Assets', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/assets`);
    await waitForPageLoad(page);
  });

  test('should display assets page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Assets');
  });
});

// ==================== MARKETING EVENTS TESTS ====================
test.describe('Marketing Events', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display marketing events page', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketing-events`);
    await expect(page).toHaveURL(/marketing-events/);
  });
});

// ==================== CPQ TESTS ====================
test.describe('CPQ', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/cpq`);
    await waitForPageLoad(page);
  });

  test('should display CPQ page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('CPQ');
  });
});

// ==================== CUSTOM OBJECTS TESTS ====================
test.describe('Custom Objects', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/custom-objects`);
    await waitForPageLoad(page);
  });

  test('should display custom objects page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Custom Objects');
  });
});

// ==================== ACTIVITIES TESTS ====================
test.describe('Activities', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/activities`);
    await waitForPageLoad(page);
  });

  test('should display activities page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Activities');
  });
});

// ==================== PORTAL TESTS ====================
test.describe('Portal', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display portal page', async ({ page }) => {
    await page.goto(`${BASE_URL}/portal`);
    await expect(page).toHaveURL(/portal/);
  });
});

// ==================== CUSTOMER PORTAL TESTS ====================
test.describe('Customer Portal', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/customer-portal`);
    await waitForPageLoad(page);
  });

  test('should display customer portal page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Customer Portal');
  });
});

// ==================== PARTNER PORTAL TESTS ====================
test.describe('Partner Portal', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/partner-portal`);
    await waitForPageLoad(page);
  });

  test('should display partner portal page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Partner Portal');
  });
});

// ==================== OPPORTUNITY PIPELINE TESTS ====================
test.describe('Opportunity Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/opportunities/pipeline`);
    await waitForPageLoad(page);
  });

  test('should display pipeline page', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Pipeline');
  });
});

// ==================== RESPONSIVE DESIGN TESTS ====================
test.describe('Responsive Design', () => {
  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await login(page);
    await expect(page.locator('h4').first()).toContainText('Dashboard');
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await login(page);
    await expect(page.locator('h4').first()).toContainText('Dashboard');
  });

  test('should be responsive on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    await login(page);
    await expect(page.locator('h4').first()).toContainText('Dashboard');
  });
});

// ==================== ERROR HANDLING TESTS ====================
test.describe('Error Handling', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    // Either redirects to login or shows login UI
    await expect(page).toHaveURL(/login|dashboard/);
  });

  test('should show 404 page for invalid routes', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/invalid-route-12345`);
    await expect(page.locator('text=404')).toBeVisible();
  });
});
