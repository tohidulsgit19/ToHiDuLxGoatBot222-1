const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "post",
    version: "1.1",
    author: "Tohidul",
    countDown: 5,
    role: 1,
    description: {
      en: "Post replied content (photo/video/text) to bot's own ID or mentioned user's ID"
    },
    category: "box chat",
    guide: {
      en: "{pn} [@mention or nothing] [caption] (reply to photo/video/text)"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const botID = api.getCurrentUserID();

    if (!event.messageReply)
      return message.reply("❌ Please reply to a photo, video, or text to post.");

    // Determine target UID
    let targetUID = botID;
    let caption = "";

    if (event.mentions && Object.keys(event.mentions).length > 0) {
      targetUID = Object.keys(event.mentions)[0];
      // remove mention tag from args
      const mentionText = Object.values(event.mentions)[0].replace(/@/g, "");
      caption = args.join(" ").replace(mentionText, "").trim();
    } else {
      caption = args.join(" ").trim();
    }

    // Prepare temp folder
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    try {
      // If there are attachments (photo/video)
      if (event.messageReply.attachments && event.messageReply.attachments.length > 0) {
        for (const att of event.messageReply.attachments) {
          const fileExt = att.type === "photo" ? "jpg" : att.type === "video" ? "mp4" : null;
          if (!fileExt) continue;

          const filePath = path.join(cacheDir, `post_${Date.now()}.${fileExt}`);
          const res = await axios.get(att.url, { responseType: "arraybuffer" });
          fs.writeFileSync(filePath, Buffer.from(res.data));

          await api.sendMessage(
            {
              body: caption || "",
              attachment: fs.createReadStream(filePath)
            },
            targetUID
          );

          fs.unlinkSync(filePath);
        }
      }
      // If reply is text only
      else if (event.messageReply.body) {
        await api.sendMessage(
          caption ? `${caption}\n\n${event.messageReply.body}` : event.messageReply.body,
          targetUID
        );
      }

      message.reply(
        targetUID === botID
          ? "✅ Posted to bot's own inbox."
          : `✅ Posted to mentioned user's inbox (ID: ${targetUID}).`
      );
    } catch (err) {
      console.error("Post command error:", err);
      message.reply("❌ Failed to post content.");
    }
  }
};
