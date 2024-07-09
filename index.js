import express from "express";
import cors from "cors";
import config from "./app/core/config.js";
import authRoutes from "./app/routes/auth.js";
import todoRoutes from "./app/routes/todos.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/todos", todoRoutes);

app.listen(config.port, () => {
	console.log(`Server running at http://localhost:${config.port}`);
});
