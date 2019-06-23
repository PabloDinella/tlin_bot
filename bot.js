const TeleBot = require('telebot');
const fs = require('fs');
const path = require('path');

const bot = new TeleBot(process.env.TOKEN);

const request = require('request');
const parse = require('./getLINMessage');

const channelID = process.env.channelID;

request({
  uri: "http://www.thelordisnear.ca/",
}, function (error, response, body) {

  const parsed = parse(body)

  bot.sendMessage(channelID, parsed.message)
  bot.sendAudio(channelID, `http://growingrace.com/mp3s/TheLordIsNear/${parsed.date.split('-')[2]}/${parsed.date}.mp3`)
});
