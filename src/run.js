import parse from "./parseMessage.js";
import { getAudioUrl } from "./getAudioUrl.js";
import fetch, { Blob, FormData } from "node-fetch";

const GBV_API_URL = "https://apissl.gbv-online.org/api/CalendarDays/findOne";
const GBV_PRODUCT_ID = 773;
const MAX_AUDIO_BYTES = 50 * 1024 * 1024;

function getTodayInSaoPaulo(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function buildGbvUrl(date) {
  const url = new URL(GBV_API_URL);
  url.searchParams.set(
    "filter",
    JSON.stringify({ where: { product_id: GBV_PRODUCT_ID, date } })
  );
  return url;
}

async function getDailyRecord(date, fetchImpl) {
  const response = await fetchImpl(buildGbvUrl(date));

  if (!response.ok) {
    throw new Error(`GBV API request failed with HTTP ${response.status}.`);
  }

  return response.json();
}

const createBot = (token, fetchImpl) => {
  if (!token) {
    throw new Error("TOKEN is required when sending a Telegram message.");
  }

  const telegramApiUrl = `https://api.telegram.org/bot${token}`;

  const callTelegram = async (method, options) => {
    try {
      return await fetchImpl(`${telegramApiUrl}/${method}`, options);
    } catch {
      // Do not let network-library errors leak the bot token from the request URL.
      throw new Error(`Telegram ${method} request failed.`);
    }
  };

  return {
    sendMessage: async (channelId, text) => {
      if (!channelId) {
        throw new Error("A Telegram channel ID is required.");
      }

      const response = await callTelegram("sendMessage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: channelId, text }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          `Telegram sendMessage failed: ${result.description || `HTTP ${response.status}`}`
        );
      }

      console.log("Telegram message sent", {
        messageId: result.result?.message_id,
      });
      return result;
    },
    sendAudio: async (channelId, audioUrl, title) => {
      if (!channelId) {
        throw new Error("A Telegram channel ID is required.");
      }

      const audioResponse = await fetchImpl(audioUrl, {
        signal: AbortSignal.timeout(15_000),
      });

      if (!audioResponse.ok) {
        throw new Error(`Audio download failed with HTTP ${audioResponse.status}.`);
      }

      const contentType = audioResponse.headers?.get?.("content-type") || "";

      if (!contentType.toLowerCase().startsWith("audio/")) {
        throw new Error(`Unexpected audio content type: ${contentType || "missing"}.`);
      }

      const audioBytes = await audioResponse.arrayBuffer();

      if (audioBytes.byteLength > MAX_AUDIO_BYTES) {
        throw new Error("Audio file exceeds Telegram's 50 MB upload limit.");
      }

      const form = new FormData();
      form.set("chat_id", channelId);
      form.set("title", title);
      form.set(
        "audio",
        new Blob([audioBytes], { type: contentType }),
        `${title}.mp3`
      );

      const response = await callTelegram("sendAudio", {
        method: "POST",
        body: form,
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          `Telegram sendAudio failed: ${result.description || `HTTP ${response.status}`}`
        );
      }

      console.log("Telegram audio sent", {
        messageId: result.result?.message_id,
      });
      return result;
    },
  };
};

export async function run({
  mode,
  channelId: channelIdProduction,
  channelIdTesting,
  token,
  date = getTodayInSaoPaulo(),
  fetchImpl = fetch,
  deliveryPart = "all",
  deliveryState = {},
}) {
  if (!(["parseOnly", "staging", "production"].includes(mode))) {
    throw new Error(`Unsupported MODE: ${mode || "(empty)"}.`);
  }

  if (!["all", "text", "audio"].includes(deliveryPart)) {
    throw new Error(`Unsupported delivery part: ${deliveryPart}.`);
  }

  const record = await getDailyRecord(date, fetchImpl);
  const parsed = parse(record);

  if (parsed.date !== date) {
    throw new Error(`GBV API returned ${parsed.date}; expected ${date}.`);
  }

  let audioUrl = null;
  const wantsAudio = mode === "parseOnly" || deliveryPart !== "text";

  if (wantsAudio) {
    try {
      audioUrl = await getAudioUrl(parsed.sourceUrl, fetchImpl);
    } catch (error) {
      console.warn(`Audio unavailable: ${error.message}`);
    }
  }

  console.log(`Running in mode: ${mode}`);
  console.log(parsed.message);
  console.log(`Audio: ${audioUrl || "unavailable"}`);

  if (mode === "parseOnly") {
    return { ...parsed, audioUrl };
  }

  const channelId =
    mode === "production" ? channelIdProduction : channelIdTesting;
  const bot = createBot(token, fetchImpl);
  let textMessageId = deliveryState.text?.messageId || null;
  let audioMessageId = deliveryState.audio?.messageId || null;

  if (deliveryPart !== "audio" && !textMessageId) {
    const result = await bot.sendMessage(channelId, parsed.message);
    textMessageId = result.result?.message_id || null;
  }

  if (deliveryPart === "audio" && !textMessageId) {
    throw new Error("Text delivery must be recorded before audio delivery.");
  }

  if (deliveryPart !== "text" && audioUrl && !audioMessageId) {
    try {
      const result = await bot.sendAudio(channelId, audioUrl, parsed.formattedDate);
      audioMessageId = result.result?.message_id || null;
    } catch (error) {
      if (deliveryPart === "audio") {
        throw error;
      }

      console.warn(`Telegram audio unavailable: ${error.message}`);
    }
  }

  if (deliveryPart === "audio" && !audioUrl) {
    throw new Error("Audio is unavailable for the requested date.");
  }

  return {
    ...parsed,
    audioUrl,
    textMessageId,
    audioMessageId,
    audioSent: Boolean(audioMessageId),
  };
}

export { buildGbvUrl, getTodayInSaoPaulo };
