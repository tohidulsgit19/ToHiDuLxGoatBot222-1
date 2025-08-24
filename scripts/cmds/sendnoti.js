const { getStreamsFromAttachment } = global.utils;

module.exports = {
	config: {
		name: "sendnoti",
		version: "3.5",
		author: "NTKhang | Remade by You",
		countDown: 5,
		role: 0,
		description: {
			en: "Send message to all chats in whitelist"
		},
		category: "box chat",
		guide: {
			en: "{pn} <message> → Send message to all chats in your whitelist"
		}
	},

	langs: {
		en: {
			noWhitelist: "❌ Your whitelist is empty. Add chats to 'data.whitelistThreadIDs' first.",
			sending: "📤 Sending message to %1 chats in whitelist...",
			success: "✅ Sent message to %1 chats!",
			failed: "❌ Failed in %1 chats:\n%2",
			notAdmin: "❌ You're not admin in this chat"
		}
	},

	onStart: async function ({ message, event, args, usersData, threadsData, api, getLang, role }) {
		const { senderID, attachments, messageReply } = event;
		const msg = args.join(" ").trim();
		if (!msg) return message.reply("❗ Please enter the message to send.");

		// Get whitelist list from userData
		const whitelist = await usersData.get(senderID, "data.whitelistThreadIDs", []);
		if (!whitelist.length) return message.reply(getLang("noWhitelist"));

		const sendForm = { body: msg };

		// Add attachments
		const allAttachments = [...attachments, ...(messageReply?.attachments || [])];
		if (allAttachments.length) {
			sendForm.attachment = await getStreamsFromAttachment(
				allAttachments.filter(a =>
					["photo", "video", "audio", "animated_image", "png"].includes(a.type)
				)
			);
		}

		let sent = 0;
		const fails = [];

		await message.reply(getLang("sending", whitelist.length));

		for (const tid of whitelist) {
			try {
				const { adminIDs } = await threadsData.get(tid);
				if (!adminIDs.includes(senderID)) throw getLang("notAdmin");

				await new Promise((res, rej) =>
					api.sendMessage(sendForm, tid, err => err ? rej(err) : res())
				);

				sent++;
			} catch (err) {
				fails.push(`• ${tid}: ${typeof err === "string" ? err : "Unknown error"}`);
			}
			await new Promise(r => setTimeout(r, 1000));
		}

		let result = getLang("success", sent);
		if (fails.length)
			result += "\n\n" + getLang("failed", fails.length, fails.join("\n"));

		message.reply(result);
	}
};
