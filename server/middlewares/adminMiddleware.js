// const adminMiddleware = (req, res, next) => {
//     if (req.user.role !== 'admin') {
//         return res.status(403).json({ message: 'Access denied. You are not an admin.' });
//     }
//     next();
// };

// module.exports = adminMiddleware;

"use strict";

/**
 * Middleware: restrict access to admin users only.
 * Must be used AFTER authMiddleware (which populates req.user).
 */
const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admins only.",
        });
    }
    next();
};

module.exports = adminMiddleware;
