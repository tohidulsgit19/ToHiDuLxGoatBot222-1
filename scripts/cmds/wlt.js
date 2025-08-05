const { config } = global.GoatBot;
const { client } = global;
const { writeFileSync } = require("fs-extra");

// MongoDB sync functions
async function saveToMongoDB(threadID, action = 'add') {
	if (global.GoatBot.config.database.type !== "mongodb") return;
	
	try {
		const threadData = await global.db.threadsData.get(threadID);
		if (!threadData) return;

		if (action === 'add') {
			await global.db.threadsData.set(threadID, true, "settings.isWhitelisted");
		} else if (action === 'remove') {
			await global.db.threadsData.set(threadID, false, "settings.isWhitelisted");
		}
	} catch (error) {
		console.log("Error syncing whitelist to MongoDB:", error);
	}
}

async function syncWhitelistFromMongoDB() {
	if (global.GoatBot.config.database.type !== "mongodb") return;
	
	try {
		const allThreads = await global.db.threadsData.getAll();
		const whitelistedFromDB = [];
		
		for (const thread of allThreads) {
			if (thread.settings && thread.settings.isWhitelisted === true) {
				whitelistedFromDB.push(thread.threadID);
			}
		}
		
		// Merge with config whitelist
		const configWhitelist = config.whiteListModeThread.whiteListThreadIds || [];
		const mergedList = [...new Set([...configWhitelist, ...whitelistedFromDB])];
		
		// Update config if there are new threads from MongoDB
		if (mergedList.length !== configWhitelist.length) {
			config.whiteListModeThread.whiteListThreadIds = mergedList;
			writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));
			console.log(`📊 Synced ${whitelistedFromDB.length} whitelist threads from MongoDB to config`);
		}
	} catch (error) {
		console.log("Error syncing whitelist from MongoDB:", error);
	}
}

module.exports = {
	config: {
		name: "whitelistthread",
		aliases: ["wlt", "wt"],
		version: "1.6",
		author: "NTKhang & Modified by You",
		countDown: 5,
		role: 2,
		description: {
			en: "Manage whitelist threads"
		},
		category: "owner",
		guide: {
			en: '   {pn} [add | -a | +] [<tid>...]: Add thread(s) to whitelist'
				+ '\n   {pn} [remove | -r | -] [<tid>...]: Remove thread(s) from whitelist'
				+ '\n   {pn} [list | -l]: Show all whitelisted thread IDs'
				+ '\n   {pn} [mode | -m] <on|off>: Turn whitelist mode on/off'
				+ '\n   {pn} [mode | -m] noti <on|off>: Turn notification on/off for blocked threads'
				+ '\n   {pn} [sync | -s]: Sync whitelist data from MongoDB to config'
				+ '\n   {pn}: Add current thread to whitelist (shortcut)'
		}
	},

	langs: {
		en: {
			added: `✅ | Added %1 thread(s) to whitelist:\n%2`,
			alreadyWLT: `⚠️ | Already in whitelist (%1):\n%2`,
			missingTIDAdd: "⚠️ | Please enter thread ID(s) to add to whitelist.",
			removed: `✅ | Removed %1 thread(s) from whitelist:\n%2`,
			notAdded: `❎ | These thread(s) were not in whitelist:\n%2`,
			listWLTs: `📌 | Whitelisted Threads:\n%1`,
			turnedOn: "✅ | Whitelist mode is now ON.",
			turnedOff: "❎ | Whitelist mode is now OFF.",
			turnedOnNoti: "✅ | Notification for non-whitelisted threads is ON.",
			turnedOffNoti: "❎ | Notification for non-whitelisted threads is OFF."
		}
	},

	onStart: async function ({ message, args, event, getLang, api }) {
		switch (args[0]) {
			case undefined: // Just 'wlt' written
			case "add":
			case "-a":
			case "+": {
				let tids = args.slice(1).filter(arg => !isNaN(arg));
				if (tids.length === 0) {
					const currentTid = event.threadID;
					if (!config.whiteListModeThread.whiteListThreadIds.includes(currentTid)) {
						config.whiteListModeThread.whiteListThreadIds.push(currentTid);
						writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));
						
						// Save to MongoDB
						await saveToMongoDB(currentTid, 'add');

						const threadInfo = await api.getThreadInfo(currentTid);
						const threadName = threadInfo?.threadName || "Unnamed";

						const styledMsg = `╭───✅ 𝚃𝙷𝚁𝙴𝙰𝙳 𝙰𝙳𝙳𝙴𝙳\n│ 🏷️ 𝙽𝙰𝙼𝙴: ${threadName}\n│ 🆔 𝚃𝙷𝚁𝙴𝙰𝙳 𝙸𝙳: ${currentTid}\n│ 💾 𝚂𝙰𝚅𝙴𝙳: Config + MongoDB\n╰────────────────────`;
						return api.sendMessage(styledMsg, currentTid);
					} else {
						return message.reply("⚠️ | This thread is already whitelisted.");
					}
				}

				const notWLTIDs = [];
				const alreadyWLT = [];
				for (const tid of tids) {
					if (!config.whiteListModeThread.whiteListThreadIds.includes(tid))
						notWLTIDs.push(tid);
					else
						alreadyWLT.push(tid);
				}

				config.whiteListModeThread.whiteListThreadIds.push(...notWLTIDs);
				writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));

				// Save to MongoDB
				for (const tid of notWLTIDs) {
					await saveToMongoDB(tid, 'add');
				}

				const getNames = await Promise.all(notWLTIDs.map(async tid => {
					const d = await api.getThreadInfo(tid) || {};
					return `├ 🆔 ${tid}\n╰ 🏷️ ${d.threadName || "Unknown"}`;
				}));

				const alreadyList = alreadyWLT.map(tid => `╰ 🆔 ${tid}`).join("\n");

				return message.reply(
					(notWLTIDs.length > 0 ? getLang("added", notWLTIDs.length, getNames.join("\n")) : "") +
					(alreadyWLT.length > 0 ? "\n\n" + getLang("alreadyWLT", alreadyWLT.length, alreadyList) : "")
				);
			}

			case "remove":
			case "rm":
			case "-r":
			case "-": {
				let tids = args.slice(1).filter(arg => !isNaN(arg));
				if (tids.length === 0) {
					tids.push(event.threadID);
				}

				const removed = [];
				const notFound = [];

				for (const tid of tids) {
					const index = config.whiteListModeThread.whiteListThreadIds.indexOf(tid);
					if (index !== -1) {
						config.whiteListModeThread.whiteListThreadIds.splice(index, 1);
						removed.push(tid);
						// Remove from MongoDB
						await saveToMongoDB(tid, 'remove');
					} else {
						notFound.push(tid);
					}
				}

				writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));

				const getNames = await Promise.all(removed.map(async tid => {
					const d = await api.getThreadInfo(tid) || {};
					return `├ 🆔 ${tid}\n╰ 🏷️ ${d.threadName || "Unknown"}`;
				}));

				const notAddedList = notFound.map(tid => `╰ 🆔 ${tid}`).join("\n");

				return message.reply(
					(removed.length > 0 ? getLang("removed", removed.length, getNames.join("\n")) : "") +
					(notFound.length > 0 ? "\n\n" + getLang("notAdded", notFound.length, notAddedList) : "")
				);
			}

			case "list":
			case "-l": {
				const list = await Promise.all(config.whiteListModeThread.whiteListThreadIds.map(async tid => {
					const t = await api.getThreadInfo(tid) || {};
					return `├ 🆔 ${tid}\n╰ 🏷️ ${t.threadName || "Unnamed"}`;
				}));
				return message.reply(getLang("listWLTs", list.join("\n")));
			}

			case "mode":
			case "m":
			case "-m": {
				let isSetNoti = false;
				let value;
				let indexGetVal = 1;

				if (args[1] == "noti") {
					isSetNoti = true;
					indexGetVal = 2;
				}

				if (args[indexGetVal] == "on") value = true;
				else if (args[indexGetVal] == "off") value = false;

				if (typeof value === "undefined") {
					return message.reply("⚠️ | Please specify 'on' or 'off'");
				}

				if (isSetNoti) {
					config.hideNotiMessage.whiteListModeThread = !value;
					message.reply(getLang(value ? "turnedOnNoti" : "turnedOffNoti"));
				} else {
					config.whiteListModeThread.enable = value;
					message.reply(getLang(value ? "turnedOn" : "turnedOff"));
				}

				writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));
				break;
			}

			case "sync":
			case "-s": {
				await syncWhitelistFromMongoDB();
				return message.reply("✅ | Whitelist data synced from MongoDB to config!");
			}

			default:
				return message.reply(getLang("missingTIDAdd"));
		}
	}
};
