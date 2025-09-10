import express, { Request, Response, Express } from "express";
import dotenv from "dotenv";
import { initDb } from "./db/initdb";
import { loginRouter } from "./routes/login";
import { registerRouter } from "./routes/register";
import { activitiesRouter } from "./routes/activities";
import validationRoute from "./routes/validateToken";
import { streaksRouter } from "./routes/streaks";
import cors from "cors";
import cron from "node-cron";
import path from "path";
import { createServer } from "http";

dotenv.config();

const app: Express = express();
const port: number = Number(process.env.PORT) || 3000;

const server = createServer(app);

const allowedOrigins: string[] = process.env.ALLOWED_ORIGINS?.split(",") || [];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

initDb();

app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.json());
app.use("/api/login", loginRouter);
app.use("/api/register", registerRouter);
app.use("/api/activities", activitiesRouter);
app.use("/api/validate", validationRoute);
app.use("/api/streaks", streaksRouter);
app.options("*", cors());

app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.get("/wakeup", (req: Request, res: Response) => {
  res.status(200).json({ message: "Server is awake" });
});

server.listen(port, (): void => {
  console.log(`Server is running on http://localhost:${port}`);
});
