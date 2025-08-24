const axios = require('axios');
const fs = require('fs');
const path = require('path');

const xyz = "ArYANAHMEDRUDRO";

// small unicode conversion helper
function toSmallFont(text) {
  const smallMap = {
    'a':'ᵃ','b':'ᵇ','c':'ᶜ','d':'ᵈ','e':'ᵉ','f':'ᶠ','g':'ᵍ','h':'ʰ','i':'ⁱ','j':'ʲ','k':'ᵏ',
    'l':'ˡ','m':'ᵐ','n':'ⁿ','o':'ᵒ','p':'ᵖ','q':'ᑫ','r':'ʳ','s':'ˢ','t':'ᵗ','u':'ᵘ','v':'ᵛ',
    'w':'ʷ','x':'ˣ','y':'ʸ','z':'ᶻ','A':'ᴬ','B':'ᴮ','C':'ᶜ','D':'ᴰ','E':'ᴱ','F':'ᶠ','G':'ᴳ',
    'H':'ᴴ','I':'ᴵ','J':'ᴶ','K':'ᴷ','L':'ᴸ','M':'ᴹ','N':'ᴺ','O':'ᴼ','P':'ᴾ','Q':'Q','R':'ᴿ',
    'S':'ˢ','T':'ᵀ','U':'ᵁ','V':'ⱽ','W':'ᵂ','X':'ˣ','Y':'ʸ','Z':'ᶻ','0':'⁰','1':'¹','2':'²',
    '3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'
  };
  return text.split('').map(c => smallMap[c] || c).join('');
}

module.exports = {
  config: {
    name: "4k",
    version: "1.2",
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
      return api.sendMessage(toSmallFont("❌ KON PHOTO 4K KORBI OITAR REPLY TO KOR BBLOD 😤"), threadID, messageID);
    }

    try {
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const processingMsg = await api.sendMessage(toSmallFont("🔄 4K KORAR KAJ CHOLCHE CHUP CHAP THAK 😑🙏"), threadID);

      const apiUrl = `https://aryan-xyz-upscale-api-phi.vercel.app/api/upscale-image?imageUrl=${encodeURIComponent(imageUrl)}&apikey=${xyz}`;
      const res = await axios.get(apiUrl);
      const enhancedImageUrl = res.data?.resultImageUrl;

      if (!enhancedImageUrl) {
        throw new Error("URL PAILAM NA BHAI 😩😭🥴");
      }

      const imageBuffer = (await axios.get(enhancedImageUrl, { responseType: 'arraybuffer' })).data;
      fs.writeFileSync(tempImagePath, Buffer.from(imageBuffer));

      try { await api.unsendMessage(processingMsg.messageID); } catch(e){}

      await api.sendMessage({
        body: toSmallFont("✅ NE 4K KORE DILAM EBAR TAKA DE 😌🌚"),
        attachment: fs.createReadStream(tempImagePath)
      }, threadID, () => {
        try { fs.unlinkSync(tempImagePath); } catch (e) {}
        // Clean old cache
        const files = fs.readdirSync(cacheDir);
        for (const file of files) {
          const filePath = path.join(cacheDir, file);
          if (file.startsWith("enhanced_image_")) {
            const stat = fs.statSync(filePath);
            if (Date.now() - stat.mtime.getTime() > 5 * 60 * 1000) fs.unlinkSync(filePath);
          }
        }
      }, messageID);

    } catch (error) {
      console.error("4K Enhancement error:", error.message);
      return api.sendMessage(toSmallFont(`❌ 4K KORTE PARLAM NA BHAI BOSS RE KOO API THIK KORTE 🤕😭!\n\n🔧 Error: ${error.message}`), threadID, messageID);
    }
  }
};
