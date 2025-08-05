const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");

const fontList = [
  {
    name: "UTM",
    url: "https://github.com/hanakuUwU/font/blob/main/UTM%20Avo.ttf?raw=true",
    file: "UTM-Avo.ttf"
  },
  {
    name: "phenomicon",
    url: "https://github.com/hanakuUwU/font/raw/main/phenomicon.ttf",
    file: "phenomicon.ttf"
  },
  {
    name: "CaviarDreams",
    url: "https://github.com/hanakuUwU/font/raw/main/CaviarDreams.ttf",
    file: "CaviarDreams.ttf"
  }
];

module.exports = {
  config: {
    name: "banner",
    version: "1.0.0",
    author: "Hanaku (fixed by mdshamsuzzaman)",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Anime-style profile banner",
    },
    longDescription: {
      en: "Create an anime-style banner with your name and social info.",
    },
    category: "image",
    guide: {
      en: "Use: banner → then reply as guided to select character, frame, and text."
    }
  },

  onStart: async function ({ message, event }) {
    // Initialize handleReply array if missing
    if (!global.client.handleReply) global.client.handleReply = [];

    // Download fonts if missing
    for (const font of fontList) {
      const fontPath = path.join(__dirname, "cache", font.file);
      if (!fs.existsSync(fontPath)) {
        console.log(`Downloading font ${font.file}...`);
        const data = (await axios.get(font.url, { responseType: "arraybuffer" })).data;
        fs.ensureDirSync(path.join(__dirname, "cache"));
        fs.writeFileSync(fontPath, Buffer.from(data));
        console.log(`Font ${font.file} downloaded.`);
      }
      // Register font to canvas
      registerFont(fontPath, { family: font.name });
    }

    // Send prompt message to user and push handleReply
    try {
      const info = await message.reply("📌 Reply to this message with your character ID (e.g. 1-848)");
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        step: 1,
        author: event.senderID
      });
    } catch (error) {
      console.error("Error sending message or setting handleReply:", error);
    }
  },

  handleReply: async function ({ event, api, handleReply, message }) {
    console.log(`[banner handleReply] senderID: ${event.senderID}, author: ${handleReply.author}, step: ${handleReply.step}`);

    if (event.senderID !== handleReply.author) return;

    if (handleReply.step === 1) {
      try {
        // Remove prompt message
        await api.unsendMessage(handleReply.messageID);

        // Get user reply text (character ID)
        const id = event.body.trim();

        // Here you can add further steps, validations, or image generation with the ID
        return message.reply(`✅ Character ID "${id}" selected. (Further steps can be implemented here.)`);
      } catch (error) {
        console.error("Error in handleReply step 1:", error);
      }
    }
  }
};
