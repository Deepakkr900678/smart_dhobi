const authorizeRoles = (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          message: "Unauthorized. User not found in request",
        });
      }
  
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          message: `Access denied. Role '${req.user.role}' is not allowed`,
        });
      }
  
      next();
    };
  };
  
  module.exports = authorizeRoles;