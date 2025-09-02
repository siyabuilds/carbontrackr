import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Access token is required" });
    }

    const JWT_SECRET =
      process.env.JWT_SECRET ||
      "carbon-footprint-tracker-secret-to-change-in-production";

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export { authenticateToken };
