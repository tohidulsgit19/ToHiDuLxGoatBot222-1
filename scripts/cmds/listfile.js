const fs = require('fs');
const path = require('path');

module.exports = {
	config: {
		name: "listfile",
		version: "2.0",
		author: "xnil6x",
		countDown: 5,
		role: 0,
		shortDescription: "List files or show file content",
		longDescription: "Shows files in a folder or content of a file",
		category: "owner",
		guide: "{pn} <path>. Ex: /listfile scripts/cmds or /listfile index.js"
	},

	onStart: async function ({ api, event, args }) {
		const adminIDs = ["100001986888287"];

		if (!adminIDs.includes(event.senderID)) {
			return api.sendMessage("⛔ You are not authorized to use this command.", event.threadID, event.messageID);
		}

		const targetPath = args.join(" ");
		if (!targetPath) return api.sendMessage("Please provide a file or folder path.", event.threadID, event.messageID);

		const fullPath = path.resolve(targetPath);

		if (!fs.existsSync(fullPath)) {
			return api.sendMessage("❌ Path does not exist.", event.threadID, event.messageID);
		}

		try {
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				const files = fs.readdirSync(fullPath);
				api.sendMessage(`📁 Files in ${targetPath}:\n\n${files.join("\n")}`, event.threadID, event.messageID);
			} else if (stat.isFile()) {
				const content = fs.readFileSync(fullPath, 'utf8');
				if (content.length > 20000) {
					return api.sendMessage("⚠️ File too large to display.", event.threadID, event.messageID);
				}
				api.sendMessage(`📄 Content of ${targetPath}:\n\n${content}`, event.threadID, event.messageID);
			} else {
				api.sendMessage("Not a valid file or directory.", event.threadID, event.messageID);
			}
		} catch (e) {
			api.sendMessage("Error reading the path.", event.threadID, event.messageID);
		}
	}
};