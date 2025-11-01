const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const axeSource = require('axe-core').source;

(async () => {
  const url = process.argv[2] || 'http://localhost:5174/';
  const outPath = path.join(__dirname, '..', 'accessibility_report_axe.json');

  console.log('Running axe on', url);

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Inject axe
    await page.evaluate(axeSource);

    // Run axe
    const results = await page.evaluate(async () => {
      return await axe.run(document, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa']
        }
      });
    });

    fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');

    console.log('Axe results written to', outPath);
  } catch (err) {
    console.error('Error running axe:', err);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();