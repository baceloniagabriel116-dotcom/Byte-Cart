export default async function run(page, ui) {
  const results = {};

  // 1. Register flow (page currently at #register)
  await page.fill('#registerFirstName', 'QA');
  await page.fill('#registerLastName', 'Tester');
  await page.fill('#registerEmail', `qa${Date.now()}@test.com`);
  await page.fill('#registerPassword', 'test123');
  await page.fill('#registerConfirm', 'test123');
  await page.click('#registerFormElement button[type=submit]');
  await page.waitForTimeout(2500);
  results.afterRegisterUrl = page.url();
  results.registerError = await page.evaluate(() => document.querySelector('#registerError')?.innerText || '');
  results.userMenu = await page.evaluate(() => document.querySelector('#userMenu')?.innerText || '');
  results.authButtonsVisible = await page.evaluate(() => {
    const el = document.querySelector('#authButtons');
    return el ? getComputedStyle(el).display !== 'none' : null;
  });

  // 2. Logout then login flow
  await page.evaluate(() => { if (window.authManager) return authManager.logout(); });
  await page.goto(page.url().split('#')[0].replace(/[^/]*$/, 'login.html'));
  await page.waitForTimeout(1500);
  await page.click('#authTabs .auth-tab:first-child');
  await page.fill('#loginEmail', 'qa@test.com');
  await page.fill('#loginPassword', 'wrongpass');
  await page.click('#loginFormElement button[type=submit]');
  await page.waitForTimeout(2000);
  results.loginWrongError = await page.evaluate(() => document.querySelector('#loginError')?.innerText || '');
  return results;
}
