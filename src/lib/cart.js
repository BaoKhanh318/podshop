/**
 * Cart rows: { id, key, productId, name, kind, price, color, colorName, size,
 * customText, design, uploadedImage, quantity }. `id` and `key` identify the
 * complete customization, so matching products merge and different designs do
 * not. The image contributes a hash and length, never its data, to the key.
 * Cart updates return new arrays and leave their inputs untouched.
 */
export const CART_STORAGE_KEY = "muc.cart.v1";
const MAX_QUANTITY = 99;
const MAX_IMAGE_LENGTH = 8 * 1024 * 1024;

function text(value, maxLength = 160) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function quantity(value, fallback = 1) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed)
    ? Math.min(MAX_QUANTITY, Math.max(1, Math.floor(parsed)))
    : fallback;
}

function hash(value) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(36);
}

function normalizeItem(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;
  const productId = text(item.productId, 100);
  const name = text(item.name);
  const price = Number(item.price);
  if (
    !productId ||
    !name ||
    !Number.isFinite(price) ||
    price < 0 ||
    price > 100000000
  )
    return null;

  const color =
    typeof item.color === "object" && item.color !== null
      ? text(item.color.hex, 60)
      : text(item.color, 60);
  const colorName =
    typeof item.color === "object" && item.color !== null
      ? text(item.color.name, 60)
      : text(item.colorName, 60);
  const size = text(item.size, 24);
  const customText = text(item.customText);
  const design = text(item.design, 60) || "sun";
  const uploadedImage =
    typeof item.uploadedImage === "string" &&
    item.uploadedImage.length <= MAX_IMAGE_LENGTH
      ? item.uploadedImage
      : "";
  const customization = JSON.stringify([
    productId,
    color,
    size,
    customText,
    design,
  ]);
  const id = `muc-${hash(customization)}-${hash(uploadedImage)}-${uploadedImage.length}`;

  return {
    id,
    key: id,
    productId,
    name,
    kind: text(item.kind, 40),
    price: Math.round(price),
    color,
    colorName,
    size,
    customText,
    design,
    uploadedImage,
    quantity: quantity(item.quantity),
  };
}

function normalizeCart(cart) {
  if (!Array.isArray(cart)) return [];
  const rows = new Map();
  for (const candidate of cart.slice(0, 100)) {
    const item = normalizeItem(candidate);
    if (!item) continue;
    const existing = rows.get(item.id);
    rows.set(
      item.id,
      existing
        ? { ...existing, quantity: quantity(existing.quantity + item.quantity) }
        : item,
    );
  }
  return [...rows.values()];
}

function browserStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** An optional Storage-compatible argument makes these helpers usable in SSR and tests. */
export function readCart(storage = browserStorage()) {
  try {
    if (!storage) return [];
    const value = JSON.parse(storage.getItem(CART_STORAGE_KEY) || "null");
    return value?.version === 1 ? normalizeCart(value.items) : [];
  } catch {
    return [];
  }
}

/** Returns whether persistence succeeded; callers keep their in-memory cart on failure. */
export function writeCart(cart, storage = browserStorage()) {
  const rows = normalizeCart(cart);
  try {
    if (!storage) return false;
    storage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ version: 1, items: rows }),
    );
    return true;
  } catch {
    return false;
  }
}

export function addCartItem(cart, item) {
  const rows = normalizeCart(cart);
  const addition = normalizeItem(item);
  if (!addition) return rows;
  const existing = rows.find((row) => row.id === addition.id);
  if (!existing) return [...rows, addition];
  return rows.map((row) =>
    row.id === addition.id
      ? { ...row, quantity: quantity(row.quantity + addition.quantity) }
      : row,
  );
}

/** Setting a quantity to zero (or below) removes the item. */
export function updateCartQuantity(cart, id, nextQuantity) {
  const rows = normalizeCart(cart);
  const parsed = Number(nextQuantity);
  if (!Number.isFinite(parsed)) return rows;
  if (parsed <= 0) return rows.filter((row) => row.id !== id);
  return rows.map((row) =>
    row.id === id ? { ...row, quantity: quantity(parsed) } : row,
  );
}

export function cartTotals(cart) {
  const rows = normalizeCart(cart);
  const subtotal = rows.reduce((sum, row) => sum + row.price * row.quantity, 0);
  const count = rows.reduce((sum, row) => sum + row.quantity, 0);
  const shipping = count === 0 || subtotal >= 500000 ? 0 : 30000;
  return { subtotal, shipping, total: subtotal + shipping, count };
}
