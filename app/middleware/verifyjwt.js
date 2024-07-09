import jwt from "jsonwebtoken";
import config from "../core/config.js";

export const verifyToken = (req, res, next) => {
	const token = req.header("Authorization")?.split(" ")[1];

	if (!token) {
		return res.status(401).json({ error: "Access denied. No token provided." });
	}

	try {
		const decoded = jwt.verify(token, config.jwtSecret);
		req.user = decoded;
		next();
	} catch (error) {
		res.status(400).json({ error: "Invalid token." });
	}
};
