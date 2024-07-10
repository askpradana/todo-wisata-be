import jwt from "jsonwebtoken";
import config from "../core/config.js";
import { db } from "../core/database.js";

export const verifyToken = (req, res, next) => {
	const token = req.header("Authorization")?.split(" ")[1]; // Bearer TOKEN

	if (!token) {
		return res.status(401).json({ error: "Access denied. No token provided." });
	}

	try {
		const decoded = jwt.verify(token, config.jwtSecret);

		// Only use latest token
		db.get(
			"SELECT latest_token FROM users WHERE id = ?",
			[decoded.userId],
			(err, user) => {
				if (err) {
					console.error("Database error in token verification:", err);
					return res.status(500).json({ error: "Internal server error" });
				}

				if (!user) {
					return res.status(401).json({ error: "User not found." });
				}

				if (user.latest_token !== token) {
					return res.status(401).json({ error: "Invalid or expired token." });
				}

				req.user = decoded;
				next();
			}
		);
	} catch (error) {
		console.error("JWT verification error:", error);
		res.status(400).json({ error: "Invalid token." });
	}
};
