import dotenv from 'dotenv';
import path from "path";
dotenv.config();
export const config = {
    jwtSecret: process.env.JWT_SECRET || "",
    mongourl: process.env.mongourl || "",
    domain: process.env.domain || "",
    connectionURL: process.env.qdrantURL || "",
    connectionKey: process.env.qdrantKey || "",
    UPLOAD_PATH: process.env.UPLOAD_PATH
        ? path.resolve(process.cwd(), process.env.UPLOAD_PATH)
        : path.resolve(process.cwd(), "uploads"),
};
