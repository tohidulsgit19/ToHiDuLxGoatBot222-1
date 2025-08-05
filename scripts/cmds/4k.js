const axios = require('axios');
const fs = require('fs');
const path = require('path');

const xyz = "ArYANAHMEDRUDRO";

module.exports = {
  config: {
    name: "4k",
    version: "1.0.0",
    hasPermssion: 0,
    usePrefix: true,
    credits: "ArYAN",
    category: "image",
    premium: false,
    description: "Enhance Photo - Image Generator",
    commandCategory: "IMAGE",
    usages: "Reply to an image or provide image URL",
    cooldowns: 5,
    dependencies: {}
  },

  onStart: async function({ api, event, args }) {
    const timestamp = Date.now();
    const cacheDir = path.join(__dirname, "cache");
    const tempImagePath = path.join(cacheDir, `enhanced_image_${timestamp}.jpg`);
    const { threadID, messageID } = event;

    const imageUrl = event.messageReply?.attachments?.[0]?.url || args.join(" ");
    if (!imageUrl) {
      return api.sendMessage("❌ KON PHOTO 4K KORBI OITAR REPLY TO KOR BBLOD 😤", threadID, messageID);
    }

    try {
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const processingMsg = await api.sendMessage("🔄 4K KORAR KAJ CHOLCHE CHOP CHAP THAK 😑🙏", threadID);

      const apiUrl = `https://aryan-xyz-upscale-api-phi.vercel.app/api/upscale-image?imageUrl=${encodeURIComponent(imageUrl)}&apikey=${xyz}`;
      const res = await axios.get(apiUrl);
      const enhancedImageUrl = res.data?.resultImageUrl;

      if (!enhancedImageUrl) {
        throw new Error("URL PAILAM NA BHAI 😩😭🥴");
      }

      const imageBuffer = (await axios.get(enhancedImageUrl, { responseType: 'arraybuffer' })).data;
      fs.writeFileSync(tempImagePath, Buffer.from(imageBuffer));

      // Remove loading message
      try {
        await api.unsendMessage(processingMsg.messageID);
      } catch (e) {}

      await api.sendMessage({
        body: "✅ NE 4K KORE DILAM EBAR TAKA DE 😌🌚",
        attachment: fs.createReadStream(tempImagePath)
      }, threadID, () => {
        try { fs.unlinkSync(tempImagePath); } catch (e) {}
        // Clean old cache files
        const files = fs.readdirSync(cacheDir);
        for (const file of files) {
          const filePath = path.join(cacheDir, file);
          if (file.startsWith("enhanced_image_")) {
            const stat = fs.statSync(filePath);
            if (Date.now() - stat.mtime.getTime() > 5 * 60 * 1000) {
              fs.unlinkSync(filePath);
            }
          }
        }
      }, messageID);

    } catch (error) {
      console.error("4K Enhancement error:", error.message);
      return api.sendMessage(`❌ 4K KORTE PARLAM NA BHAI BOSS RE KOO API THIK KORTE 🤕😭!\n\n🔧 Error: ${error.message}`, threadID, messageID);
    }
  }
};
