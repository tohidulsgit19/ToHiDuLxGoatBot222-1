
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

const CACHE_FILE = path.join(__dirname, "..", "cache", "unsentMessages.json");
const CONFIG_FILE = path.join(__dirname, "..", "cache", "unsentConfig.json");
const DELETE_AFTER = 30 * 60 * 1000; // 30 minutes

// Target thread ID - add your group thread ID here
let TARGET_THREAD_ID = null;

// Ensure cache file exists
function ensureCacheFile() {
  const folder = path.dirname(CACHE_FILE);
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  if (!fs.existsSync(CACHE_FILE)) fs.writeFileSync(CACHE_FILE, "{}");
}

// Config file functions
function ensureConfigFile() {
  const folder = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ targetThreadID: null }, null, 2));
  }
}

function loadConfig() {
  ensureConfigFile();
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    TARGET_THREAD_ID = config.targetThreadID;
    return config;
  } catch (error) {
    console.error("Error loading config:", error);
    return { targetThreadID: null };
  }
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    TARGET_THREAD_ID = config.targetThreadID;
  } catch (error) {
    console.error("Error saving config:", error);
  }
}

function loadStore() {
  ensureCacheFile();
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch (error) {
    console.error("Error loading unsent store:", error);
    return {};
  }
}

function saveStore(data) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving unsent store:", error);
  }
}

// Bengali time format
function formatTime(date) {
  const options = {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Dhaka'
  };
  return new Intl.DateTimeFormat('bn-BD', options).format(date);
}

// Get attachment type in Bengali
function getAttachmentType(attachment) {
  const type = attachment.type || 'unknown';
  switch (type) {
    case 'photo': return '📸 ছবি';
    case 'video': return '🎥 ভিডিও';  
    case 'audio': return '🎵 অডিও';
    case 'file': return '📄 ফাইল';
    case 'sticker': return '😀 স্টিকার';
    case 'animated_image': return '🎭 GIF';
    default: return '📎 সংযুক্তি';
  }
}

// Get user info safely
async function getUserInfo(api, userID) {
  try {
    const userInfo = await api.getUserInfo(userID);
    return userInfo[userID]?.name || `User ${userID}`;
  } catch (error) {
    return `User ${userID}`;
  }
}

module.exports = {
  config: {
    name: "autosentdeletedsms",
    version: "6.0",
    author: "Tohidul (Enhanced Version)",
    shortDescription: "Auto detect unsent messages",
    longDescription: "Automatically detects and logs unsent messages with attachments in Bengali",
    category: "utility",
    guide: {
      en: "This command automatically tracks all unsent messages and logs them.\n\nCommands:\n- setgc <threadID> - Set target group for unsend reports\n- checkgc - Check current target group\n- removegc - Remove target group (send to original thread)",
      vi: "Tự động theo dõi và ghi lại các tin nhắn bị thu hồi."
    }
  },

  // Initialize system when bot starts
  onStart: async function ({ api, args, message, event }) {
    // Handle commands
    if (args[0]) {
      const command = args[0].toLowerCase();
      
      if (command === "setgc") {
        const threadID = args[1];
        if (!threadID || !/^\d+$/.test(threadID)) {
          return message.reply("❌ সঠিক Thread ID দিন!\nউদাহরণ: setgc 123456789");
        }
        
        try {
          // Check if thread exists and bot has access
          await api.getThreadInfo(threadID);
          const config = { targetThreadID: threadID };
          saveConfig(config);
          
          return message.reply(`✅ সফলভাবে টার্গেট গ্রুপ সেট করা হয়েছে!\n🆔 Thread ID: ${threadID}\n\nএখন সব unsend রিপোর্ট এই গ্রুপে পাঠানো হবে।`);
        } catch (error) {
          return message.reply("❌ অবৈধ Thread ID বা বট এই গ্রুপে নেই!");
        }
      }
      
      if (command === "checkgc") {
        const config = loadConfig();
        if (!config.targetThreadID) {
          return message.reply("❌ কোনো টার্গেট গ্রুপ সেট করা হয়নি।\n\nসেট করতে: setgc <threadID>");
        }
        
        try {
          const threadInfo = await api.getThreadInfo(config.targetThreadID);
          return message.reply(`📋 বর্তমান টার্গেট গ্রুপ:\n🆔 ID: ${config.targetThreadID}\n📝 নাম: ${threadInfo.threadName || 'নাম নেই'}\n👥 সদস্য: ${threadInfo.participantIDs.length} জন`);
        } catch (error) {
          return message.reply(`⚠️ টার্গেট গ্রুপ: ${config.targetThreadID}\n❌ গ্রুপ অ্যাক্সেস করা যাচ্ছে না!`);
        }
      }
      
      if (command === "removegc") {
        const config = { targetThreadID: null };
        saveConfig(config);
        return message.reply("✅ টার্গেট গ্রুপ রিমুভ করা হয়েছে!\nএখন unsend রিপোর্ট মূল গ্রুপেই পাঠানো হবে।");
      }
      
      return message.reply("❌ অজানা কমান্ড!\n\nব্যবহার:\n- setgc <threadID>\n- checkgc\n- removegc");
    }
    
    ensureCacheFile();
    loadConfig(); // Load target thread ID
    
    // Clean old messages every 60 seconds
    setInterval(() => {
      const store = loadStore();
      let changed = false;
      const now = Date.now();
      
      for (const id in store) {
        if (now - store[id].timestamp > DELETE_AFTER) {
          delete store[id];
          changed = true;
        }
      }
      
      if (changed) {
        saveStore(store);
        console.log(`🧹 পুরানো unsend রেকর্ড পরিষ্কার করা হয়েছে`);
      }
    }, 60000);

    console.log("✅ Enhanced Auto Unsend Detector সিস্টেম চালু হয়েছে!");
    if (TARGET_THREAD_ID) {
      console.log(`📍 Target Group: ${TARGET_THREAD_ID}`);
    }
  },

  // Store all messages
  onChat: async function ({ event, api }) {
    // Only process valid message events
    if (!event || !event.messageID || event.type !== "message") return;
    
    const store = loadStore();
    
    // Get user info safely
    let senderName = "Unknown User";
    try {
      senderName = await getUserInfo(api, event.senderID);
    } catch (error) {
      // Fallback to userID if name fetch fails
      senderName = `User ${event.senderID}`;
    }

    // Store message data
    store[event.messageID] = {
      senderID: event.senderID,
      senderName: senderName,
      threadID: event.threadID,
      body: event.body || "",
      attachments: event.attachments || [],
      mentions: event.mentions || {},
      timestamp: Date.now(),
      messageReply: event.messageReply || null,
      isGroup: event.isGroup || false
    };
    
    saveStore(store);
  },

  // Handle any event - this is key for catching unsend events
  onAnyEvent: async function ({ api, event }) {
    // Only handle message_unsend events
    if (event.type !== "message_unsend") return;

    console.log(`🚨 Unsend detected: ${event.messageID}`);

    const store = loadStore();
    const savedMsg = store[event.messageID];
    
    // Check if we have the message stored
    if (!savedMsg) {
      console.log(`⚠️ No saved message found for: ${event.messageID}`);
      return;
    }

    // Check if message is too old
    if (Date.now() - savedMsg.timestamp > DELETE_AFTER) {
      console.log(`⚠️ Message too old: ${event.messageID}`);
      delete store[event.messageID];
      saveStore(store);
      return;
    }

    try {
      // Create report message
      let reportMsg = `🚨 𝗨𝗻𝘀𝗲𝗻𝗱 𝗗𝗲𝘁𝗲𝗰𝘁𝗲𝗱 🚨\n`;
      reportMsg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      reportMsg += `👤 প্রেরক: ${savedMsg.senderName}\n`;
      reportMsg += `🆔 ইউজার আইডি: ${savedMsg.senderID}\n`;
      reportMsg += `🕒 সময়: ${formatTime(new Date())}\n`;
      reportMsg += `📨 মেসেজ আইডি: ${event.messageID}\n`;
      reportMsg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      // Add message content
      if (savedMsg.body && savedMsg.body.trim()) {
        reportMsg += `📝 মেসেজ:\n"${savedMsg.body}"\n\n`;
      } else {
        reportMsg += `📝 মেসেজ: [খালি বা মিডিয়া মেসেজ]\n\n`;
      }

      // Add mentions
      if (savedMsg.mentions && Object.keys(savedMsg.mentions).length > 0) {
        reportMsg += `👥 উল্লেখিত ব্যক্তিরা:\n`;
        for (const [uid, name] of Object.entries(savedMsg.mentions)) {
          reportMsg += `• ${name.replace('@', '')} (${uid})\n`;
        }
        reportMsg += `\n`;
      }

      // Add reply info  
      if (savedMsg.messageReply && savedMsg.messageReply.body) {
        reportMsg += `↩️ রিপ্লাই করা মেসেজ: "${savedMsg.messageReply.body}"\n\n`;
      }

      // Handle attachments
      const attachmentFiles = [];
      if (savedMsg.attachments && savedMsg.attachments.length > 0) {
        reportMsg += `📎 সংযুক্তি: ${savedMsg.attachments.length}টি\n`;
        
        for (let i = 0; i < Math.min(savedMsg.attachments.length, 3); i++) {
          const att = savedMsg.attachments[i];
          const attType = getAttachmentType(att);
          reportMsg += `${i + 1}. ${attType}\n`;
          
          const url = att.url || att.previewUrl || att.largePreview;
          if (url) {
            try {
              const response = await axios.get(url, { 
                responseType: "arraybuffer",
                timeout: 10000,
                maxContentLength: 25 * 1024 * 1024, // 25MB limit
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
              });
              
              const ext = path.extname(url).toLowerCase() || '.jpg';
              const fileName = `unsend_${Date.now()}_${i}${ext}`;
              const filePath = path.join(__dirname, "..", "cache", fileName);
              
              await fs.writeFile(filePath, response.data);
              attachmentFiles.push(fs.createReadStream(filePath));
              
            } catch (downloadError) {
              console.error(`Attachment ${i} download error:`, downloadError.message);
              reportMsg += `  ❌ ডাউনলোড ব্যর্থ\n`;
            }
          }
        }
        reportMsg += `\n`;
      }

      reportMsg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      reportMsg += `⚡ Enhanced Unsend Detector v5.0\n`;
      reportMsg += `🛡️ সব মেসেজ ট্র্যাক করা হচ্ছে!`;

      // Prepare message options
      const messageOptions = {
        body: reportMsg
      };

      if (attachmentFiles.length > 0) {
        messageOptions.attachment = attachmentFiles;
      }

      // Send report to target thread or same thread
      const targetThreadID = TARGET_THREAD_ID || savedMsg.threadID;
      
      // Add source group info if sending to different thread
      if (TARGET_THREAD_ID && TARGET_THREAD_ID !== savedMsg.threadID) {
        try {
          const sourceThreadInfo = await api.getThreadInfo(savedMsg.threadID);
          const sourceGroupName = sourceThreadInfo.threadName || `Group ${savedMsg.threadID}`;
          reportMsg += `\n🏠 সোর্স গ্রুপ: ${sourceGroupName}\n🆔 গ্রুপ আইডি: ${savedMsg.threadID}\n`;
          reportMsg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          reportMsg += `⚡ Enhanced Unsend Detector v6.0\n`;
          reportMsg += `🛡️ সব মেসেজ ট্র্যাক করা হচ্ছে!`;
          
          messageOptions.body = reportMsg;
        } catch (error) {
          console.error("Error getting source thread info:", error);
        }
      }
      
      await api.sendMessage(messageOptions, targetThreadID)
        .then((info) => {
          console.log(`✅ Unsend report sent: ${event.messageID}`);
          
          // Clean up files after sending
          setTimeout(() => {
            attachmentFiles.forEach(file => {
              try {
                if (file.path && fs.existsSync(file.path)) {
                  fs.unlinkSync(file.path);
                }
              } catch (cleanupError) {
                console.error("File cleanup error:", cleanupError.message);
              }
            });
          }, 5000);
        })
        .catch((error) => {
          console.error("Report send error:", error.message);
          
          // Fallback: Send simple text message
          let fallbackMsg = `🚨 Unsend Detected!\n👤 ${savedMsg.senderName} (${savedMsg.senderID})\n📝 "${savedMsg.body || 'মিডিয়া মেসেজ'}"`;
          
          const fallbackTargetID = TARGET_THREAD_ID || savedMsg.threadID;
          if (TARGET_THREAD_ID && TARGET_THREAD_ID !== savedMsg.threadID) {
            fallbackMsg += `\n🏠 Group: ${savedMsg.threadID}`;
          }
          
          api.sendMessage(fallbackMsg, fallbackTargetID);
        });

      // Remove from store
      delete store[event.messageID];
      saveStore(store);

    } catch (error) {
      console.error("Handler error:", error.message);
      
      // Emergency fallback
      try {
        let emergencyMsg = `🚨 Unsend Alert!\n👤 ${savedMsg.senderName || 'Unknown'}\n📝 "${savedMsg.body || 'Content not available'}"`;
        
        const emergencyTargetID = TARGET_THREAD_ID || savedMsg.threadID;
        if (TARGET_THREAD_ID && TARGET_THREAD_ID !== savedMsg.threadID) {
          emergencyMsg += `\n🏠 Group: ${savedMsg.threadID}`;
        }
        
        await api.sendMessage(emergencyMsg, emergencyTargetID);
        
        // Clean up store
        delete store[event.messageID];
        saveStore(store);
        
      } catch (fallbackError) {
        console.error("Emergency fallback error:", fallbackError.message);
      }
    }
  }
};
