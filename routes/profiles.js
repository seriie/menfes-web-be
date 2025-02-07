const express = require('express');
const queryDb = require('../helper/query');
const verifyApiKey = require('../middleware/api_key');

const router = express.Router();

router.get('/:username', verifyApiKey, async (req, res) => {
    try {
        const { username } = req.params;
        const query = 'SELECT id, username, join_date, profile_picture, role FROM users WHERE username = ?';
        const profiles = await queryDb(query, [username]);
    
        if (profiles.length === 0) {
          return res.status(404).json({ message: "User not found" });
        }
    
        res.json(profiles[0]);
    } catch (e) {
        res.status(500).json({ message: "An error occurred" });
    }
});

module.exports = router;