import test from "node:test";
import assert from "node:assert/strict";

import parse from "../src/parseMessage.js";
import { parseAudioUrl } from "../src/getAudioUrl.js";
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

test("extracts and validates the Lord Is Near audio URL", () => {
  const sourceUrl = "https://thelordisnear.org/2026/0912";
  const audioUrl = parseAudioUrl(
    '<audio><source src="https://mp3.thelordisnear.org/2026-09-12_c8af6.mp3"></audio>',
    sourceUrl
  );

  assert.equal(
    audioUrl.toString(),
    "https://mp3.thelordisnear.org/2026-09-12_c8af6.mp3"
  );
  assert.throws(
    () =>
      parseAudioUrl(
        '<audio><source src="https://example.com/untrusted.mp3"></audio>',
        sourceUrl
      ),
    /Unexpected audio URL/
  );
});

test("parseOnly fetches and validates without calling Telegram", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));

    if (String(url).includes("thelordisnear.org")) {
      return {
        ok: true,
        status: 200,
        text: async () => "<html></html>",
      };
    }

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
  assert.equal(parsed.audioUrl, null);
  assert.equal(calls.length, 2);
  assert.match(calls[0], /apissl\.gbv-online\.org/);
});

test("sends validated audio after the text message", async () => {
  const telegramCalls = [];
  const fetchImpl = async (url, options = {}) => {
    const value = String(url);

    if (value.includes("gbv-online")) {
      return { ok: true, status: 200, json: async () => record };
    }

    if (value === "https://thelordisnear.org/2026/0912") {
      return {
        ok: true,
        status: 200,
        text: async () =>
          '<audio><source src="https://mp3.thelordisnear.org/daily.mp3"></audio>',
      };
    }

    if (
      value === "https://mp3.thelordisnear.org/daily.mp3" &&
      options.method === "HEAD"
    ) {
      return {
        ok: true,
        status: 200,
        headers: { get: () => "audio/mpeg" },
      };
    }

    if (value === "https://mp3.thelordisnear.org/daily.mp3") {
      return {
        ok: true,
        status: 200,
        headers: { get: () => "audio/mpeg" },
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      };
    }

    telegramCalls.push({ url: value, body: options.body });
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true, result: { message_id: 123 } }),
    };
  };

  const result = await run({
    mode: "staging",
    channelIdTesting: "test-channel",
    token: "test-token",
    date: "2026-09-12",
    fetchImpl,
  });

  assert.equal(result.audioSent, true);
  assert.deepEqual(
    telegramCalls.map(({ url }) => url.split("/").at(-1)),
    ["sendMessage", "sendAudio"]
  );
  assert.equal(JSON.parse(telegramCalls[0].body).chat_id, "test-channel");
  assert.equal(telegramCalls[1].body.get("chat_id"), "test-channel");
  assert.equal(telegramCalls[1].body.get("title"), "Saturday September 12, 2026");
  assert.equal(telegramCalls[1].body.get("audio").type, "audio/mpeg");
});

test("audio failure does not prevent the text message", async () => {
  let textSent = false;
  const fetchImpl = async (url) => {
    const value = String(url);

    if (value.includes("gbv-online")) {
      return { ok: true, status: 200, json: async () => record };
    }

    if (value.includes("thelordisnear.org")) {
      return { ok: false, status: 403, text: async () => "challenge" };
    }

    textSent = true;
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true, result: { message_id: 123 } }),
    };
  };

  const result = await run({
    mode: "staging",
    channelIdTesting: "test-channel",
    token: "test-token",
    date: "2026-09-12",
    fetchImpl,
  });

  assert.equal(textSent, true);
  assert.equal(result.audioUrl, null);
  assert.equal(result.audioSent, false);
});

test("propagates Telegram API failures", async () => {
  const fetchImpl = async (url) => {
    if (String(url).includes("gbv-online")) {
      return { ok: true, status: 200, json: async () => record };
    }

    if (String(url).includes("thelordisnear.org")) {
      return { ok: true, status: 200, text: async () => "<html></html>" };
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
