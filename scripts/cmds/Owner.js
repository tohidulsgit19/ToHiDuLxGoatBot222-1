const axios = require("axios");
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "owner",
    aliases: ["creator", "author"],
    version: "2.1.0",
    author: "Tohidul",
    countDown: 5,
    role: 0,
    shortDescription: "Show Bot Owner info with style",
    longDescription: "Displays stylish bot owner details with emojis, fonts, and optional image from online link.",
    category: "info",
    guide: "{pn}"
  },

  onStart: async function ({ message, api, event }) {
    try {
      const now = moment().tz("Asia/Dhaka").format("DD/MM/YYYY hh:mm A");

      const info =
`╭━━━〔 👑 𝗢𝗪𝗡𝗘𝗥 𝗜𝗡𝗙𝗢 👑 〕━━━╮
┃ 🏷️ নাম      : 𝙏 𝙊 𝙃 𝙄 𝘿 𝙐 𝙇 ッ
┃ 👨‍💼 জেন্ডার : Male
┃ 💖 রিলেশন  : Single
┃ 🎂 বয়স      : 18+
┃ 🕌 ধর্ম     : Islam
┃ 🎓 শিক্ষা   : Inter 2nd Year
┃ 🏠 ঠিকানা   : Thakurgaon, Bangladesh
┣━━━〔 🌐 𝗦𝗢𝗖𝗜𝗔𝗟 𝗟𝗜𝗡𝗞𝗦 〕━━━┫
┃ 🎭 TikTok   : -----------
┃ ✈️ Telegram : https://t.me/NFTTOHIDUL19
┃ 🌍 Facebook : https://www.facebook.com/profile.php?id=100092006324917
┣━━━〔 ⏰ টাইম 〕━━━┫
┃ 🕒 ${now}
╰━━━━━━━━━━━━━━━━━━╯
💌 Created by 𝑻𝑶𝑯𝑰𝑫𝑼𝑳`;

      const imgUrl = "https://i.postimg.cc/hj52cBdH/received-1710232042958896.png";
      let msgPayload = { body: info };

      try {
        const res = await axios.get(imgUrl, { responseType: "stream" });
        msgPayload.attachment = res.data;
      } catch {
        // ছবি না পেলে শুধু টেক্সট যাবে
      }

      const sent = await message.reply(msgPayload);

      // Auto unsend after 2 minutes
      setTimeout(() => {
        api.unsendMessage(sent.messageID);
      }, 120 * 1000);

    } catch (err) {
      console.error(err);
      message.reply("❌ মালিকের তথ্য দেখাতে সমস্যা হয়েছে।");
    }
  }
};
