
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

const CACHE_FILE = path.join(__dirname, "..", "cache", "unsentMessages.json");
const DELETE_AFTER = 10 * 60 * 1000; // 10 minutes

// Cache file ensure করা
function ensureCacheFile() {
  const folder = path.dirname(CACHE_FILE);
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  if (!fs.existsSync(CACHE_FILE)) fs.writeFileSync(CACHE_FILE, "{}");
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

// বাংলা সময় ফরমেট
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

// Attachment type check
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

// Thread info get করা
async function getThreadInfo(api, threadID) {
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    return {
      name: threadInfo.threadName || `গ্রুপ ${threadID}`,
      type: threadInfo.isGroup ? "👥 গ্রুপ" : "🔒 ব্যক্তিগত"
    };
  } catch (error) {
    return {
      name: "অজানা থ্রেড",
      type: "❓ অজানা"
    };
  }
}

// User info get করা
async function getUserInfo(api, userID) {
  try {
    const userInfo = await api.getUserInfo(userID);
    return userInfo[userID]?.name || "অজানা ব্যবহারকারী";
  } catch (error) {
    return "অজানা ব্যবহারকারী";
  }
}

module.exports = {
  config: {
    name: "autosentdeletedsms",
    version: "3.0",
    author: "Tohidul (Advanced Version)",
    shortDescription: "Advanced unsend message detector",
    longDescription: "Advanced unsend message detector with better features",
    category: "utility",
    guide: {
      en: "This command automatically tracks all unsent messages and logs them.",
      vi: "Tự động theo dõi và ghi lại các tin nhắn bị thu hồi."
    }
  },

  // System initialization
  onStart: async function ({ api }) {
    ensureCacheFile();
    
    // Old messages clean করা (প্রতি 30 সেকেন্ডে)
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
        console.log(`🧹 পুরানো ${Object.keys(store).length}টি unsend রেকর্ড পরিষ্কার করা হয়েছে`);
      }
    }, 30000);

    console.log("✅ Auto Unsend Detector সিস্টেম চালু হয়েছে!");
  },

  // সব মেসেজ save করা
  onChat: async function ({ event, api }) {
    if (!event || !event.messageID || event.type !== "message") return;
    
    const store = loadStore();
    
    // User info get করা
    let senderName = "অজানা ব্যবহারকারী";
    try {
      senderName = await getUserInfo(api, event.senderID);
    } catch (error) {
      // Ignore error
    }

    // Message data store করা
    store[event.messageID] = {
      senderID: event.senderID,
      senderName: senderName,
      threadID: event.threadID,
      body: event.body || null,
      attachments: event.attachments || [],
      mentions: event.mentions || {},
      timestamp: Date.now(),
      messageReply: event.messageReply || null,
      isGroup: event.isGroup || false
    };
    
    saveStore(store);
  },

  // Unsend detect করা - এখানেই main fix
  handleEvent: async function ({ api, event }) {
    if (event.type !== "message_unsend") return;

    const store = loadStore();
    const savedMsg = store[event.messageID];
    
    // Message check করা
    if (!savedMsg || Date.now() - savedMsg.timestamp > DELETE_AFTER) {
      console.log(`⚠️ Unsend ডিটেক্ট হয়েছে কিন্তু মেসেজ পাওয়া যায়নি: ${event.messageID}`);
      return;
    }

    try {
      // Thread info get করা
      const threadInfo = await getThreadInfo(api, savedMsg.threadID);

      // Report message তৈরি করা
      let reportMsg = `🚨 𝗨𝗻𝘀𝗲𝗻𝗱 𝗗𝗲𝘁𝗲𝗰𝘁𝗲𝗱 🚨
━━━━━━━━━━━━━━━━━━━━━━━━
👤 প্রেরক: ${savedMsg.senderName}
🆔 ইউজার আইডি: ${savedMsg.senderID}
${threadInfo.type}: ${threadInfo.name}
📍 থ্রেড আইডি: ${savedMsg.threadID}
🕒 সময়: ${formatTime(new Date())}
📨 মেসেজ আইডি: ${event.messageID}
━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      // Message content add করা
      if (savedMsg.body) {
        reportMsg += `📝 মেসেজ:\n"${savedMsg.body}"\n\n`;
      }

      // Mentions add করা
      if (savedMsg.mentions && Object.keys(savedMsg.mentions).length > 0) {
        reportMsg += `👥 উল্লেখিত ব্যক্তিরা:\n`;
        for (const [uid, name] of Object.entries(savedMsg.mentions)) {
          reportMsg += `• ${name.replace('@', '')} (${uid})\n`;
        }
        reportMsg += `\n`;
      }

      // Reply info add করা  
      if (savedMsg.messageReply) {
        reportMsg += `↩️ রিপ্লাই করা মেসেজ: "${savedMsg.messageReply.body || 'Media/Attachment'}"\n\n`;
      }

      // Attachments handle করা
      const files = [];
      if (savedMsg.attachments && savedMsg.attachments.length > 0) {
        reportMsg += `📎 সংযুক্তি: ${savedMsg.attachments.length}টি ফাইল\n`;
        
        for (let i = 0; i < Math.min(savedMsg.attachments.length, 10); i++) { // Max 10 attachments
          const att = savedMsg.attachments[i];
          const attType = getAttachmentType(att);
          reportMsg += `${i + 1}. ${attType}\n`;
          
          const url = att.url || att.previewUrl || att.largePreview;
          if (url) {
            try {
              const response = await axios.get(url, { 
                responseType: "arraybuffer",
                timeout: 30000, // 30 seconds timeout
                maxContentLength: 100 * 1024 * 1024, // 100MB limit
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
              });
              
              const ext = path.extname(url).toLowerCase() || (att.type === 'photo' ? '.jpg' : '.dat');
              const fileName = `unsend_${Date.now()}_${i}${ext}`;
              const filePath = path.join(__dirname, "..", "cache", fileName);
              
              await fs.writeFile(filePath, response.data);
              files.push(fs.createReadStream(filePath));
              
            } catch (downloadError) {
              console.error(`Attachment ${i} download error:`, downloadError.message);
              reportMsg += `  ❌ ডাউনলোড ব্যর্থ: ${downloadError.message}\n`;
            }
          }
        }
        reportMsg += `\n`;
      }

      reportMsg += `━━━━━━━━━━━━━━━━━━━━━━━━
⚡ Advanced Unsend Detector
🛡️ কোনো মেসেজই লুকিয়ে থাকতে পারবে না!
🔍 Total Saved Messages: ${Object.keys(store).length}`;

      // Report send করা - সেই থ্রেডেই পাঠানো হবে যেখানে unsend হয়েছে
      const messageOptions = {
        body: reportMsg
      };

      if (files.length > 0) {
        messageOptions.attachment = files;
      }

      // Same thread এ পাঠানো - এটাই main fix
      api.sendMessage(messageOptions, savedMsg.threadID, (error, info) => {
        if (error) {
          console.error("Unsend report পাঠাতে ত্রুটি:", error.message);
          
          // Fallback: কোনো error হলে text-only message পাঠানো
          api.sendMessage(`🚨 Unsend Detected 🚨\n👤 User: ${savedMsg.senderName}\n🆔 ID: ${savedMsg.senderID}\n📝 Message: "${savedMsg.body || 'Media message'}"\n⚠️ Attachment processing failed`, savedMsg.threadID);
        } else {
          console.log(`✅ Unsend report পাঠানো হয়েছে: ${event.messageID}`);
        }
        
        // Files cleanup করা
        files.forEach(file => {
          try {
            if (file.path && fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (cleanupError) {
            console.error("File cleanup error:", cleanupError.message);
          }
        });
      });

      // Store থেকে remove করা
      delete store[event.messageID];
      saveStore(store);

    } catch (error) {
      console.error("HandleEvent এ ত্রুটি:", error);
      
      // Fallback message - same thread এ
      try {
        await api.sendMessage(`🚨 Unsend Detected 🚨\n👤 User: ${savedMsg.senderName}\n🆔 ID: ${savedMsg.senderID}\n📝 Message: "${savedMsg.body || 'No text'}"\n⚠️ Processing error occurred`, savedMsg.threadID);
      } catch (fallbackError) {
        console.error("Fallback message error:", fallbackError);
      }
    }
  }
};
