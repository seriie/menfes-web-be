require('dotenv').config();


function verifyApiKey(req, res, next) {
    const validApiKeys = process.env.VALID_API_KEY ? process.env.VALID_API_KEY.split(',') : [];
    const apiKey = req.query.KEY;
    if (!apiKey) {
        return res.status(401).json({ error: 'API key is missing!' });
    }

    if (!validApiKeys.includes(apiKey)) {
        return res.status(403).json({ error: 'Invalid API key!' });
    }

    next();
}

module.exports = verifyApiKey;