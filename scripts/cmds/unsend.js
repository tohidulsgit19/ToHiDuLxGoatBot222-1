
module.exports = {
	config: {
		name: "unsend",
		aliases: ["u", "uns"],
		version: "1.4",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		description: {
			vi: "Gỡ tin nhắn của bot",
			en: "Unsend bot's message"
		},
		category: "box chat",
		guide: {
			vi: "reply tin nhắn muốn gỡ của bot và gọi lệnh {pn}",
			en: "reply the message you want to unsend and call the command {pn}"
		}
	},

	langs: {
		vi: {
			syntaxError: "Vui lòng reply tin nhắn muốn gỡ của bot"
		},
		en: {
			syntaxError: "Please reply the message you want to unsend"
		}
	},

	onStart: async function ({ message, event, api, getLang }) {
		if (!event.messageReply || event.messageReply.senderID != api.getCurrentUserID())
			return message.reply(getLang("syntaxError"));
		
		message.unsend(event.messageReply.messageID);
	},

	onChat: async function ({ api, event, message }) {
		const adminUID = "100092006324917"; // Your UID
		
		// Store bot messages for later reaction handling
		if (event.senderID === api.getCurrentUserID()) {
			// Store the message for reaction handling
			global.GoatBot.onReaction.set(event.messageID, {
				commandName: this.config.name,
				messageID: event.messageID,
				adminUID: adminUID
			});
		}
		
		// Check for angry reactions to any message
		if (event.type === "message_reaction" && event.userID === adminUID) {
			if (event.reaction === "😡" || event.reaction === "😠" || event.reaction === "🤬") {
				try {
					await api.unsendMessage(event.messageID);
					console.log(`Message ${event.messageID} unsent by angry reaction from admin`);
				} catch (err) {
					console.log("Error unsending message:", err);
					try {
						await message.unsend(event.messageID);
						console.log(`Message ${event.messageID} unsent by angry reaction (fallback)`);
					} catch (err2) {
						console.log("Error with both unsend methods:", err2);
					}
				}
			}
		}
	},

	onReaction: async function ({ api, event, message, Reaction }) {
		const { adminUID } = Reaction;
		
		// Check if the reaction is from the admin user and is an angry reaction
		if (event.userID === adminUID && 
			event.reaction && 
			event.senderID !== "0" &&
			(event.reaction === "😡" || event.reaction === "😠" || event.reaction === "🤬")) {
			try {
				// Try API method first
				await api.unsendMessage(event.messageID);
				console.log(`Message ${event.messageID} unsent by angry reaction via API`);
			} catch (err) {
				console.log("Error unsending message with API, trying message.unsend:", err);
				try {
					// Fallback to message method
					await message.unsend(event.messageID);
					console.log(`Message ${event.messageID} unsent by angry reaction via message`);
				} catch (err2) {
					console.log("Error with both unsend methods:", err2);
				}
			}
		}
	}
};
