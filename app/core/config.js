import dotenv from "dotenv";

dotenv.config();

export default {
	port: 5432,
	jwtSecret: process.env.JWT_SECRET,
	dbUser: process.env.DB_USER,
	dbHost: process.env.DB_HOST,
	dbName: process.env.DB_NAME,
	dbPassword: process.env.DB_PASSWORD,
	connection: {
		options: `project=${process.env.DB_ENDPOINT_ID}`,
	},
};
