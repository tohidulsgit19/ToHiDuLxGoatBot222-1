const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "hug",
    version: "1.1",
    author: "SiAM (fixed by ChatGPT)",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Send a hug gif to someone",
    },
    longDescription: {
      en: "Hug your friend by mentioning them!",
    },
    category: "fun",
    guide: {
      en: "{pn} @user\n{pn} @user1 @user2",
    },
  },

  onStart: async function ({ api, event, message }) {
    const mentions = Object.keys(event.mentions);

    // Validation
    if (mentions.length === 0)
      return message.reply("😟 Please mention at least one person to hug.");
    if (mentions.length > 2)
      return message.reply("❌ You can only hug one or two people!");

    const uid1 = mentions.length === 1 ? event.senderID : mentions[0];
    const uid2 = mentions.length === 1 ? mentions[0] : mentions[1];

    try {
      const [info1, info2] = await Promise.all([
        api.getUserInfo(uid1),
        api.getUserInfo(uid2)
      ]);

      const name1 = info1[uid1]?.name || "Someone";
      const name2 = info2[uid2]?.name || "Someone else";

      const gifRes = await axios.get("https://nekos.best/api/v2/hug?amount=1");
      const gifUrl = gifRes.data.results[0].url;

      const gifData = await axios.get(gifUrl, { responseType: "arraybuffer" });
      const fileName = `${uid1}_${uid2}_hug.gif`;
      fs.writeFileSync(fileName, Buffer.from(gifData.data, "binary"));

      message.reply({
        body: `🤗 ${name1} hugged ${name2}!`,
        attachment: fs.createReadStream(fileName)
      }, () => fs.unlinkSync(fileName));

    } catch (err) {
      console.error(err);
      return message.reply("❌ Couldn't process the hug request.");
    }
  }
};
