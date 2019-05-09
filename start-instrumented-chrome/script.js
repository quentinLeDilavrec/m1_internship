// Node.js version: 8.9.4
const puppeteer = require('puppeteer'); // version 1.0.0

(async () => {
  // Prevent Puppeteer from showing the "Chrome is being controlled by automated test
  // software" prompt, but otherwise use Puppeteer's default args.
  const options = {headless: false};
  const browser = await puppeteer.launch({...options, args: puppeteer.defaultArgs(options)});
  const page = await browser.newPage();
  //const devtoolsProtocolClient = await page.target().createCDPSession();
  //await devtoolsProtocolClient.send('Overlay.setShowFPSCounter', { show: true });
  await page.goto('http://localhost:8888');
  await page.evaluate(() => {
    console.log("written in fps.js")
  });
})();