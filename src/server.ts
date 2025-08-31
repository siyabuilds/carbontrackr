import express, { Request, Response, Express } from "express";
import dotenv from "dotenv";
import { initDb } from "./db/initdb";

dotenv.config();

const app: Express = express();
const port: number = Number(process.env.PORT) || 3000;

initDb();

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Hello World!" });
});

app.listen(port, (): void => {
  console.log(`Server is running on http://localhost:${port}`);
});
