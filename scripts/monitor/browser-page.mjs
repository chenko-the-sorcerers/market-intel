export async function fetchWithBrowser(url, options = {}) {
  const playwrightResult = await tryPlaywright(url, options);
  if (playwrightResult) return playwrightResult;

  const seleniumResult = await trySelenium(url, options);
  if (seleniumResult) return seleniumResult;

  throw new Error(
    "Browser mode requires Playwright or Selenium. Install one locally, then rerun with --mode browser.",
  );
}

async function tryPlaywright(url, options) {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: options.headless !== false });
    const page = await browser.newPage({
      userAgent:
        options.userAgent ||
        "MarketIntelLocalMonitor/0.1 (+https://github.com/chenko-the-sorcerers/market-intel)",
    });
    await page.goto(url, { waitUntil: "networkidle", timeout: options.timeout || 30000 });
    const text = await page.content();
    const finalUrl = page.url();
    await browser.close();
    return { url: finalUrl, contentType: "text/html", text };
  } catch {
    return null;
  }
}

async function trySelenium(url, options) {
  try {
    const webdriver = await import("selenium-webdriver");
    const chrome = await import("selenium-webdriver/chrome.js");
    const chromeOptions = new chrome.Options();
    if (options.headless !== false) chromeOptions.addArguments("--headless=new");
    chromeOptions.addArguments("--disable-gpu", "--no-sandbox");
    const driver = await new webdriver.Builder()
      .forBrowser("chrome")
      .setChromeOptions(chromeOptions)
      .build();
    await driver.get(url);
    await driver.sleep(options.settleMs || 2500);
    const text = await driver.getPageSource();
    const finalUrl = await driver.getCurrentUrl();
    await driver.quit();
    return { url: finalUrl, contentType: "text/html", text };
  } catch {
    return null;
  }
}
