const axios = require("axios");

module.exports = {
 config: {
 name: "ss",
 version: "1.0",
 author: "xnil6x",
 countDown: 5,
 role: 2,
 shortDescription: "Website screenshot",
 longDescription: "Takes screenshot of a given website and sends the image",
 category: "utility",
 guide: "{pn} <url>"
 },

 onStart: async function ({ api, event, args }) {
 const url = args[0];

 if (!url || !url.startsWith("http")) {
 return api.sendMessage("❌ Please provide a valid URL.\nExample: /webshot https://example.com", event.threadID, event.messageID);
 }

 const shotURL = `https://image.thum.io/get/width/1200/crop/900/noanimate/${url}`;

 try {
 const res = await axios.get(shotURL, { responseType: "stream" });
 return api.sendMessage({ body: `🖼️ Screenshot of: ${url}`, attachment: res.data }, event.threadID, event.messageID);
 } catch (e) {
 return api.sendMessage("❌ Failed to take screenshot. The site may be down or restricted.", event.threadID, event.messageID);
 }
 }
};