const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'qwerty12345';

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied, token not found!' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    if (err.name == 'TokenExpiredError') {
      return res.status(403).json({ message: 'Your session expired, please re-login!' });
    }
    return res.status(401).json({ message: 'Invalid token!' });
  }
};

module.exports = verifyToken;