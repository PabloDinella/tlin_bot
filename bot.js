const TeleBot = require('telebot');
const fs = require('fs');
const path = require('path');

const bot = new TeleBot(process.env.TOKEN);

const request = require('request');
const parse = require('./getLINMessage');

const channelID = process.env.channelID;

request({
  uri: "http://www.thelordisnear.ca/",
}, function(error, response, body) {

  const parsed = parse(body)

  var file = fs.createWriteStream(path.join(__dirname, 'mp3', parsed.date+'.mp3'));
  request.get(`http://growingrace.com/mp3s/TheLordIsNear/${parsed.date.split('-')[2]}/${parsed.date}.mp3`).pipe(file);

  file.on('finish', () => {
    bot.sendMessage(channelID, parsed.message)
    bot.sendAudio(channelID, path.join(__dirname, 'mp3', parsed.date+'.mp3'))
  })

  // TODO: delete audio file or not even save it, just stream to the channel?
});
