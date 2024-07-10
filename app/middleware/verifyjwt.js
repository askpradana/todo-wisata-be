import jwt from "jsonwebtoken";
import config from "../core/config.js";
import { db } from "../core/database.js";

export const verifyToken = (req, res, next) => {
	const token = req.header("Authorization")?.split(" ")[1];

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
					return res
						.status(500)
						.json({ statusCode: 500, error: "Internal server error" });
				}

				if (!user) {
					return res
						.status(401)
						.json({ statusCode: 401, error: "User not found." });
				}

				if (user.latest_token !== token) {
					return res
						.status(401)
						.json({ statusCode: 401, error: "Invalid or expired token." });
				}

				req.user = decoded;
				next();
			}
		);
	} catch (error) {
		res
			.status(400)
			.json({ statusCode: 400, error: "Invalid login credentials." });
	}
};
