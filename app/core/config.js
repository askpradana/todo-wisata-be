import dotenv from "dotenv";

dotenv.config();

export default {
	port: process.env.PORT || 3000,
	jwtSecret: process.env.JWT_SECRET,
	dbPath: process.env.DB_PATH || "../../../Database.db",
};
