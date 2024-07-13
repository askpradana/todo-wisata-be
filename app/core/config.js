import dotenv from "dotenv";

dotenv.config();

export default {
	port: process.env.PORT,
	jwtSecret: process.env.JWT_SECRET,
	dbUser: process.env.DB_USER,
	dbHost: process.env.DB_HOST,
	dbName: process.env.DB_NAME,
	dbPassword: process.env.DB_PASSWORD,
	dbPort: parseInt(process.env.DB_PORT || "5432", 10),
};
