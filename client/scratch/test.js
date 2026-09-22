const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[PAGE ${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  page.on('pageerror', error => {
    console.log('[PAGE ERROR UNCAUGHT]', error.message);
  });
  page.on('requestfailed', request => {
    console.log(`[NETWORK FAILED] ${request.url()} - ${request.failure().errorText}`);
  });
  page.on('response', response => {
    if (!response.ok()) {
      console.log(`[NETWORK ERROR] ${response.url()} - ${response.status()}`);
    }
  });

  console.log('Navigating to http://localhost:3002...');
  await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });
  
  console.log('Typing credentials...');
  const inputs = await page.$$('input');
  if (inputs.length >= 2) {
    // Clear inputs first
    await inputs[0].click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await inputs[0].type('a');
    
    await inputs[1].click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await inputs[1].type('aa');
    
    console.log('Submitting form...');
    await page.click('button[type="submit"]');
    
    // Wait for either navigation or networkidle
    try {
      await page.waitForNavigation({ timeout: 5000, waitUntil: 'networkidle0' });
      console.log('Navigation happened!');
    } catch (e) {
      console.log('No navigation within 5 seconds, waiting for network idle...');
      await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log('Taking screenshot of post-login state...');
    await page.screenshot({ path: 'screenshot_post_login_debug.png' });
  } else {
    console.log('Inputs not found!');
  }
  
  console.log('Done.');
  await browser.close();
})();
