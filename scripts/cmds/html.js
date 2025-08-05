const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "html",
    version: "1.0",
    author: "xnil6x",
    countDown: 3,
    role: 3, // This is correct for premium-only
    usePrefix: true,
    shortDescription: "Convert HTML to image",
    longDescription: "Send HTML and get back a rendered image using API",
    category: "utility",
    guide: {
      en: "{p}{n} <html content>"
    }
  },


 onStart: async function ({ args, message }) {
 const html = args.join(" ");
 if (!html) return message.reply("⚠️ Please provide HTML content to convert.");

 try {
 const url = `https://fastrestapis.fasturl.cloud/tool/htmltoimage?html=${encodeURIComponent(html)}`;
 const res = await axios.get(url, { responseType: "arraybuffer" });

 const filePath = path.join(__dirname, "html_output.png");
 fs.writeFileSync(filePath, Buffer.from(res.data, "binary"));

 return message.reply(
 {
 body: "✅ Here's your HTML rendered as an image:",
 attachment: fs.createReadStream(filePath)
 },
 () => fs.unlinkSync(filePath)
 );
 } catch (err) {
 console.error(err);
 return message.reply("❌ Failed to convert HTML to image.");
 }
 }
};