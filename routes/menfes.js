const express = require("express");
const verifyToken = require("../middleware/token");
const queryDb = require('../helper/query');
const verifyApiKey = require("../middleware/api_key");

const router = express.Router();

// POST menfes
router.post("/", verifyToken, async (req, res) => {
    const { message, visibility, targetUsername, anonymous } = req.body;
    const userId = req.userId;

    if (!targetUsername && visibility === "private") {
        return res.status(400).json({ error: "Please input target username!" });
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
                "INSERT INTO menfes (user_id, message, created_at, visibility, anonymous) VALUES (?, ?, ?, ?, ?)", 
                [userId, message, created_at, visibility, anonymous]
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
        const menfes = await queryDb(`
            SELECT users.username, users.profile_picture, users.role, 
                   menfes.id, menfes.message, menfes.created_at, menfes.pinned, menfes.anonymous, 
                   COALESCE(like_count.total_likes, 0) AS total_likes 
            FROM menfes 
            LEFT JOIN users ON menfes.user_id = users.id 
            LEFT JOIN (
                SELECT menfes_id, COUNT(*) AS total_likes FROM likes GROUP BY menfes_id
            ) AS like_count 
            ON menfes.id = like_count.menfes_id 
            WHERE menfes.visibility = 'public' 
            ORDER BY menfes.pinned DESC, menfes.id DESC
        `);        

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

// POST like menfes
router.post('/likes', verifyToken, async (req, res) => {
    const { menfes_id } = req.body;
    const user_id = req.userId;

    if (!menfes_id) {
        return res.status(400).json({ error: "Menfes ID is required!" });
    }

    try {
        // Cek apakah user sudah like menfes ini
        const existingLike = await queryDb("SELECT * FROM likes WHERE user_id = ? AND menfes_id = ?", [user_id, menfes_id]);

        if (existingLike.length > 0) {
            // Jika sudah like, hapus like (unlike)
            await queryDb("DELETE FROM likes WHERE user_id = ? AND menfes_id = ?", [user_id, menfes_id]);
            return res.json({ message: "Menfes unliked!" });
        } else {
            const date = new Date().toISOString().slice(0, 10).replace("T", " ");
            const time = new Date().toLocaleTimeString();
            const created_at = `${date} ${time}`;
            
            await queryDb("INSERT INTO likes (user_id, menfes_id, created_at) VALUES (?, ?, ?)", [user_id, menfes_id, created_at]);
            return res.status(201).json({ message: "Menfes liked!" });
        }
    } catch (err) {
        console.error("Error liking menfes:", err.message);
        res.status(500).json({ error: "An error occurred" });
    }
});

router.get("/:id/likes", async (req, res) => {
    const { id } = req.params;

    try {
        const likes = await queryDb("SELECT COUNT(*) AS like_count FROM likes WHERE menfes_id = ?", [id]);
        res.status(200).json({ like_count: likes[0].like_count });
    } catch (err) {
        console.error("Error fetching likes:", err.message);
        res.status(500).json({ error: "An error occurred" });
    }
});

router.get('/:id/liked', verifyToken, async (req, res) => {
    const { id } = req.params;
    const user_id = req.userId;
    
    try {
        const result = await queryDb(
            "SELECT id FROM likes WHERE user_id = ? AND menfes_id = ?",
            [user_id, id]
        );

        res.status(200).json({ menfes_id: id, liked: result.length > 0 });
    } catch (e) {
        res.status(500).json({ message: "An error occurred" });
    }
});

router.post('/reply/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const user_id = req.userId;
    const { reply_message } = req.body;
    try {
        const date = new Date().toISOString().slice(0, 10).replace("T", " ");
        const time = new Date().toLocaleTimeString();
        const created_at = `${date} ${time}`;
        const query = "INSERT INTO replies (menfes_id, user_id, reply_message, created_at) VALUES (?, ?, ?, ?)";
        
        await queryDb(query, [id, user_id, reply_message, created_at]);
        res.status(200).json({ message: "Reply sent!" });
    } catch (e) {
        res.status(500).json({ message: "Error sending reply!" });
    }
});

router.get('/reply/:id', verifyApiKey, async (req, res) => {
    const { id } = req.params;
    try {
        const query = 'SELECT users.username, users.role, users.profile_picture, replies.menfes_id, replies.user_id, replies.reply_message, replies.created_at FROM replies JOIN users ON replies.user_id = users.id WHERE replies.menfes_id = ?';
        const result = await queryDb(query, [id]);

        res.json(result);
    } catch (e) {
        res.status(500).json({ message: "Error retrieving data" });
    }
});

router.patch("/:id/pin", async (req, res) => {
    try {
        const { id } = req.params;
        const [message] = await queryDb("SELECT pinned FROM menfes WHERE id = ?", [id]);

        if (!message) return res.status(404).json({ error: "Message not found" });
        
        const newPinnedStatus = !!message.pinned ? 0 : 1;

        if (newPinnedStatus === 1) {
            await queryDb("UPDATE menfes SET pinned = 0 WHERE pinned = 1");
        }        

        await queryDb("UPDATE menfes SET pinned = ? WHERE id = ?", [newPinnedStatus, id]);

        res.json({ success: true, pinned: newPinnedStatus });
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

router.delete("/:id", verifyToken, async (req, res) => {
    // const userId = req.userId;
    const { id } = req.params;

    try {
        const result = await queryDb(
            "DELETE FROM menfes WHERE id = ?",
            [id]
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