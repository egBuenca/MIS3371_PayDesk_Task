// Drives the finished app in a real browser and captures the states
// the task sheet shows as "final output".
const { chromium } = require("playwright");
const path = require("path");
const OUT = path.join(__dirname, "shots");
const APP = "file://" + path.join(__dirname, "reference", "index.html");

(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const pg = await b.newPage({ viewport: { width: 1240, height: 980 },
                               deviceScaleFactor: 2 });
  const errs = [];
  pg.on("pageerror", e => errs.push(String(e).split("\n")[0]));
  const shot = async (name) => {
    await pg.waitForTimeout(250);
    await pg.screenshot({ path: path.join(OUT, name + ".png"), fullPage: true });
    console.log("  %s %s", name.padEnd(16), errs.length ? "JS ERROR: " + errs[0] : "clean");
  };

  await pg.goto(APP);
  await shot("01_empty");

  // client-side validation: leave fields bad and blur them
  await pg.fill("#payee", "B");
  await pg.locator("#payee").blur();
  await pg.fill("#amount", "-40");
  await pg.locator("#amount").blur();
  await pg.locator("#category").focus();
  await pg.locator("#category").blur();
  await shot("02_validation");

  // a clean payment that posts
  await pg.fill("#payee", "Bursar's Office");
  await pg.fill("#amount", "840.25");
  await pg.selectOption("#category", "tuition");
  await pg.fill("#reference", "Fall semester balance");
  await pg.click("#submitBtn");
  await pg.waitForTimeout(900);
  await shot("03_posted");

  // one that policy holds for review
  await pg.fill("#payee", "University Housing");
  await pg.fill("#amount", "6200");
  await pg.selectOption("#category", "housing");
  await pg.click("#submitBtn");
  await pg.waitForTimeout(900);
  await shot("04_held");

  // one the balance cannot cover
  await pg.selectOption("#account", "AID-1002");
  await pg.fill("#payee", "Campus Store");
  await pg.fill("#amount", "9500");
  await pg.selectOption("#category", "books");
  await pg.click("#submitBtn");
  await pg.waitForTimeout(900);
  await shot("05_declined");

  // the layer view
  await pg.check("#layerToggle");
  await shot("06_layers");

  // dark mode, narrow screen
  await pg.emulateMedia({ colorScheme: "dark" });
  await pg.uncheck("#layerToggle");
  await pg.setViewportSize({ width: 560, height: 1100 });
  await shot("07_dark_mobile");

  await b.close();
  if (errs.length) { console.log("ERRORS: " + errs.join(" | ")); process.exit(1); }
  console.log("7 screenshots, no JavaScript errors");
})();
