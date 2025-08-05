const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
 config: {
 name: "sd",
 version: "1.0",
 author: "xnil6x",
 countDown: 5,
 role: 0,
 usePrefix: false,
 shortDescription: "Generate AI image",
 longDescription: "Generate an image using Stable Diffusion API from prompt",
 category: "ai",
 guide: {
 vi: "/sd <prompt>",
 en: "/sd <prompt>"
 }
 },

 onStart: async function ({ args, message }) {
 const prompt = args.join(" ");
 if (!prompt) return message.reply("⚠️ Please enter a prompt.\nExample: /sd a cyberpunk cat");

 const apiUrl = `https://fastrestapis.fasturl.cloud/aiimage/stablediff/advanced?prompt=${encodeURIComponent(prompt)}&negativePrompt=blurry,%20low%20quality,%20deformed,%20extra%20limbs&style=cinematic&size=landscape&seed=2000`;

 try {
 message.reply("⏳ Generating image... please wait.");
 const res = await axios.get(apiUrl, { responseType: "arraybuffer" });

 const imgPath = path.join(__dirname, "sd_result.jpg");
 fs.writeFileSync(imgPath, Buffer.from(res.data, "binary"));

 return message.reply(
 {
 body: `✅ Here is your image for prompt: "${prompt}"`,
 attachment: fs.createReadStream(imgPath)
 },
 () => fs.unlinkSync(imgPath)
 );
 } catch (err) {
 console.error(err);
 return message.reply("❌ Failed to generate image. Please try again.");
 }
 }
};