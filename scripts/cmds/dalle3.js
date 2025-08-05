const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "d3",
    version: "1.0",
    author: "xnil6x",
    role: 2,
    usePrefix: false,
    shortDescription: {
      en: "Generate images using DALL·E 3 API"
    },
    longDescription: {
      en: "Create high-quality images from text prompts using MJUnlimited's DALL·E 3 API"
    },
    category: "AI",
    guide: {
      en: "{p}dalle3 <prompt>"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    try {
      const prompt = args.join(" ");
      
      if (!prompt) {
        return message.reply("❌ Please provide an image generation prompt. Example: {p}dalle3 a cat wearing sunglasses");
      }

      message.reply("🖌️ Generating your image... Please wait...");

      // Call the API to get image info
      const apiUrl = `https://mjunlimited.onrender.com/gen?prompt=${encodeURIComponent(prompt)}&api_key=xnil6xxx11`;
      const response = await axios.get(apiUrl);

      const imageUrl = response.data?.original_images?.info?.imageUrl?.[0];

      if (!imageUrl) {
        throw new Error("Image URL not found in response");
      }

      // Download the image from URL
      const imageBuffer = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const tempPath = path.join(__dirname, 'temp_dalle.png');
      fs.writeFileSync(tempPath, imageBuffer.data);

      // Send the image
      message.reply({
        body: `🖼️ Here's your generated image for: "${prompt}"`,
        attachment: fs.createReadStream(tempPath)
      }, () => {
        fs.unlinkSync(tempPath); // delete the file after sending
      });

    } catch (error) {
      console.error("DALL·E 3 Error:", error);
      message.reply("⚠️ Failed to generate image. Please try again later.");
    }
  }
};
