const axios = require('axios');
const fs = require('fs-extra');
const request = require('request');

module.exports = {
  config: {
    name: "blackpanther",
    aliases: [],
    version: "1.1",
    author: "Samir | Modified by ChatGPT",
    role: 0,
    category: "image",
    shortDescription: "Make a blackpanther style meme",
    longDescription: "Use: text1 - text2 → Creates a black panther meme",
    guide: {
      en: "{pn} top text - bottom text\nExample: {pn} ami holam - black panther"
    }
  },

  onStart: async function ({ api, event, args }) {
    const input = args.join(" ");

    if (!input.includes(" - ")) {
      return api.sendMessage("⚠️ দয়া করে এই ফরম্যাটে লিখো:\nblackpanther উপর লেখা - নিচের লেখা", event.threadID, event.messageID);
    }

    const [text1, text2] = input.split(" - ").map(t => t.trim());

    if (!text1 || !text2) {
      return api.sendMessage("⚠️ ফরম্যাট ভুল!\nউদাহরণ: blackpanther ami holam - black panther", event.threadID, event.messageID);
    }

    const encodedText1 = encodeURIComponent(text1);
    const encodedText2 = encodeURIComponent(text2);
    const imageUrl = `https://api.memegen.link/images/wddth/${encodedText1}/${encodedText2}.png`;

    const filePath = __dirname + `/tmp/blackpanther_${event.senderID}.png`;

    const callback = () => {
      api.sendMessage({
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
    };

    request(imageUrl).pipe(fs.createWriteStream(filePath)).on("close", callback);
  }
};
