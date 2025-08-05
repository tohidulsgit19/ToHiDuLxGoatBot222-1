const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
	config: {
		name: "married",
		aliases: ["married"],
		version: "1.0",
		author: "kivv",
		countDown: 5,
		role: 0,
		shortDescription: "Get a wife",
		longDescription: "",
		category: "married",
		guide: "{@mention}",
	},

	onLoad: async function () {
		const dirMaterial = path.resolve(__dirname, "cache", "canvas");
		if (!fs.existsSync(dirMaterial)) {
			fs.mkdirSync(dirMaterial, { recursive: true });
		}
		const bgPath = path.resolve(dirMaterial, "marriedv5.png");
		if (!fs.existsSync(bgPath)) {
			const url = "https://i.ibb.co/mhxtgwm/49be174dafdc259030f70b1c57fa1c13.jpg";
			const response = await axios.get(url, { responseType: "arraybuffer" });
			fs.writeFileSync(bgPath, Buffer.from(response.data));
		}
	},

	createCircleImage: async function (image) {
		const size = 512;
		const canvas = createCanvas(size, size);
		const ctx = canvas.getContext("2d");

		ctx.beginPath();
		ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.clip();

		ctx.drawImage(image, 0, 0, size, size);

		return canvas;
	},

	makeImage: async function ({ one, two }) {
		const dirCanvas = path.resolve(__dirname, "cache", "canvas");
		const bgPath = path.resolve(dirCanvas, "marriedv5.png");
		const outPath = path.resolve(dirCanvas, `married_${one}_${two}.png`);

		const background = await loadImage(bgPath);

		const urlOne = `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
		const urlTwo = `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

		const avatarOne = await loadImage(urlOne);
		const avatarTwo = await loadImage(urlTwo);

		const circleOneCanvas = await this.createCircleImage(avatarOne);
		const circleTwoCanvas = await this.createCircleImage(avatarTwo);

		const canvas = createCanvas(background.width, background.height);
		const ctx = canvas.getContext("2d");

		ctx.drawImage(background, 0, 0);

		// আগের মতোই পজিশন আর সাইজ
		ctx.drawImage(circleOneCanvas, 300, 150, 130, 130);
		ctx.drawImage(circleTwoCanvas, 170, 230, 130, 130);

		const buffer = canvas.toBuffer("image/png");
		fs.writeFileSync(outPath, buffer);

		return outPath;
	},

	onStart: async function ({ event, api }) {
		const { threadID, messageID, senderID } = event;
		const mention = Object.keys(event.mentions);
		if (!mention[0]) {
			return api.sendMessage("Please mention 1 person.", threadID, messageID);
		} else {
			const one = senderID,
				two = mention[0];
			const pathImg = await this.makeImage({ one, two });
			return api.sendMessage(
				{ body: "", attachment: fs.createReadStream(pathImg) },
				threadID,
				() => fs.unlinkSync(pathImg),
				messageID
			);
		}
	},
};
