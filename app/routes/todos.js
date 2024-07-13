import express from "express";
import { verifyToken } from "../middleware/verifyjwt.js";
import { db, getColorHex, formatReminder } from "../core/database.js";

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
	const userId = req.user.userId;
	const userName = req.user.username;

	try {
		const result = await db.query("SELECT * FROM todos WHERE user_id = $1", [
			userId,
		]);
		const formattedTodos = result.rows.map((todo) => ({
			...todo,
			colorHex: getColorHex(todo.color),
			reminder: formatReminder(todo.reminder),
		}));

		res.json({
			username: userName,
			todoList: formattedTodos,
		});
	} catch (error) {
		console.error("Error fetching todos:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/", verifyToken, async (req, res) => {
	const userId = req.user.userId;
	const { title, description, color, reminder } = req.body;

	if (!title) {
		return res.status(400).json({ error: "Title is required for the todo" });
	}

	const validColors = ["red", "purple", "blue", "green", "yellow", "default"];
	const todoColor = validColors.includes(color) ? color : "default";

	try {
		const result = await db.query(
			`INSERT INTO todos (user_id, title, description, completed, color, reminder) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
			[userId, title, description || null, false, todoColor, reminder || null]
		);

		const newTodo = result.rows[0];
		const formattedTodo = {
			...newTodo,
			colorHex: getColorHex(newTodo.color),
			reminder: formatReminder(newTodo.reminder),
		};

		res.status(201).json(formattedTodo);
	} catch (error) {
		console.error("Error creating todo:", error);
		res.status(500).json({ error: "Failed to create new todo" });
	}
});

router.patch("/:id", verifyToken, async (req, res) => {
	const userId = req.user.userId;
	const todoId = req.params.id;
	const { completed, title, description, color, reminder } = req.body;

	const updateFields = [];
	const updateValues = [];
	let paramCounter = 1;

	if (completed !== undefined) {
		updateFields.push(`completed = $${paramCounter}`);
		updateValues.push(completed);
		paramCounter++;
	}
	if (title !== undefined) {
		updateFields.push(`title = $${paramCounter}`);
		updateValues.push(title);
		paramCounter++;
	}
	if (description !== undefined) {
		updateFields.push(`description = $${paramCounter}`);
		updateValues.push(description);
		paramCounter++;
	}
	if (color !== undefined) {
		const validColors = ["red", "purple", "blue", "green", "yellow", "default"];
		updateFields.push(`color = $${paramCounter}`);
		updateValues.push(validColors.includes(color) ? color : "default");
		paramCounter++;
	}
	if (reminder !== undefined) {
		updateFields.push(`reminder = $${paramCounter}`);
		updateValues.push(reminder);
		paramCounter++;
	}

	if (updateFields.length === 0) {
		return res.status(400).json({ error: "No valid fields to update" });
	}

	const query = `UPDATE todos SET ${updateFields.join(
		", "
	)} WHERE id = $${paramCounter} AND user_id = $${
		paramCounter + 1
	} RETURNING *`;
	updateValues.push(todoId, userId);

	try {
		const result = await db.query(query, updateValues);

		if (result.rows.length === 0) {
			return res
				.status(404)
				.json({ error: "Todo not found or not owned by user" });
		}

		const updatedTodo = result.rows[0];
		const formattedTodo = {
			...updatedTodo,
			colorHex: getColorHex(updatedTodo.color),
			reminder: formatReminder(updatedTodo.reminder),
		};

		res.json(formattedTodo);
	} catch (error) {
		console.error("Error updating todo:", error);
		res.status(500).json({ error: "Failed to update todo" });
	}
});

router.delete("/:id", verifyToken, async (req, res) => {
	const { id } = req.params;
	const userId = req.user.userId;

	try {
		const result = await db.query(
			"DELETE FROM todos WHERE id = $1 AND user_id = $2",
			[id, userId]
		);

		if (result.rowCount === 0) {
			return res.status(404).json({ message: "Task not found" });
		}

		res.json({ message: "Task deleted" });
	} catch (error) {
		console.error("Error deleting todo:", error);
		res.status(500).json({ message: "Internal server error" });
	}
});

router.get("/myday", verifyToken, async (req, res) => {
	const userId = req.user.userId;

	const query = `
    SELECT * FROM todos 
    WHERE user_id = $1 
    AND reminder IS NOT NULL
    AND completed = FALSE
    AND (
      DATE(reminder) = CURRENT_DATE
      OR DATE(reminder) < CURRENT_DATE
    )
    ORDER BY reminder ASC
  `;

	try {
		const result = await db.query(query, [userId]);
		const formattedTodos = result.rows.map((todo) => ({
			...todo,
			colorHex: getColorHex(todo.color),
			reminder: formatReminder(todo.reminder),
		}));

		res.json(formattedTodos);
	} catch (error) {
		console.error("Error fetching my day todos:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
