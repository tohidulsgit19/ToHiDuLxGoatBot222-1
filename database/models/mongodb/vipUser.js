
const mongoose = require("mongoose");
const { Schema } = mongoose;

const vipUserModel = new Schema({
	userID: {
		type: String,
		unique: true,
		required: true
	},
	type: {
		type: String,
		enum: ["permanent", "temporary"],
		required: true
	},
	addedAt: {
		type: Date,
		default: Date.now
	},
	expireAt: {
		type: Date,
		default: null
	},
	hours: {
		type: Number,
		default: null
	},
	addedBy: {
		type: String,
		required: true
	}
}, {
	timestamps: true
});

module.exports = mongoose.model("vipUsers", vipUserModel);
