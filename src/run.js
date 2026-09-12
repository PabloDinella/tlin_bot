import parse from "./parseMessage.js";
import fetch from "node-fetch";

const GBV_API_URL = "https://apissl.gbv-online.org/api/CalendarDays/findOne";
const GBV_PRODUCT_ID = 773;

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

  return {
    sendMessage: async (channelId, text) => {
      if (!channelId) {
        throw new Error("A Telegram channel ID is required.");
      }

      const response = await fetchImpl(`${telegramApiUrl}/sendMessage`, {
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
        channelId,
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
}) {
  if (!(["parseOnly", "staging", "production"].includes(mode))) {
    throw new Error(`Unsupported MODE: ${mode || "(empty)"}.`);
  }

  const record = await getDailyRecord(date, fetchImpl);
  const parsed = parse(record);

  if (parsed.date !== date) {
    throw new Error(`GBV API returned ${parsed.date}; expected ${date}.`);
  }

  console.log(`Running in mode: ${mode}`);
  console.log(parsed.message);

  if (mode === "parseOnly") {
    return parsed;
  }

  const channelId =
    mode === "production" ? channelIdProduction : channelIdTesting;
  const bot = createBot(token, fetchImpl);
  await bot.sendMessage(channelId, parsed.message);

  return parsed;
}

export { buildGbvUrl, getTodayInSaoPaulo };
