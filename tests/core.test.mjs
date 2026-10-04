import test from "node:test";
import assert from "node:assert/strict";
import { canTransitionOrder, canTransitionPayment, validateOrderPaymentPair } from "../src/utils/orderState.mjs";
import { slugify } from "../src/utils/slug.mjs";

test("order state machine blocks reopening cancelled orders", () => {
  assert.equal(canTransitionOrder("CANCELLED", "PROCESSING"), false);
  assert.equal(canTransitionOrder("PENDING", "PROCESSING"), true);
  assert.equal(canTransitionOrder("SHIPPED", "CANCELLED"), false);
});

test("payment state machine blocks paid to failed", () => {
  assert.equal(canTransitionPayment("PAID", "FAILED"), false);
  assert.equal(canTransitionPayment("PAID", "REFUNDED"), true);
});

test("non COD completed order must be paid", () => {
  assert.equal(validateOrderPaymentPair("COMPLETED", "PENDING", "MANUAL"), false);
  assert.equal(validateOrderPaymentPair("COMPLETED", "PAID", "MANUAL"), true);
});

test("slugify supports Persian and Latin text", () => {
  assert.equal(slugify("قهوه عربیکا  Premium"), "قهوه-عربیکا-premium");
});
