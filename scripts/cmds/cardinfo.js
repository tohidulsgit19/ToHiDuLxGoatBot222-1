const fs = require("fs-extra");
const axios = require("axios");
const { loadImage, createCanvas, registerFont } = require("canvas");

const FONT_URL = "https://drive.google.com/u/0/uc?id=1uni8AiYk7prdrC7hgAmezaGTMH5R8gW8&export=download";
const FONT_PATH = __dirname + "/cache/Play-Bold.ttf";
const BG_URL = "https://i.ibb.co/RybN9XR/image.jpg";

module.exports = {
  config: {
    name: "cardinfo",
    version: "3.1",
    author: "AceGun | Modified by ChatGPT",
    countDown: 5,
    role: 0,
    category: "image",
    shortDescription: "Generate Facebook style user card without circular avatar",
    guide: {
      en: "{pn} Name - Gender - Followers - Love - DOB - Location - Link"
    }
  },

  onStart: async function ({ api, event, args }) {
    if (!args.join(" ").includes(" - ")) {
      return api.sendMessage("⚠️ Please use this format:\ncardinfo Name - Gender - Followers - Love - DOB - Location - Link", event.threadID, event.messageID);
    }

    const inputs = args.join(" ").split(" - ").map(i => i.trim());
    if (inputs.length < 7) {
      return api.sendMessage("⚠️ You must provide all 7 fields:\nName - Gender - Followers - Love - DOB - Location - Link", event.threadID, event.messageID);
    }

    const [name, gender, followers, love, dob, location, link] = inputs;

    const uid = event.type === "message_reply" ? event.messageReply.senderID : event.senderID;
    const avatarUrl = `https://graph.facebook.com/${uid}/picture?height=512&width=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    // Download font if not exists
    if (!fs.existsSync(FONT_PATH)) {
      const fontData = (await axios.get(FONT_URL, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(FONT_PATH, Buffer.from(fontData, "utf-8"));
    }

    registerFont(FONT_PATH, { family: "Play-Bold" });

    // Download background image
    const bgBuffer = (await axios.get(BG_URL, { responseType: "arraybuffer" })).data;

    // Download avatar image
    const avatarBuffer = (await axios.get(avatarUrl, { responseType: "arraybuffer" })).data;

    // Save temp files
    const bgPath = __dirname + `/cache/card_bg_${uid}.png`;
    const avatarPath = __dirname + `/cache/card_avatar_${uid}.png`;

    fs.writeFileSync(bgPath, Buffer.from(bgBuffer, "utf-8"));
    fs.writeFileSync(avatarPath, Buffer.from(avatarBuffer, "utf-8"));

    // Load images
    const bgImage = await loadImage(bgPath);
    const avatarImage = await loadImage(avatarPath);

    // Create canvas
    const canvas = createCanvas(bgImage.width, bgImage.height);
    const ctx = canvas.getContext("2d");

    // Draw background
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    // Draw avatar as rectangle (no circle)
    const avatarX = 80;
    const avatarY = 73;
    const avatarWidth = 285;
    const avatarHeight = 285;
    ctx.drawImage(avatarImage, avatarX, avatarY, avatarWidth, avatarHeight);

    // Text styles
    ctx.fillStyle = "#000000";
    ctx.textAlign = "start";

    // Draw text fields
    ctx.font = `28px Play-Bold`;
    ctx.fillText(name, 480, 166);
    ctx.fillText(gender, 550, 208);
    ctx.fillText(followers, 550, 244);
    ctx.fillText(love, 550, 281);
    ctx.fillText(dob, 550, 320);
    ctx.fillText(location, 550, 357);
    ctx.fillText(uid, 550, 396);

    ctx.font = `20px Play-Bold`;
    ctx.fillText(link, 154, 465);

    // Save final image
    const outputPath = __dirname + `/cache/card_final_${uid}.png`;
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);

    // Clean temp avatar & bg files
    fs.unlinkSync(bgPath);
    fs.unlinkSync(avatarPath);

    // Send image
    return api.sendMessage({
      attachment: fs.createReadStream(outputPath)
    }, event.threadID, () => fs.unlinkSync(outputPath), event.messageID);
  }
};
