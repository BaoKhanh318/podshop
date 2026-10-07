import assert from "node:assert/strict";
import test from "node:test";
import {
  CART_STORAGE_KEY,
  addCartItem,
  cartTotals,
  readCart,
  updateCartQuantity,
  writeCart,
} from "../src/lib/cart.js";

const tee = {
  productId: "slow-days-tee",
  name: "Áo thun Slow Days",
  kind: "tee",
  price: 249000,
  color: { name: "Kem", hex: "#f0e9da" },
  size: "M",
  design: "sun",
};

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("matching customizations merge and each different customization stays separate", () => {
  const first = addCartItem([], tee);
  const merged = addCartItem(first, { ...tee, quantity: 2 });
  assert.equal(merged.length, 1);
  assert.equal(merged[0].quantity, 3);
  assert.equal(merged[0].id, merged[0].key);
  assert.equal(merged[0].color, "#f0e9da");
  assert.equal(merged[0].colorName, "Kem");
  for (const variant of [
    { size: "L" },
    { color: { name: "Trắng", hex: "#ffffff" } },
    { customText: "MỰC" },
    { design: "bloom" },
    { productId: "another-tee" },
  ]) {
    const cart = addCartItem(first, { ...tee, ...variant });
    assert.equal(cart.length, 2);
    assert.notEqual(cart[0].id, cart[1].id);
  }
});

test("uploaded artwork identifies a variant without putting raw image data in its key", () => {
  const uploadedImage = `data:image/png;base64,${"a".repeat(100000)}`;
  const first = addCartItem([], { ...tee, uploadedImage });
  assert.ok(first[0].id.length < 100);
  assert.equal(first[0].uploadedImage, uploadedImage);
  assert.equal(addCartItem(first, { ...tee, uploadedImage })[0].quantity, 2);
  const differentImage = `data:image/png;base64,${"b".repeat(100000)}`;
  const distinct = addCartItem(first, {
    ...tee,
    uploadedImage: differentImage,
  });
  assert.equal(distinct.length, 2);
  assert.notEqual(distinct[0].id, distinct[1].id);
});

test("quantity updates are immutable, capped, and remove rows at zero", () => {
  const original = addCartItem([], tee);
  const snapshot = structuredClone(original);
  const id = original[0].id;
  assert.equal(
    addCartItem(original, { ...tee, quantity: 1000 })[0].quantity,
    99,
  );
  assert.equal(updateCartQuantity(original, id, 1000)[0].quantity, 99);
  assert.equal(updateCartQuantity(original, id, 3.9)[0].quantity, 3);
  assert.deepEqual(updateCartQuantity(original, id, 0), []);
  assert.deepEqual(updateCartQuantity(original, id, -1), []);
  assert.deepEqual(updateCartQuantity(original, id, "invalid"), original);
  assert.deepEqual(original, snapshot);
});

test("cart persists and restores the complete customization with a stable identity", () => {
  const storage = memoryStorage();
  const cart = addCartItem([], {
    ...tee,
    customText: "Xin chào",
    uploadedImage: "data:image/png;base64,YQ==",
    quantity: 2,
  });
  assert.equal(writeCart(cart, storage), true);
  assert.deepEqual(readCart(storage), cart);
  assert.equal(addCartItem(readCart(storage), cart[0])[0].quantity, 4);
});

test("corrupt or incompatible storage is harmless and invalid rows are discarded", () => {
  const storage = memoryStorage();
  storage.setItem(CART_STORAGE_KEY, "{invalid JSON");
  assert.deepEqual(readCart(storage), []);
  storage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify({ version: 99, items: [tee] }),
  );
  assert.deepEqual(readCart(storage), []);
  storage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify({ version: 1, items: "invalid" }),
  );
  assert.deepEqual(readCart(storage), []);
  storage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      items: [
        null,
        { price: -100 },
        { ...tee, price: "invalid" },
        { ...tee, quantity: 1000 },
      ],
    }),
  );
  const restored = readCart(storage);
  assert.equal(restored.length, 1);
  assert.equal(restored[0].productId, tee.productId);
  assert.equal(restored[0].quantity, 99);
});

test("missing, blocked, and full storage report persistence failure without changing the cart", () => {
  const cart = addCartItem([], tee);
  const snapshot = structuredClone(cart);
  const blocked = {
    getItem() {
      throw new Error("Storage access blocked");
    },
    setItem() {
      throw new Error("Quota exceeded");
    },
  };
  assert.equal(writeCart(cart, blocked), false);
  assert.equal(writeCart(cart, null), false);
  assert.deepEqual(readCart(blocked), []);
  assert.deepEqual(readCart(null), []);
  assert.deepEqual(cart, snapshot);
});

test("shipping is free for an empty cart and exactly from 500,000 VND", () => {
  assert.deepEqual(cartTotals([]), {
    subtotal: 0,
    shipping: 0,
    total: 0,
    count: 0,
  });
  assert.deepEqual(cartTotals(addCartItem([], tee)), {
    subtotal: 249000,
    shipping: 30000,
    total: 279000,
    count: 1,
  });
  assert.equal(
    cartTotals(addCartItem([], { ...tee, price: 499999 })).shipping,
    30000,
  );
  assert.deepEqual(
    cartTotals(addCartItem([], { ...tee, price: 250000, quantity: 2 })),
    {
      subtotal: 500000,
      shipping: 0,
      total: 500000,
      count: 2,
    },
  );
});
