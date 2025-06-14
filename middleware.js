// verifyToken.ts
import { config } from "./config.js";
import jwt from "jsonwebtoken";
export const verifyToken = (req, res, next) => {
    const authHeader = req.header("Authorization") || req.header("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Access denied: no token provided" });
        return;
    }
    const token = authHeader.split(" ")[1];
    console.log("verifyToken: token extracted:", token);
    if (!token) {
        res.status(401).json({ error: "Access denied: malformed token" });
        return;
    }
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        console.log("verifyToken decoded payload:", decoded);
        // Adjust extraction based on actual payload:
        const userId = decoded.userId ?? decoded._id ?? decoded.id;
        console.log("extracted userId:", userId);
        if (!userId) {
            res.status(401).json({ error: "Access denied: invalid token payload" });
            return;
        }
        console.log("verifyToken succeeded, userId:", userId);
        req.userId = String(userId);
        next();
        return;
    }
    catch (err) {
        console.error("verifyToken error:", err);
        res.status(401).json({ error: "Access denied: invalid token" });
        return;
    }
};
