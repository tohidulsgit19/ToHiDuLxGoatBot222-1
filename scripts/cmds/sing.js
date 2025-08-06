const axios = require("axios");
const fs = require("fs");

const baseApiUrl = async () => {
  const res = await axios.get("https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json");
  return res.data.api;
};

module.exports = {
  config: {
    name: "sing",
    version: "2.2.0",
    author: "TOHIDUL (Fixed by Dipto)",
    countDown: 5,
    role: 0,
    shortDescription: "🎶 গান ডাউনলোড করো",
    longDescription: "🎧 ইউটিউব লিংক বা গানের নাম লিখে অডিও ফরম্যাটে ডাউনলোড করো",
    category: "media",
    guide: {
      en: "🎵 {pn} <song name or YouTube link>\n📌 Example:\n{pn} chipi chipi chapa chapa"
    }
  },

  onStart: async function ({ api, event, args, commandName }) {
    const input = args.join(" ");
    const ytLinkRegex = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
    const isYTLink = ytLinkRegex.test(args[0]);

    // 🔗 Direct link mode
    if (isYTLink) {
      const videoID = args[0].match(ytLinkRegex)[1];
      try {
        const { data: { title, downloadLink, quality } } = await axios.get(`${await baseApiUrl()}/ytDl3?link=${videoID}&format=mp3`);
        const filePath = "audio.mp3";

        await downloadAudio(downloadLink, filePath);
        return api.sendMessage({
          body: `🎧 𝙉𝙊𝙒 𝙋𝙇𝘼𝙔𝙄𝙉𝙂\n━━━━━━━━━━━━━━━\n📀 𝙏𝙞𝙩𝙡𝙚: ${title}\n🔊 𝙌𝙪𝙖𝙡𝙞𝙩𝙮: ${quality}\n\n🔁 𝙀𝙣𝙟𝙤𝙮 𝙔𝙤𝙪𝙧 𝙈𝙪𝙨𝙞𝙘 💖\n🔖 𝘾𝙧𝙚𝙙𝙞𝙩: TOHIDUL`,
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
      } catch (err) {
        console.error(err);
        return api.sendMessage("🚫 𝘿𝙤𝙬𝙣𝙡𝙤𝙖𝙙 𝙁𝙖𝙞𝙡𝙚𝙙! 𝙏𝙧𝙮 𝘼𝙜𝙖𝙞𝙣 ❌", event.threadID, event.messageID);
      }
    }

    // 🔍 Search mode
    const keyword = input.replace("?feature=share", "");
    let results;
    try {
      results = (await axios.get(`${await baseApiUrl()}/ytFullSearch?songName=${keyword}`)).data.slice(0, 6);
    } catch {
      return api.sendMessage("⚠️ 𝙎𝙚𝙖𝙧𝙘𝙝 𝙁𝙖𝙞𝙡𝙚𝙙! 𝙏𝙧𝙮 𝙇𝙖𝙩𝙚𝙧.", event.threadID, event.messageID);
    }

    if (!results.length) {
      return api.sendMessage(`🚫 𝙉𝙤 𝙨𝙤𝙣𝙜 𝙛𝙤𝙪𝙣𝙙 𝙛𝙤𝙧:\n🔎 ${keyword}`, event.threadID, event.messageID);
    }

    let msg = "🎵 𝙎𝙚𝙖𝙧𝙘𝙝 𝙍𝙚𝙨𝙪𝙡𝙩𝙨:\n\n";
    const thumbs = [];

    for (let i = 0; i < results.length; i++) {
      const { title, time, channel, thumbnail } = results[i];
      msg += `🎼 ${i + 1}. ${title}\n⏱ ${time} | 📺 ${channel.name}\n\n`;
      thumbs.push(downloadImage(thumbnail, `thumb${i + 1}.jpg`));
    }

    api.sendMessage({
      body: msg + "📩 𝙍𝙚𝙥𝙡𝙮 𝙖 𝙣𝙪𝙢𝙗𝙚𝙧 (1-6) 𝙩𝙤 𝙙𝙤𝙬𝙣𝙡𝙤𝙖𝙙",
      attachment: await Promise.all(thumbs)
    }, event.threadID, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName,
        messageID: info.messageID,
        author: event.senderID,
        result: results
      });
    }, event.messageID);
  },

  onReply: async function ({ api, event, Reply }) {
    const { result } = Reply;
    const choice = parseInt(event.body);
    if (isNaN(choice) || choice < 1 || choice > result.length) {
      return api.sendMessage("🚫 𝙄𝙣𝙫𝙖𝙡𝙞𝙙 𝙘𝙝𝙤𝙞𝙘𝙚! 𝙋𝙡𝙚𝙖𝙨𝙚 𝙧𝙚𝙥𝙡𝙮 1-6 🔁", event.threadID, event.messageID);
    }

    const selected = result[choice - 1];
    const videoID = selected.id;

    try {
      const { data: { title, downloadLink, quality } } = await axios.get(`${await baseApiUrl()}/ytDl3?link=${videoID}&format=mp3`);
      const filePath = "audio.mp3";
      await api.unsendMessage(Reply.messageID);

      await downloadAudio(downloadLink, filePath);
      return api.sendMessage({
        body: `🎧 𝙉𝙊𝙒 𝙋𝙇𝘼𝙔𝙄𝙉𝙂\n━━━━━━━━━━━━━━━\n📀 𝙏𝙞𝙩𝙡𝙚: ${title}\n🔊 𝙌𝙪𝙖𝙡𝙞𝙩𝙮: ${quality}\n\n🔁 𝙀𝙣𝙟𝙤𝙮 𝙔𝙤𝙪𝙧 𝙈𝙪𝙨𝙞𝙘 💖\n🔖 𝘾𝙧𝙚𝙙𝙞𝙩: TOHIDUL`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
    } catch (err) {
      console.error(err);
      return api.sendMessage("⚠️ 𝘿𝙤𝙬𝙣𝙡𝙤𝙖𝙙 𝙁𝙖𝙞𝙡𝙚𝙙! 𝙇𝙞𝙣𝙠 𝙤𝙧 𝙨𝙞𝙯𝙚 𝙞𝙨𝙨𝙪𝙚", event.threadID, event.messageID);
    }
  }
};

// 🔉 Audio downloader
async function downloadAudio(url, filename) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(filename, Buffer.from(res.data));
}

// 🖼 Thumbnail downloader
async function downloadImage(url, pathName) {
  try {
    const res = await axios.get(url, { responseType: "stream" });
    res.data.path = pathName;
    return res.data;
  } catch (err) {
    console.error(err);
    return null;
  }
}
