const { join } = require("path");

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
    // Changes the cache location for Puppeteer.
    cacheDirectory: join(__dirname, ".cache", "puppeteer"),
    // Tofu: on Vercel's build machine, where Tofu builds this app, the PDF
    // route runs @sparticuz/chromium (services/invoice/server/browser.ts) and
    // never this Chrome, so the install skips downloading it there and no
    // longer depends on that download. Everywhere else it downloads as before.
    skipDownload: Boolean(process.env.VERCEL),
};
