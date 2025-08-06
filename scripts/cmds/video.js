const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "video",
    version: "1.1",
    author: "tas33n",
    countDown: 10,
    role: 0,
    shortDescription: {
      en: "Download low quality YouTube video"
    },
    longDescription: {
      en: "Download video with sound (max 30MB, low quality)"
    },
    category: "media",
    guide: {
      en: "{pn} <YouTube link or keyword>"
    }
  },

  onStart: async function ({ api, event, args }) {
    const query = args.join(" ");
    if (!query) return api.sendMessage("❌ Please provide a YouTube link or search keyword.", event.threadID, event.messageID);

    const msg = await api.sendMessage("🔍 Searching and processing video...", event.threadID);

    try {
      // ✅ Use low-quality (144p-360p) API
      const res = await axios.get(`https://api-samir.onrender.com/ytDl3?link=${encodeURIComponent(query)}&format=mp4`);
      const { title, downloadLink, quality, fileSizeMB } = res.data;

      if (!downloadLink) throw new Error("Download link not found.");

      // ✅ Check file size (max 30MB)
      const fileSize = parseFloat(fileSizeMB);
      if (fileSize > 30) {
        return api.sendMessage(`❌ This video is too large (${fileSizeMB}MB). Please try a shorter or lower quality video.`, event.threadID, event.messageID);
      }

      const videoPath = "video.mp4";
      const response = await axios.get(downloadLink, { responseType: "stream" });
      const writer = fs.createWriteStream(videoPath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({
          body: `🎬 Title: ${title}\n📀 Quality: ${quality} (${fileSizeMB}MB)`,
          attachment: fs.createReadStream(videoPath)
        }, event.threadID, () => {
          fs.unlink(videoPath, err => {
            if (err) console.error("❌ Error deleting video:", err);
          });
        }, event.messageID);
      });

      writer.on("error", err => {
        console.error("❌ Error writing video file:", err);
        api.sendMessage("❌ Error saving the video.", event.threadID, event.messageID);
      });

    } catch (err) {
      console.error("❌ Video download error:", err);
      api.sendMessage("❌ Couldn't process the video. Please check the link or try again later.", event.threadID, event.messageID);
    }

    api.unsendMessage(msg.messageID);
  }
};
