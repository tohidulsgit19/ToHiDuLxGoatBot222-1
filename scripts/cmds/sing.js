const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get(`https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`);
  return base.data.api;
};

module.exports = {
  config: {
    name: "sing",
    version: "1.1.6",
    aliases: ["song", "music", "play"],
    author: "dipto ✨",
    countDown: 5,
    role: 0,
    description: { en: "Download audio from YouTube 🎶" },
    category: "media",
    guide: {
      en: `{pn} [<song name>|<YouTube link>]\n\n▶️ Example:\n{pn} chipi chipi chapa chapa`
    }
  },

  onStart: async ({ api, args, event, commandName }) => {
    const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
    const urlYtb = checkurl.test(args[0]);

    // Direct YouTube link
    if (urlYtb) {
      try {
        const { data: { title, downloadLink } } = await axios.get(
          `${await baseApiUrl()}/ytDl2?link=${args[0]}&format=mp3`
        );
        return api.sendMessage({
          body: `🎧 𝐒𝐨𝐧𝐠: ${title}\n\n📥 𝐇𝐞𝐫𝐞’𝐬 𝐲𝐨𝐮𝐫 𝐚𝐮𝐝𝐢𝐨!`,
          attachment: await dipto(downloadLink, "audio.mp3")
        }, event.threadID, event.messageID);
      } catch (err) {
        return api.sendMessage("❌ Failed to fetch audio. Try again.", event.threadID, event.messageID);
      }
    }

    // Search mode
    let keyWord = args.join(" ");
    keyWord = keyWord.includes("?feature=share") ? keyWord.replace("?feature=share", "") : keyWord;

    const maxResults = 6;
    let result;
    try {
      result = ((await axios.get(`${await baseApiUrl()}/ytFullSearch?songName=${keyWord}`)).data).slice(0, maxResults);
    } catch (err) {
      return api.sendMessage("⚠️ 𝐄𝐫𝐫𝐨𝐫:\n" + err.message, event.threadID, event.messageID);
    }

    if (result.length == 0)
      return api.sendMessage(`❗ 𝐍𝐨 𝐬𝐨𝐧𝐠𝐬 𝐟𝐨𝐮𝐧𝐝 𝐟𝐨𝐫:\n🔎 ${keyWord}`, event.threadID, event.messageID);

    let msg = "🎵 𝐒𝐨𝐧𝐠 𝐬𝐞𝐚𝐫𝐜𝐡 𝐫𝐞𝐬𝐮𝐥𝐭𝐬:\n\n";
    const thumbnails = [];
    let i = 1;

    for (const info of result) {
      thumbnails.push(dipto(info.thumbnail, "thumb.jpg"));
      msg += `🎶 ${i++}. ${info.title}\n🕒 ${info.time} | 📺 ${info.channel.name}\n\n`;
    }

    api.sendMessage({
      body: msg + "📩 𝐑𝐞𝐩𝐥𝐲 𝐰𝐢𝐭𝐡 𝐧𝐮𝐦𝐛𝐞𝐫 𝐭𝐨 𝐩𝐥𝐚𝐲 𝐭𝐡𝐞 𝐬𝐨𝐧𝐠!",
      attachment: await Promise.all(thumbnails)
    }, event.threadID, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName,
        messageID: info.messageID,
        author: event.senderID,
        result
      });
    }, event.messageID);
  },

  onReply: async ({ event, api, Reply }) => {
    try {
      const { result } = Reply;
      const choice = parseInt(event.body);
      if (!isNaN(choice) && choice <= result.length && choice > 0) {
        const infoChoice = result[choice - 1];
        const idvideo = infoChoice.id;

        const { data: { title, downloadLink } } = await axios.get(
          `${await baseApiUrl()}/ytDl2?link=https://m.youtube.com/watch?v=${idvideo}&format=mp3`
        );

        await api.unsendMessage(Reply.messageID);

        return api.sendMessage({
          body: `🎧 𝐒𝐨𝐧𝐠: ${title}\n\n📥 𝐄𝐧𝐣𝐨𝐲 𝐲𝐨𝐮𝐫 𝐦𝐮𝐬𝐢𝐜!`,
          attachment: await dipto(downloadLink, "audio.mp3")
        }, event.threadID, event.messageID);
      } else {
        return api.sendMessage("🚫 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 𝐧𝐮𝐦𝐛𝐞𝐫. 𝐄𝐧𝐭𝐞𝐫 𝟏-𝟔.", event.threadID, event.messageID);
      }
    } catch (error) {
      console.log(error);
      return api.sendMessage("❌ 𝐀𝐮𝐝𝐢𝐨 𝐝𝐨𝐰𝐧𝐥𝐨𝐚𝐝 𝐟𝐚𝐢𝐥𝐞𝐝. 𝐅𝐢𝐥𝐞 𝐦𝐢𝐠𝐡𝐭 𝐛𝐞 𝐜𝐨𝐫𝐫𝐮𝐩𝐭𝐞𝐝 𝐨𝐫 𝐛𝐢𝐠.", event.threadID, event.messageID);
    }
  }
};

async function dipto(url, pathName) {
  try {
    const response = await axios.get(url, { responseType: "stream" });
    response.data.path = pathName;
    return response.data;
  } catch (err) {
    throw err;
  }
}
