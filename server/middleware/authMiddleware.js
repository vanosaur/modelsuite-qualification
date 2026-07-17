const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BlacklistedToken = require("../models/BlacklistedToken");
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 1. Extract token first
      token = req.headers.authorization.split(" ")[1];

      // 2. Check blacklist
      const blacklisted = await BlacklistedToken.findOne({ token });

      if (blacklisted) {
        return res.status(401).json({
          message: "Token has been invalidated",
        });
      }

      // 3. Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Load user
      req.user = await User.findById(decoded.id).select("-password");

      return next();
    } catch {
      return res.status(401).json({
        message: "Not authorized, token failed",
      });
    }
  }

  return res.status(401).json({
    message: "Not authorized, no token",
  });
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admins only' });
  }
};

module.exports = { protect, adminOnly };
