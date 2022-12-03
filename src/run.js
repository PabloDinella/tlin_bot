// import TelegramBot from "node-telegram-bot-api";
// import fetch from "node-fetch";

import parse from "./parseMessage.js";

// const bot = new TelegramBot(TOKEN);

const channelId = CHANNEL_ID;
const channelIdTesting = CHANNEL_ID_TESTING;

const mode = MODE;

const bot = {
  token: TOKEN,
  telegramApiUrl: `https://api.telegram.org/bot${TOKEN}`,
  sendMessage: (channelId, text) => {
    return fetch(
      this.telegramApiUrl +
        "/sendMessage?" +
        new URLSearchParams({
          channelId,
          text,
        }),
      {
        method: "POST",
      }
    );
  },
  sendMessage: (channelId, text) => {
    return fetch(
      this.telegramApiUrl +
        "/sendAudio?" +
        new URLSearchParams({
          channelId,
          text,
        }),
      {
        method: "POST",
      }
    );
  }
};

export async function run() {
  const body = await fetch("http://www.thelordisnear.ca/", {
    method: "get",
  }).then((response) => response.text());

  const parsed = parse(body);

  console.log(`Running in mode: ${mode}`);

  console.log(parsed);

  if (mode === "production") {
    bot.sendMessage(channelId, parsed.message);
    bot.sendAudio(
      channelId,
      `http://growingrace.com/mp3s/TheLordIsNear/${parsed.date.split("-")[2]}/${
        parsed.date
      }.mp3`
    );
    return true;
  }

  if (mode === "testing") {
    bot.sendMessage(channelIdTesting, parsed.message);
    bot.sendAudio(
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
