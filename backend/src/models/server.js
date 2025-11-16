import mongoose from "mongoose";

const serverSchema = new mongoose.Schema({
	serverId: {
		type: String,
		required: true,
		unique: true,
		trim: true,
	},
	ip: {
		type: String,
		required: true,
		unique: true,
		trim: true,
	},
	status: {
		type: String,
		required: true,
		enum: ["active", "inactive", "maintainance", "critical", "retired"],
		default: "active",
	},
	addedBy: {
		type: String,
		required: true,
	},
}, { timestamps: true });

const Server = mongoose.model("Server", serverSchema);
export default Server;