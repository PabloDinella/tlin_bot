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
          }),
        {
          method: "POST",
        }
      );

      console.log("telegram's response", await response.json());
      return response;
    },
    sendAudio: async (channelId, audio) => {
      const response = await fetch(
        telegramApiUrl +
          "/sendAudio?" +
          new URLSearchParams({
            chat_id: channelId,
            audio,
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

export async function run({ mode, channelId, channelIdTesting, token }) {
  fetch("https://webhook.site/22a0b275-3692-4e67-a693-71ec6458ccfd", {
    method: "post",
    body: "testt",
  });
  const bot = createBot(token);

  const body = await fetch("http://www.thelordisnear.ca/", {
    method: "get",
  }).then((response) => response.text());

  const parsed = parse(body);

  console.log(`Running in mode: ${mode}`);

  console.log(parsed);

  if (mode === "production") {
    await bot.sendMessage(channelId, parsed.message);
    await bot.sendAudio(
      channelId,
      `http://growingrace.com/mp3s/TheLordIsNear/${parsed.date.split("-")[2]}/${
        parsed.date
      }.mp3`
    );
    return true;
  }

  if (mode === "testing") {
    await bot.sendMessage(channelIdTesting, parsed.message);
    await bot.sendAudio(
      channelIdTesting,
      `http://growingrace.com/mp3s/TheLordIsNear/${parsed.date.split("-")[2]}/${
        parsed.date
      }.mp3`
    );
    return true;
  }

  if (mode === "logonly") {
    return true;
  }
}
