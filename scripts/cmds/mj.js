const axios = require("axios");
const { getStreamFromURL } = global.utils;

module.exports = {
 config: {
 name: "mj",
 version: "1.0",
 author: "Redwan - xnil",
 countDown: 20,
 role: 2,
 shortDescription: {
 en: "Generate AI art using MidJourney prompt"
 },
 longDescription: {
 en: "Create stunning AI-generated images with a prompt using MidJourney's engine."
 },
 category: "image",
 guide: {
 en: "{pn} <prompt>"
 }
 },

 onStart: async function ({ message, args, event }) {
 const prompt = args.join(" ").trim();
 if (!prompt) return message.reply("⚠️ Please provide a prompt to generate an image.");

 message.reply("⏳ Generating your MidJourney image. Please wait...");

 try {
 const apiUrl = `https://mjunlimited-hpkn.onrender.com/gen?prompt=${encodeURIComponent(prompt)}&api_key=xnil6xxx111`;
 const res = await axios.get(apiUrl);

 if (!res.data?.success || !res.data?.combined_img || !res.data?.original_images) {
 return message.reply("❌ Image generation failed. Please try again later.");
 }

 const collageStream = await getStreamFromURL(res.data.combined_img);
 const images = res.data.original_images;

 message.reply(
 {
 body: "🎨 Here's your generated image collage.\nReply with 1, 2, 3, or 4 to view an individual image.",
 attachment: collageStream
 },
 (err, info) => {
 if (err) return console.error(err);

 global.GoatBot.onReply.set(info.messageID, {
 commandName: this.config.name,
 messageID: info.messageID,
 author: event.senderID,
 images
 });
 }
 );
 } catch (err) {
 console.error("MidJourney API Error:", err);
 return message.reply("❌ An error occurred while generating the image. Please try again later.");
 }
 },

 onReply: async function ({ event, message, Reply }) {
 const { author, images } = Reply;

 if (event.senderID !== author) {
 return message.reply("🚫 Only the original requester can select images.");
 }

 const choice = parseInt(event.body.trim());

 if (isNaN(choice) || choice < 1 || choice > images.length) {
 return message.reply(`⚠️ Please reply with a number between 1 and ${images.length}.`);
 }

 try {
 const selectedImage = await getStreamFromURL(images[choice - 1]);
 return message.reply({
 body: `🖼️ Here is your selected image (${choice}/${images.length}):`,
 attachment: selectedImage
 });
 } catch (err) {
 console.error("Image Retrieval Error:", err);
 return message.reply("❌ Failed to load the selected image. Please try again.");
 }
 }
};