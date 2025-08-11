const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "post",
    version: "1.0",
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

    let targetUID = botID; // default = bot's own ID
    let caption = "";

    // যদি mention থাকে
    if (Object.keys(event.mentions).length > 0) {
      targetUID = Object.keys(event.mentions)[0];
      caption = args.slice(1).join(" ") || "";
    } else {
      caption = args.join(" ") || "";
    }

    const tempPath = path.join(__dirname, "cache", `post_${Date.now()}`);

    try {
      // Attachment থাকলে (photo/video)
      if (event.messageReply.attachments?.length > 0) {
        for (const att of event.messageReply.attachments) {
          const fileExt =
            att.type === "photo"
              ? "jpg"
              : att.type === "video"
              ? "mp4"
              : null;
          if (!fileExt) continue;

          const filePath = `${tempPath}.${fileExt}`;
          const res = await axios.get(att.url, { responseType: "arraybuffer" });
          fs.writeFileSync(filePath, Buffer.from(res.data, "binary"));

          await api.sendMessage(
            {
              body: caption,
              attachment: fs.createReadStream(filePath)
            },
            targetUID
          );

          fs.unlinkSync(filePath);
        }
      }
      // শুধুই টেক্সট হলে
      else if (event.messageReply.body) {
        await api.sendMessage(
          caption
            ? `${caption}\n\n${event.messageReply.body}`
            : event.messageReply.body,
          targetUID
        );
      }

      message.reply(
        targetUID === botID
          ? "✅ Posted to bot's own inbox."
          : `✅ Posted to mentioned user's inbox (ID: ${targetUID}).`
      );
    } catch (err) {
      console.error(err);
      message.reply("❌ Failed to post content.");
    }
  }
};
