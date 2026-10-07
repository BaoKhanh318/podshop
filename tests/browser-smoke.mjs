import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.TEST_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const pass = (message) => console.log(`PASS ${message}`);
const screenshots = process.env.SCREENSHOT_DIR || "/tmp/podshop-shots";
await mkdir(screenshots, { recursive: true });
const readCart = () =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem("muc.cart.v1"))?.items || [],
  );
const waitVisible = (locator) => locator.waitFor({ state: "visible" });

try {
  await page.goto(baseURL, { waitUntil: "networkidle" });
  assert.equal(await page.locator(".product-card").count(), 8);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.screenshot({
    path: `${screenshots}/desktop-final.png`,
    fullPage: true,
  });
  await page
    .locator(".category-filters")
    .getByRole("button", { name: "Túi tote", exact: true })
    .click();
  assert.equal(await page.locator(".product-card").count(), 2);
  await page.getByRole("button", { name: "Xem tất cả", exact: true }).click();
  await page
    .getByRole("button", { name: "Tìm kiếm sản phẩm", exact: true })
    .click();
  await page
    .getByRole("searchbox", { name: "Nhập tên sản phẩm" })
    .fill("ao thun");
  await page
    .locator(".search-form")
    .getByRole("button", { name: "Tìm kiếm", exact: true })
    .click();
  assert.equal(await page.locator(".product-card").count(), 2);
  await page.getByRole("button", { name: "Xóa tìm kiếm" }).click();
  await page
    .getByRole("button", { name: "Yêu thích Áo thun Slow Days", exact: true })
    .click();
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    await page
      .getByRole("button", {
        name: "Bỏ yêu thích Áo thun Slow Days",
        exact: true,
      })
      .getAttribute("aria-pressed"),
    "true",
  );
  await page
    .getByRole("button", { name: "Xem sản phẩm yêu thích", exact: true })
    .click();
  assert.equal(await page.locator(".product-card").count(), 1);
  await page.getByRole("button", { name: "Xem tất cả", exact: true }).click();
  pass("Category filters, accent-insensitive search and persistent favorites");

  await page
    .getByRole("button", { name: "Bắt đầu thiết kế", exact: true })
    .click();
  let dialog = page.getByRole("dialog", { name: "Thiết kế sản phẩm của bạn" });
  await dialog.getByRole("button", { name: "Màu Đen", exact: true }).click();
  await dialog.getByRole("button", { name: "L", exact: true }).click();
  await dialog.getByRole("tab", { name: "Thêm chữ", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Thêm vào giỏ hàng", exact: true })
    .click();
  await waitVisible(dialog.getByRole("alert"));
  await dialog
    .getByRole("textbox", { name: "Dòng chữ bạn muốn in" })
    .fill("Cứ là chính mình");
  await dialog
    .getByRole("button", { name: "Tăng số lượng", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Thêm vào giỏ hàng", exact: true })
    .click();
  let rows = await readCart();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].quantity, 2);
  assert.equal(rows[0].customText, "Cứ là chính mình");
  assert.equal(rows[0].size, "L");
  await dialog.getByRole("textbox", { name: "Dòng chữ bạn muốn in" }).focus();
  await page.waitForFunction(
    () => !document.querySelector(".toast"),
    {},
    { timeout: 7000 },
  );
  assert.equal(
    await page.evaluate(() => document.activeElement.id),
    "custom-text",
  );
  await page.keyboard.press("Escape");
  await page.reload({ waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: "Mở giỏ hàng, 2 sản phẩm", exact: true })
    .click();
  dialog = page.getByRole("dialog", { name: "Giỏ hàng của bạn" });
  assert.equal(
    await dialog.locator(".cart-custom-text").textContent(),
    "“Cứ là chính mình”",
  );
  await dialog
    .getByRole("button", {
      name: "Tăng số lượng Áo thun Slow Days",
      exact: true,
    })
    .click();
  rows = await readCart();
  assert.equal(rows[0].quantity, 3);
  assert.ok(
    (await dialog.locator(".free-shipping-note").textContent()).includes(
      "miễn phí",
    ),
  );
  await dialog
    .getByRole("button", {
      name: "Giảm số lượng Áo thun Slow Days",
      exact: true,
    })
    .click();
  assert.ok(
    (await dialog.locator(".cart-summary").textContent()).includes("30.000"),
  );
  await dialog
    .getByRole("button", { name: "Đóng giỏ hàng", exact: true })
    .click();
  pass(
    "Text/color/size preview, variant cart persistence, quantity, shipping and stable dialog focus",
  );

  await page
    .getByRole("button", {
      name: "Xem và tùy chỉnh Túi tote Bloom Club",
      exact: true,
    })
    .click();
  dialog = page.getByRole("dialog", { name: "Túi tote Bloom Club" });
  await dialog.getByRole("tab", { name: "Tải hình", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Thêm vào giỏ hàng", exact: true })
    .click();
  await waitVisible(dialog.getByRole("alert"));
  const file = dialog.getByLabel("Tải hình thiết kế", { exact: true });
  await file.setInputFiles({
    name: "wrong.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("bad"),
  });
  await waitVisible(
    dialog.getByText("Vui lòng chọn ảnh PNG, JPG hoặc WEBP.", { exact: true }),
  );
  await file.setInputFiles({
    name: "broken.png",
    mimeType: "image/png",
    buffer: Buffer.from("not an image"),
  });
  await waitVisible(
    dialog.getByText(
      "Ảnh bị lỗi hoặc không đúng định dạng. Vui lòng chọn ảnh khác.",
      { exact: true },
    ),
  );
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6RkAAAAASUVORK5CYII=",
    "base64",
  );
  await file.setInputFiles({
    name: "my-design.png",
    mimeType: "image/png",
    buffer: png,
  });
  await waitVisible(dialog.getByText("my-design.png", { exact: true }));
  await dialog
    .getByRole("button", { name: "Thêm vào giỏ hàng", exact: true })
    .click();
  await dialog.getByRole("tab", { name: "Mẫu có sẵn", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Thiết kế Ocean Soul", exact: true })
    .click();
  await dialog.getByRole("tab", { name: "Tải hình", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Thêm vào giỏ hàng", exact: true })
    .click();
  rows = await readCart();
  assert.equal(rows.length, 2);
  assert.equal(rows[1].quantity, 2);
  assert.equal(rows[1].design, "upload");
  assert.ok(rows[1].uploadedImage.startsWith("data:image/png"));
  await page.keyboard.press("Escape");
  pass(
    "Upload validation and preview; matching image variants merge regardless of hidden preset",
  );

  await page
    .getByRole("button", { name: "Mở giỏ hàng, 4 sản phẩm", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Tiếp tục đặt hàng", exact: true })
    .click();
  dialog = page.getByRole("dialog", { name: "Thông tin đặt hàng" });
  await dialog
    .getByRole("textbox", { name: "Họ và tên", exact: true })
    .fill("Khách thử nghiệm");
  await dialog
    .getByRole("textbox", { name: "Số điện thoại", exact: true })
    .fill("123");
  await dialog
    .getByRole("textbox", { name: "Email", exact: true })
    .fill("test@example.com");
  await dialog
    .getByRole("textbox", { name: "Địa chỉ nhận hàng", exact: true })
    .fill("123 Đường Mẫu, Phường Mẫu, Hà Nội");
  await dialog
    .getByRole("button", { name: "Lưu đơn hàng mẫu", exact: true })
    .click();
  await waitVisible(
    dialog.getByText("Vui lòng nhập số điện thoại Việt Nam hợp lệ.", {
      exact: true,
    }),
  );
  await dialog
    .getByRole("textbox", { name: "Số điện thoại", exact: true })
    .fill("0901234567");
  await dialog
    .getByRole("button", { name: "Lưu đơn hàng mẫu", exact: true })
    .click();
  dialog = page.getByRole("dialog", { name: "Đơn hàng mẫu đã được lưu" });
  await waitVisible(
    dialog.getByRole("heading", { name: "Đã lưu đơn hàng mẫu!", exact: true }),
  );
  assert.equal((await readCart()).length, 0);
  const downloadPromise = page.waitForEvent("download");
  await dialog
    .getByRole("button", { name: "Tải thông tin đơn hàng", exact: true })
    .click();
  const download = await downloadPromise;
  assert.ok(download.suggestedFilename().startsWith("MUC-"));
  const orders = await page.evaluate(() => new Promise((resolve, reject) => {
    const open = indexedDB.open("muc.studio.v1", 1);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const request = db.transaction("orders", "readonly").objectStore("orders").getAll();
      request.onsuccess = () => { db.close(); resolve(request.result); };
      request.onerror = () => { db.close(); reject(request.error); };
    };
  }));
  assert.equal(orders.length, 1);
  assert.equal(orders[0].items.length, 2);
  assert.equal(orders[0].totals.count, 4);
  assert.equal(orders[0].status, "demo");
  await dialog
    .getByRole("button", { name: "Tiếp tục khám phá", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Email nhận tin", exact: true })
    .fill("newsletter@example.com");
  await page
    .getByRole("button", { name: "Đăng ký nhận tin", exact: true })
    .click();
  await waitVisible(page.getByText("Đã lưu email của bạn!", { exact: true }));
  pass(
    "Checkout phone validation, IndexedDB order with designs, JSON download, cart reset and newsletter demo",
  );

  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(baseURL, { waitUntil: "networkidle" });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `No horizontal overflow at ${width}px`,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: `${screenshots}/mobile-final.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  await page
    .locator(".main-nav")
    .getByRole("button", { name: "Tự thiết kế" })
    .click();
  dialog = page.getByRole("dialog", { name: "Thiết kế sản phẩm của bạn" });
  assert.equal(await dialog.isVisible(), true);
  await dialog
    .getByRole("button", { name: "Đóng tùy chỉnh", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Mở giỏ hàng, 0 sản phẩm", exact: true })
    .click();
  await waitVisible(
    page.getByRole("heading", {
      name: "Một chiếc giỏ đang chờ bạn.",
      exact: true,
    }),
  );
  await page
    .getByRole("dialog", { name: "Giỏ hàng của bạn" })
    .getByRole("button", { name: "Khám phá sản phẩm", exact: true })
    .click();
  assert.equal(await page.locator(".overlay").count(), 0);
  pass(
    "Mobile/tablet 320–768px without horizontal overflow, mobile navigation and empty cart",
  );
  assert.deepEqual(errors, []);
  pass("No browser runtime errors");
} finally {
  await context.close();
  await browser.close();
}
