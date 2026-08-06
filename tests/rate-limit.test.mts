import assert from "node:assert/strict";
import test from "node:test";
import {
  clearRateLimitBucketsForTests,
  consumeRateLimit,
  getClientIdentifier,
} from "../lib/rate-limit.ts";

test.beforeEach(() => clearRateLimitBucketsForTests());

test("consumeRateLimit allows requests up to the configured limit", () => {
  const first = consumeRateLimit("client-a", 1_000, 2, 5_000);
  const second = consumeRateLimit("client-a", 1_001, 2, 5_000);

  assert.equal(first.allowed, true);
  assert.equal(first.remaining, 1);
  assert.equal(second.allowed, true);
  assert.equal(second.remaining, 0);
});

test("consumeRateLimit blocks excess requests and supplies retry timing", () => {
  consumeRateLimit("client-b", 1_000, 1, 5_000);
  const blocked = consumeRateLimit("client-b", 2_000, 1, 5_000);

  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 4);
});

test("consumeRateLimit starts a new window after reset", () => {
  consumeRateLimit("client-c", 1_000, 1, 1_000);
  const nextWindow = consumeRateLimit("client-c", 2_000, 1, 1_000);

  assert.equal(nextWindow.allowed, true);
  assert.equal(nextWindow.remaining, 0);
  assert.equal(nextWindow.resetAt, 3_000);
});

test("getClientIdentifier prefers the first forwarded address", () => {
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.10, 10.0.0.1",
    "x-real-ip": "203.0.113.20",
  });

  assert.equal(getClientIdentifier(headers), "203.0.113.10");
  assert.equal(getClientIdentifier(new Headers()), "unknown-client");
});
