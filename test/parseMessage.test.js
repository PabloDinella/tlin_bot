import test from "node:test";
import assert from "node:assert/strict";

import parse from "../src/parseMessage.js";
import { buildGbvUrl, getTodayInSaoPaulo, run } from "../src/run.js";

const record = {
  product_id: 773,
  date: "2026-09-12T00:00:00.000Z",
  scripture: "<p>The Lord said to Gideon.</p>",
  ref: "Judges 7:4",
  title: "Sober Restraint",
  text: '<p>First paragraph.</p><p>Second paragraph.</p><p style="text-align: right">An Author</p>',
};

test("parses a GBV calendar record into a Telegram message", () => {
  const parsed = parse(record);

  assert.equal(parsed.date, "2026-09-12");
  assert.equal(parsed.formattedDate, "Saturday September 12, 2026");
  assert.equal(parsed.sourceUrl, "https://thelordisnear.org/2026/0912");
  assert.match(parsed.message, /The Lord said to Gideon\. Judges 7:4/);
  assert.match(parsed.message, /First paragraph\.\n\nSecond paragraph\./);
  assert.match(parsed.message, /\n\nAn Author\n\nView, share/);
});

test("rejects an incomplete GBV response", () => {
  assert.throws(() => parse({ date: record.date }), /missing:/);
});

test("builds the GBV query for the requested date", () => {
  const url = buildGbvUrl("2026-09-12");
  const filter = JSON.parse(url.searchParams.get("filter"));

  assert.deepEqual(filter, {
    where: { product_id: 773, date: "2026-09-12" },
  });
});

test("uses the Sao Paulo calendar date", () => {
  assert.equal(
    getTodayInSaoPaulo(new Date("2026-09-13T01:30:00.000Z")),
    "2026-09-12"
  );
});

test("parseOnly fetches and validates without calling Telegram", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    return {
      ok: true,
      status: 200,
      json: async () => record,
    };
  };

  const parsed = await run({
    mode: "parseOnly",
    date: "2026-09-12",
    fetchImpl,
  });

  assert.equal(parsed.date, "2026-09-12");
  assert.equal(calls.length, 1);
  assert.match(calls[0], /apissl\.gbv-online\.org/);
});

test("propagates Telegram API failures", async () => {
  const fetchImpl = async (url) => {
    if (String(url).includes("gbv-online")) {
      return { ok: true, status: 200, json: async () => record };
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: false, description: "chat not found" }),
    };
  };

  await assert.rejects(
    run({
      mode: "staging",
      channelIdTesting: "@thelordisnear_dev",
      token: "test-token",
      date: "2026-09-12",
      fetchImpl,
    }),
    /chat not found/
  );
});
