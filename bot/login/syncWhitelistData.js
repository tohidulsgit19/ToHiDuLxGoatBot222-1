
const { writeFileSync } = require("fs-extra");

module.exports = async function syncWhitelistOnStart() {
	const { config } = global.GoatBot;
	const { client } = global;

	// Only sync if MongoDB is being used and config whitelist is empty
	if (global.GoatBot.config.database.type !== "mongodb") return;
	
	try {
		const configWhitelist = config.whiteListModeThread.whiteListThreadIds || [];
		
		// If config has no whitelist data, try to sync from MongoDB
		if (configWhitelist.length === 0) {
			const allThreads = await global.db.threadsData.getAll();
			const whitelistedFromDB = [];
			
			for (const thread of allThreads) {
				if (thread.settings && thread.settings.isWhitelisted === true) {
					whitelistedFromDB.push(thread.threadID);
				}
			}
			
			if (whitelistedFromDB.length > 0) {
				config.whiteListModeThread.whiteListThreadIds = whitelistedFromDB;
				writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));
				console.log(`📊 Bot startup: Synced ${whitelistedFromDB.length} whitelist threads from MongoDB to config`);
			}
		} else {
			// If config has data, sync to MongoDB for consistency
			for (const threadID of configWhitelist) {
				try {
					const threadData = await global.db.threadsData.get(threadID);
					if (threadData && (!threadData.settings || !threadData.settings.isWhitelisted)) {
						await global.db.threadsData.set(threadID, true, "settings.isWhitelisted");
					}
				} catch (error) {
					// Thread might not exist in DB yet, skip
				}
			}
			console.log(`📊 Bot startup: Synced ${configWhitelist.length} whitelist threads from config to MongoDB`);
		}
	} catch (error) {
		console.log("❌ Error syncing whitelist data on startup:", error);
	}
};
