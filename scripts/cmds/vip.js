const fs = require("fs");
const path = require("path");

module.exports = {
	config: {
		name: "vip",
		version: "4.0",
		author: "Admin",
		countDown: 5,
		role: 0,
		description: {
			en: "VIP management system with level-based progression and MongoDB backup"
		},
		category: "vip",
		guide: {
			en: "{pn} check: Check your VIP status\n{pn} rules: Show VIP requirements\n{pn} add <uid>: Add permanent VIP (admin only)\n{pn} add tem <uid> <hours>: Add temporary VIP (admin only)\n{pn} remove <uid>: Remove VIP (admin only)\n{pn} list: Show all VIP users\n{pn} sync: Sync VIP data with MongoDB"
		}
	},

	langs: {
		en: {
			vipRules: `🔐 **VIP SYSTEM RULES** 🔐

💎 **HOW TO BECOME VIP:**
• Reach Level 35 through gaining experience
• Use commands and stay active to gain EXP
• Once you reach Level 35, you automatically become VIP!

⭐ **VIP BENEFITS:**
• Access to exclusive VIP commands (Role 3)
• Special privileges and features
• VIP-only content and tools

📊 **ROLE HIERARCHY:**
Level 0: 👥 Standard User - Basic commands
Level 1: ⚔️ Group Admin - Group management
Level 2: 🤖 Bot Admin - Bot configuration
Level 3: 💎 VIP User - Premium commands (Level 35+)
Level 4: 👑 System Developer - Full control

💡 **TIP:** Use '.rank' to check your current level and EXP!`,

			checkStatus: "👑 **VIP STATUS** 👑\n\n👤 User: %1\n🎯 Level: %2\n💎 VIP Status: %3\n⏰ Type: %4\n📅 Expires: %5",
			notVip: "❌ Not VIP",
			autoVip: "✅ Auto VIP (Level 35+)",
			permanentVip: "✅ Permanent VIP",
			temporaryVip: "⏰ Temporary VIP",
			never: "Never",
			levelTooLow: "❌ You need to reach Level 35 to become VIP automatically!\n\n📊 Current Level: %1\n🎯 Required Level: 35\n💡 Keep using commands to gain EXP!",
			addedPermanent: "✅ Permanent VIP access granted to %1",
			addedTemporary: "✅ Temporary VIP access granted to %1 for %2 hours",
			removed: "✅ VIP access removed from %1",
			alreadyVip: "⚠️ User already has VIP access",
			notVipUser: "⚠️ User doesn't have VIP access",
			listVip: "👑 **VIP USERS** 👑\n\n%1",
			noVip: "No VIP users found",
			invalidId: "⚠️ Please provide a valid user ID or reply to a message",
			invalidTime: "⚠️ Please provide valid hours (1-168)",
			noPermission: "❌ Only admins can add/remove VIP users",
			notVipMessage: "❌ YOU ARE NOT VIP BBY\n💎 Use '.vip rules' to see VIP requirements",
			syncSuccess: "✅ VIP data synced with MongoDB successfully!",
			syncError: "❌ Error syncing VIP data: %1",
			loadSuccess: "✅ VIP data loaded from MongoDB successfully!",
			loadError: "❌ Error loading VIP data: %1"
		}
	},

	// Load VIP data from config.json, MongoDB and JSON (priority order)
	loadVipData: async function() {
		const vipPath = path.join(__dirname, "../../database/data/vipUsers.json");
		const configPath = path.join(__dirname, "../../config.json");

		// Initialize global VIP storage
		global.vipUsers = {};

		try {
			// First priority: Load from config.json
			if (fs.existsSync(configPath)) {
				const configData = JSON.parse(fs.readFileSync(configPath, "utf8"));
				if (configData.vipSystem) {
					// Load permanent VIPs from config.json
					if (configData.vipSystem.permanentVip && Array.isArray(configData.vipSystem.permanentVip)) {
						for (const uid of configData.vipSystem.permanentVip) {
							global.vipUsers[uid] = {
								type: "permanent",
								addedAt: new Date().toISOString(),
								expireAt: null,
								hours: null,
								addedBy: "config"
							};
						}
					}
					// Load temporary VIPs from config.json
					if (configData.vipSystem.temporaryVip && typeof configData.vipSystem.temporaryVip === 'object') {
						for (const [uid, data] of Object.entries(configData.vipSystem.temporaryVip)) {
							global.vipUsers[uid] = data;
						}
					}
				}
			}

			// Second priority: Load additional data from MongoDB
			if (global.GoatBot.config.database.type === "mongodb" && global.db.vipUserModel) {
				const vipData = await global.db.vipUserModel.find({}).lean();

				for (const vip of vipData) {
					// Only add if not already in global.vipUsers from config
					if (!global.vipUsers[vip.userID]) {
						global.vipUsers[vip.userID] = {
							type: vip.type,
							addedAt: vip.addedAt,
							expireAt: vip.expireAt,
							hours: vip.hours,
							addedBy: vip.addedBy
						};
					}
				}
				console.log(`📊 Loaded ${vipData.length} VIP users from MongoDB`);
			}
			// Third priority: Fallback to JSON file
			else if (fs.existsSync(vipPath)) {
				const jsonData = JSON.parse(fs.readFileSync(vipPath, "utf8"));
				// Merge with existing data from config
				for (const [uid, data] of Object.entries(jsonData)) {
					if (!global.vipUsers[uid]) {
						global.vipUsers[uid] = data;
					}
				}
				console.log("📊 Loaded VIP users from JSON file");
			}

			// Update config.json with current data
			await module.exports.updateConfigJson();
			
			console.log(`📊 Total VIP users loaded: ${Object.keys(global.vipUsers).length}`);
		} catch (error) {
			console.error("❌ Error loading VIP data:", error);
			global.vipUsers = {};
		}
	},

	// Update config.json with current VIP data  
	updateConfigJson: async function() {
		const configPath = path.join(__dirname, "../../config.json");
		
		try {
			if (fs.existsSync(configPath)) {
				const configData = JSON.parse(fs.readFileSync(configPath, "utf8"));
				
				// Initialize vipSystem if not exists
				if (!configData.vipSystem) {
					configData.vipSystem = {
						levelRequirement: 35,
						permanentVip: [],
						temporaryVip: {},
						notes: "levelRequirement: minimum level to become VIP automatically, permanentVip: array of permanent VIP user IDs, temporaryVip: object with temporary VIP data"
					};
				}

				// Update permanent VIPs array
				configData.vipSystem.permanentVip = [];
				// Update temporary VIPs object
				configData.vipSystem.temporaryVip = {};

				// Categorize current VIP users
				for (const [uid, data] of Object.entries(global.vipUsers || {})) {
					if (data.type === "permanent") {
						configData.vipSystem.permanentVip.push(uid);
					} else if (data.type === "temporary") {
						configData.vipSystem.temporaryVip[uid] = data;
					}
				}

				// Write back to config.json
				fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
				console.log("✅ Config.json updated with VIP data");
			}
		} catch (error) {
			console.error("❌ Error updating config.json:", error);
		}
	},

	// Save VIP data to config.json first, then MongoDB and JSON
	saveVipData: async function() {
		const vipPath = path.join(__dirname, "../../database/data/vipUsers.json");
		const vipDir = path.dirname(vipPath);

		try {
			// First priority: Save to config.json
			await module.exports.updateConfigJson();

			// Ensure directory exists for JSON backup
			if (!fs.existsSync(vipDir)) {
				fs.mkdirSync(vipDir, { recursive: true });
			}

			// Save to JSON file as backup
			fs.writeFileSync(vipPath, JSON.stringify(global.vipUsers || {}, null, 2));

			// Save to MongoDB if available
			if (global.GoatBot.config.database.type === "mongodb" && global.db.vipUserModel) {
				try {
					// Clear existing data
					await global.db.vipUserModel.deleteMany({});

					// Insert current VIP users
					const vipArray = [];
					for (const [userID, data] of Object.entries(global.vipUsers || {})) {
						vipArray.push({
							userID,
							type: data.type,
							addedAt: data.addedAt,
							expireAt: data.expireAt,
							hours: data.hours,
							addedBy: data.addedBy
						});
					}

					if (vipArray.length > 0) {
						await global.db.vipUserModel.insertMany(vipArray);
					}

					// Update allVipData for immediate access
					if (global.db.allVipData) {
						global.db.allVipData = vipArray;
					}

					console.log("✅ VIP data saved to all storages successfully");
				} catch (error) {
					console.error("❌ Error saving VIP data to MongoDB:", error);
				}
			}
		} catch (error) {
			console.error("❌ Error in saveVipData:", error);
		}
	},

	// Sync VIP data between JSON and MongoDB
	syncVipData: async function() {
		if (global.GoatBot.config.database.type !== "mongodb" || !global.db.vipUserModel) {
			throw new Error("MongoDB not available");
		}

		try {
			// Get all VIP users from MongoDB
			const mongoVipUsers = await global.db.vipUserModel.find({}).lean();

			// Convert to the format used by global.vipUsers
			const syncedData = {};
			for (const vip of mongoVipUsers) {
				syncedData[vip.userID] = {
					type: vip.type,
					addedAt: vip.addedAt,
					expireAt: vip.expireAt,
					hours: vip.hours,
					addedBy: vip.addedBy
				};
			}

			// Update global storage
			global.vipUsers = syncedData;

			// Save to JSON file as backup
			const vipPath = path.join(__dirname, "../../database/data/vipUsers.json");
			const vipDir = path.dirname(vipPath);

			if (!fs.existsSync(vipDir)) {
				fs.mkdirSync(vipDir, { recursive: true });
			}

			fs.writeFileSync(vipPath, JSON.stringify(global.vipUsers, null, 2));

			return true;
		} catch (error) {
			throw error;
		}
	},

	// Check if user has VIP access
	hasVipAccess: function(userID, userData = null) {
		// Check manual VIP first
		if (global.vipUsers && global.vipUsers[userID]) {
			const vipData = global.vipUsers[userID];

			// Check if temporary VIP expired
			if (vipData.type === "temporary") {
				if (new Date(vipData.expireAt).getTime() <= Date.now()) {
					delete global.vipUsers[userID];
					module.exports.saveVipData();
					return false;
				}
			}
			return true;
		}

		// Check level-based VIP (Level 35+)
		if (userData) {
			const userLevel = userData.level || 1;
			return userLevel >= 35;
		}

		return false;
	},

	// Check and remove expired VIP users (auto-delete temporary VIPs)
	checkExpiredVip: async function() {
		if (!global.vipUsers) return;

		const now = Date.now();
		const expiredUsers = [];

		for (const [uid, data] of Object.entries(global.vipUsers)) {
			if (data.type === "temporary" && data.expireAt) {
				const expireTime = new Date(data.expireAt).getTime();
				if (expireTime <= now) {
					expiredUsers.push({ uid, name: data.addedBy || 'Unknown' });
				}
			}
		}

		// Remove expired users from all storages
		if (expiredUsers.length > 0) {
			expiredUsers.forEach(user => {
				delete global.vipUsers[user.uid];
				console.log(`🕐 Auto-deleted expired temporary VIP: ${user.uid}`);
			});

			// Save changes to all storages
			await module.exports.saveVipData();
			
			console.log(`🕐 Removed ${expiredUsers.length} expired temporary VIP users`);
		}
	},

	onLoad: async function() {
		// Create MongoDB index for better performance
		if (global.GoatBot.config.database.type === "mongodb" && global.db.vipUserModel) {
			try {
				await global.db.vipUserModel.createIndex({ userID: 1 }, { unique: true });
				await global.db.vipUserModel.createIndex({ expireAt: 1 });
				console.log("📊 VIP MongoDB indexes created");
			} catch (error) {
				console.log("VIP index creation:", error.message);
			}
		}

		// Load existing VIP data
		await module.exports.loadVipData();

		// Set global save function
		global.saveVipData = module.exports.saveVipData;

		// Check expired VIP every 10 minutes
		setInterval(async () => {
			await module.exports.checkExpiredVip();
		}, 10 * 60 * 1000);

		// Auto sync VIP data every 30 minutes
		setInterval(async () => {
			try {
				await module.exports.syncVipData();
				console.log("🔄 VIP auto-sync completed");
			} catch (error) {
				console.log("VIP auto-sync error:", error.message);
			}
		}, 30 * 60 * 1000);

		console.log("🔐 VIP System loaded successfully");
	},

	onStart: async function ({ message, args, usersData, event, getLang }) {
		const { config } = global.GoatBot;
		const senderID = event.senderID;

		// Initialize VIP storage if not exists
		if (!global.vipUsers) {
			global.vipUsers = {};
			await module.exports.loadVipData();
		}

		// Check for expired temporary VIP
		await module.exports.checkExpiredVip();

		switch (args[0]) {
			case "sync": {
				if (!config.adminBot.includes(senderID)) {
					return message.reply(getLang("noPermission"));
				}

				try {
					await module.exports.syncVipData();
					return message.reply(getLang("syncSuccess"));
				} catch (error) {
					return message.reply(getLang("syncError", error.message));
				}
			}

			case "add": {
				// Only admins can add VIP
				if (!config.adminBot.includes(senderID)) {
					return message.reply(getLang("noPermission"));
				}

				let uid;
				let isTemporary = false;
				let hours = 24;

				if (args[1] === "tem") {
					isTemporary = true;
					if (event.type === "message_reply") {
						uid = event.messageReply.senderID;
						hours = parseInt(args[2]) || 24;
					} else {
						uid = args[2];
						hours = parseInt(args[3]) || 24;
					}
				} else {
					if (event.type === "message_reply") {
						uid = event.messageReply.senderID;
					} else {
						uid = args[1];
					}
				}

				if (!uid || isNaN(uid)) {
					return message.reply(getLang("invalidId"));
				}

				if (isTemporary && (isNaN(hours) || hours < 1 || hours > 168)) {
					return message.reply(getLang("invalidTime"));
				}

				if (global.vipUsers[uid]) {
					return message.reply(getLang("alreadyVip"));
				}

				// Add VIP data
				const vipData = {
					type: isTemporary ? "temporary" : "permanent",
					addedAt: new Date().toISOString(),
					expireAt: isTemporary ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString() : null,
					hours: isTemporary ? hours : null,
					addedBy: senderID
				};

				// Add to global storage
				global.vipUsers[uid] = vipData;

				// Save to config.json first, then other storages
				await module.exports.saveVipData();

				// Also update using the VIP controller if available
				if (global.db.vipUserData && typeof global.db.vipUserData.set === 'function') {
					try {
						await global.db.vipUserData.set(uid, vipData);
					} catch (error) {
						console.log("VIP controller update failed, but main save succeeded");
					}
				}

				const userName = await usersData.getName(uid);
				const responseKey = isTemporary ? "addedTemporary" : "addedPermanent";
				const responseArgs = isTemporary ? [`${userName} (${uid})`, hours] : [`${userName} (${uid})`];

				console.log(`✅ VIP added: ${userName} (${uid}) - ${vipData.type} - Saved to config.json and MongoDB`);
				return message.reply(getLang(responseKey, ...responseArgs));
			}

			case "remove": {
				if (!config.adminBot.includes(senderID)) {
					return message.reply(getLang("noPermission"));
				}

				let uid;
				if (event.type === "message_reply") {
					uid = event.messageReply.senderID;
				} else {
					uid = args[1];
				}

				if (!uid || isNaN(uid)) {
					return message.reply(getLang("invalidId"));
				}

				if (!global.vipUsers[uid]) {
					return message.reply(getLang("notVipUser"));
				}

				delete global.vipUsers[uid];
				
				// Save changes to all storages
				await module.exports.saveVipData();

				// Also remove from VIP controller if available
				if (global.db.vipUserData && typeof global.db.vipUserData.remove === 'function') {
					try {
						await global.db.vipUserData.remove(uid);
					} catch (error) {
						console.log("VIP controller removal failed, but main removal succeeded");
					}
				}

				const userName = await usersData.getName(uid);
				console.log(`✅ VIP removed: ${userName} (${uid}) - Updated all storages`);
				return message.reply(getLang("removed", `${userName} (${uid})`));
			}

			case "list": {
				if (Object.keys(global.vipUsers).length === 0) {
					return message.reply(getLang("noVip"));
				}

				const list = [];
				for (const [uid, data] of Object.entries(global.vipUsers)) {
					const userName = await usersData.getName(uid);
					let status = `${data.type}`;

					if (data.type === "temporary") {
						const expireTime = new Date(data.expireAt);
						const timeLeft = expireTime.getTime() - Date.now();
						const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
						status += ` - ${hoursLeft}h left`;
					}

					list.push(`💎 ${userName} (${uid}) - ${status}`);
				}

				return message.reply(getLang("listVip", list.join("\n")));
			}

			case "check": {
				let uid;
				if (event.type === "message_reply") {
					uid = event.messageReply.senderID;
				} else if (args[1]) {
					uid = args[1];
				} else {
					uid = senderID;
				}

				if (!uid || isNaN(uid)) {
					return message.reply(getLang("invalidId"));
				}

				const userData = await usersData.get(uid);
				const userName = await usersData.getName(uid);
				const userLevel = userData.level || 1;

				let vipStatus = getLang("notVip");
				let vipType = "None";
				let expireInfo = getLang("never");

				// Check manual VIP
				if (global.vipUsers[uid]) {
					const vipData = global.vipUsers[uid];
					vipStatus = vipData.type === "permanent" ? getLang("permanentVip") : getLang("temporaryVip");
					vipType = vipData.type;

					if (vipData.type === "temporary") {
						const expireTime = new Date(vipData.expireAt);
						const timeLeft = expireTime.getTime() - Date.now();
						const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
						expireInfo = `${expireTime.toLocaleString()} (${hoursLeft}h left)`;
					}
				}
				// Check level-based VIP
				else if (userLevel >= 35) {
					vipStatus = getLang("autoVip");
					vipType = "Level-based";
				}

				return message.reply(getLang("checkStatus", userName, userLevel, vipStatus, vipType, expireInfo));
			}

			case "rules": {
				return message.reply(getLang("vipRules"));
			}

			default: {
				// Check user's VIP status
				const userData = await usersData.get(senderID);
				const userLevel = userData.level || 1;

				if (userLevel < 35 && !global.vipUsers[senderID]) {
					return message.reply(getLang("levelTooLow", userLevel));
				}

				return message.reply(getLang("vipRules"));
			}
		}
	}
};