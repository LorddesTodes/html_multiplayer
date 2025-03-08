const { Worker, isMainThread, parentPort } = require('worker_threads');
const puppeteer = require('puppeteer');
async function startCCTVClient(web) {
    // Launch headless browser
    const browser = await puppeteer.launch({
        headless: true, // Run without UI
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  
    const page = await browser.newPage();
  
    // Open the game in a virtual browser
    await page.goto(web); // Change this to your game URL
  
    // Wait for the game to load
    await page.waitForSelector('canvas');
    page.keyboard.type("puppy_cctv")
    // Function to run the CCTV export periodically
    async function sendCCTV() {
        try {
            await page.evaluate(() => {
                //addBlock(0, 6, 0, 2, 2, 2, true, "sus",0xff0000,"van:air",false,true,true)
                exportCCTV(); // Calls your CCTV export function
            });
  
            console.log('CCTV frame sent.');
        } catch (err) {
            console.error('Error sending CCTV:', err);
        }
    }
  
    // Run CCTV export every 2 seconds (adjust as needed)
    //setInterval(sendCCTV, 2000);
}
parentPort.on('message', (message) => {
    if (message.type === 'connect') {
      startCCTVClient(message.web);
    }
});
parentPort.postMessage("started")