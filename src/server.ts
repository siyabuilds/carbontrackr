import express, { Request, Response, Express } from "express";

const app: Express = express();
const port: number = 3000;

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello World!" });
});

app.listen(port, (): void => {
  console.log(`Server is running on http://localhost:${port}`);
});
