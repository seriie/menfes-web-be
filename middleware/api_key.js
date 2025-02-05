require('dotenv').config();

const validApiKeys = process.env.VALID_API_KEY;

function verifyApiKey(req, res, next) {
    const apiKey = req.query.key;
    if (!apiKey) {
        return res.status(401).json({ error: 'API key is missing' });
    }

    if (validApiKeys !== apiKey) {
        return res.status(403).json({ error: 'Invalid API key' });
    }

    next();
}

module.exports = verifyApiKey;