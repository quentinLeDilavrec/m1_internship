const puppeteer = require('puppeteer'); // version 1.0.0

(async () => {
  const options = {headless: false};
  const browser = await puppeteer.launch({...options, args: puppeteer.defaultArgs(options)});
  const page = await browser.newPage();
  //const devtoolsProtocolClient = await page.target().createCDPSession();
  //await devtoolsProtocolClient.send('Overlay.setShowFPSCounter', { show: true });
  await page.goto('http://localhost:8888');
  await page.evaluate(() => {
    console.log("written in the puppeteer")
  });
})();