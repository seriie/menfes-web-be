const express = require("express");
const verifyToken = require("../middleware/token");
const queryDb = require('../helper/query');
const verifyApiKey = require("../middleware/api_key");

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
        const userAgent = req.headers["user-agent"];
        const referrer = req.get("Referer") || "Direct";
        const encoding = req.headers["accept-encoding"];

        const sql = "SELECT COUNT(*) AS count FROM visitors WHERE ip_address = ? AND user_agent = ? AND DATE(visit_date) = CURDATE()";
        const existingVisitors = await queryDb(sql, [ip, userAgent]);

        if (existingVisitors[0].count == 0) {
            await queryDb(
                "INSERT INTO visitors (ip_address, user_agent, referrer_url, encoding) VALUES (?, ?, ?, ?)",
                [ip, userAgent, referrer, encoding]
            );
        }
    } catch (e) {
        console.error('Error logging visitors: ', e);
        res.status(500).json({ message: {
            error: "Internal server error!"
        } });
    }
});

router.get('/today', async (req, res) => {
    try {
        const sql = "SELECT COUNT(*) AS today FROM visitors WHERE DATE(visit_date) = CURDATE()";
        const result = await queryDb(sql);

        res.status(200).json(result);
    } catch (e) {
        res.status(500).json({ message: {
            error: "Internal server error!"
        } });
    }
});

router.get('/total', async (req, res) => {
    try {
        const sql = "SELECT COUNT(*) AS total FROM visitors";
        const result = await queryDb(sql);

        res.status(200).json(result);
    } catch (e) {
        res.status(500).json({ message: {
            error: "Internal server error!"
        } });
    }
});

module.exports = router;