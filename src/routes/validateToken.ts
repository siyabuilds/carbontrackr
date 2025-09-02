import express, { Express, Request, Response, Router } from "express";
import dotenv from "dotenv";
import { authenticateToken } from "../middleware/auth";

dotenv.config();

const validationRoute: Router = express.Router();

validationRoute.get("/", authenticateToken, (req: Request, res: Response) => {
  res.json({ valid: true });
});

export default validationRoute;
