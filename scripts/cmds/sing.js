const axios = require("axios");
const fs = require("fs");

const baseApiUrl = async () => {
  const res = await axios.get("https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json");
  return res.data.api;
};

module.exports = {
  config: {
    name: "sing",
    version: "2.1.1",
    author: "dipto",
    countDown: 5,
    role: 0,
    shortDescription: "Download audio from YouTube",
    longDescription: "Search or paste a YouTube link to download audio in mp3",
    category: "media",
    guide: {
      en: "{pn} <song name or YouTube link>\nExample:\n{pn} chipi chipi chapa chapa"
    }
  },

  onStart: async function ({ api, event, args, commandName }) {
    const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
    const isYTLink = checkurl.test(args[0]);

    if (isYTLink) {
      const videoID = args[0].match(checkurl)[1];
      try {
        const { data: { title, downloadLink, quality } } = await axios.get(`${await baseApiUrl()}/ytDl3?link=${videoID}&format=mp3`);
        return api.sendMessage({
          body: `🎧 Title: ${title}\n🎼 Quality: ${quality}`,
          attachment: await downloadAudio(downloadLink, "audio.mp3")
        }, event.threadID, () => fs.unlinkSync("audio.mp3"), event.messageID);
      } catch (e) {
        return api.sendMessage("❌ Download failed. Try again.", event.threadID, event.messageID);
      }
    }

    // Search by keyword
    const keyword = args.join(" ").replace("?feature=share", "");
    let results;

    try {
      results = (await axios.get(`${await baseApiUrl()}/ytFullSearch?songName=${keyword}`)).data.slice(0, 6);
    } catch (err) {
      return api.sendMessage("❌ Failed to search. Please try again later.", event.threadID, event.messageID);
    }

    if (results.length === 0) {
      return api.sendMessage(`❌ No results found for:\n🔎 ${keyword}`, event.threadID, event.messageID);
    }

    let msg = "🎶 Search Results:\n\n";
    const thumbs = [];

    for (let i = 0; i < results.length; i++) {
      const { title, time, channel, thumbnail } = results[i];
      msg += `🔹 ${i + 1}. ${title}\n⏱ ${time} | 📺 ${channel.name}\n\n`;
      thumbs.push(downloadImage(thumbnail, `thumb${i + 1}.jpg`));
    }

    api.sendMessage({
      body: msg + "📝 Reply with a number (1-6) to select a song",
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
      return api.sendMessage("❌ Invalid choice. Please enter a number between 1 and 6.", event.threadID, event.messageID);
    }

    const selected = result[choice - 1];
    const videoID = selected.id;

    try {
      const { data: { title, downloadLink, quality } } = await axios.get(`${await baseApiUrl()}/ytDl3?link=${videoID}&format=mp3`);
      await api.unsendMessage(Reply.messageID);
      return api.sendMessage({
        body: `🎵 Title: ${title}\n🎼 Quality: ${quality}`,
        attachment: await downloadAudio(downloadLink, "audio.mp3")
      }, event.threadID, () => fs.unlinkSync("audio.mp3"), event.messageID);
    } catch (err) {
      console.error(err);
      return api.sendMessage("⚠️ Sorry! Unable to download the audio. File may be large or link is broken.", event.threadID, event.messageID);
    }
  }
};

// Helper to download audio and save locally
async function downloadAudio(url, filename) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(filename, Buffer.from(res.data));
  return fs.createReadStream(filename);
}

// Helper to stream image thumbnails
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
