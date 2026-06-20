const jwt = require('jsonwebtoken');


exports.generateAccessToken = (user) => {
const payload = { id: user._id, role: user.role };
return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRES || '1h' });
};