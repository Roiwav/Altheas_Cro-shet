const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

const verifyToken = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallbackSecret");
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) return res.status(401).json({ message: "Not authorized, user not found" });
      const now = new Date();
      if (req.user.suspendedUntil && req.user.suspendedUntil > now) {
        return res.status(401).json({ message: "Account suspended" });
      }
      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
  if (!token) return res.status(401).json({ message: "Not authorized, no token" });
};

module.exports = { verifyToken };

// Additional export: requireAdmin guard
module.exports.requireAdmin = (req, res, next) => {
  try {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) return next();
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  } catch (e) {
    return res.status(403).json({ message: 'Forbidden' });
  }
};
