import parse from "./parseMessage.js";
import fetch from "node-fetch";

const createBot = (token) => {
  const telegramApiUrl = `https://api.telegram.org/bot${token}`;

  return {
    sendMessage: async (channelId, text) => {
      const response = await fetch(
        telegramApiUrl +
          "/sendMessage?" +
          new URLSearchParams({
            chat_id: channelId,
            text,
            // parse_mode: "MarkdownV2",
          }),
        {
          method: "POST",
        }
      );

      console.log("telegram's response", await response.json());
      return response;
    },
    sendAudio: async (channelId, audio, title) => {
      const response = await fetch(
        telegramApiUrl +
          "/sendAudio?" +
          new URLSearchParams({
            chat_id: channelId,
            audio,
            title,
          }),
        {
          method: "POST",
        }
      );

      console.log("telegram's response", await response.json());
      return response;
    },
  };
};

export async function run({
  mode,
  channelId: channelIdProduction,
  channelIdTesting,
  token,
}) {
  const body = await fetch("https://thelordisnear.org/", {
    method: "get",
  }).then((response) => response.text());

  const parsed = parse(body);

  console.log(`Running in mode: ${mode}`);
  console.log(parsed.message);
  console.log(parsed.audioUrl);

  if (mode === "parseOnly") {
    return true;
  }

  const bot = createBot(token);

  const channelId = (() => {
    if (mode === "production") {
      return channelIdProduction;
    }

    if (mode === "staging") {
      return channelIdTesting;
    }

    return null;
  })();

  await bot.sendMessage(channelId, parsed.message);
  await bot.sendAudio(channelId, parsed.audioUrl, parsed.formattedDate);
  return true;
}
