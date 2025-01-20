const express = require("express");
const verifyToken = require("../middleware/token");
const queryDb = require('../helper/query');

const router = express.Router();

// POST menfes
router.post("/", verifyToken, async (req, res) => {
    const { message, visibility, targetUsername } = req.body;
    const userId = req.userId;
    const created_at = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Jakarta',
        hour12: false,
    });

    if (!message || !visibility) {
        return res.status(400).json({ error: "Message and visibility are required!" });
    }

    try {
        if (visibility === "private") {
            const targetUser = await queryDb(
                "SELECT id FROM users WHERE username = ?",
                [targetUsername]
            );

            if (targetUser.length === 0) {
                return res.status(404).json({ error: "Target user not found!" });
            }

            const targetUserId = targetUser[0].id;
            await queryDb(
                "INSERT INTO menfes (user_id, message, visibility, created_at, target_user_id) VALUES (?, ?, ?, ?, ?)",
                [userId, message, visibility, created_at, targetUserId]
            );

            return res.status(201).json({ message: "Private menfes sent!" });
        } else {
            await queryDb(
                "INSERT INTO menfes (user_id, message, created_at, visibility) VALUES (?, ?, ?, ?)",
                [userId, message, created_at, visibility]
            );

            return res.status(201).json({ message: "Public menfes sent!" });
        }
    } catch (err) {
        console.error("Error sending menfes:", err.message);
        res.status(500).json({ error: "An error occurred" });
    }
});

// GET public menfes
router.get("/public", async (req, res) => {
    try {
        const menfes = await queryDb(
            "SELECT users.username, menfes.message FROM menfes LEFT JOIN users ON menfes.user_id = users.id WHERE menfes.visibility = 'public'"
        );
        res.status(200).json(menfes);
    } catch (err) {
        console.error("Error fetching public menfes:", err.message);
        res.status(500).json({ error: "An error occurred" });
    }
});

// GET private menfes
router.get("/private", verifyToken, async (req, res) => {
    const userId = req.userId;
    try {
        const menfes = await queryDb(
            "SELECT users.id, users.username, menfes.message, menfes.created_at, target_user_id FROM menfes LEFT JOIN users ON menfes.user_id = users.id WHERE menfes.visibility = 'private' AND menfes.target_user_id = ?",
            [userId]
        );
        res.status(200).json(menfes);
    } catch (err) {
        console.error("Error fetching private menfes:", err.message);
        res.status(500).json({ error: "An error occurred" });
    }
});

// DELETE menfes
router.delete("/:id", verifyToken, async (req, res) => {
    const userId = req.userId;
    const { id } = req.params;

    try {
        const result = await queryDb(
            "DELETE FROM menfes WHERE id = ? AND user_id = ?",
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Menfes not found!" });
        }

        res.status(200).json({ message: "Menfes successfully deleted!" });
    } catch (err) {
        console.error("Error deleting menfes:", err.message);
        res.status(500).json({ error: "An error occurred" });
    }
});

module.exports = router;