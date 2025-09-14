import serverless from "serverless-http";
import express, { type Request, type Response } from "express";
import { doGet, doPost } from "./appscript";

const app = express();

// CORS middleware
app.use((req: Request, res: Response, next) => {
  const allowedOrigins = ['http://localhost:5173', 'https://argtrip.sonsolesstays.com'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin as string)) {
    res.setHeader('Access-Control-Allow-Origin', origin as string);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req: Request, res: Response) => {
  const response = await doGet({
    parameter: {
      endpoint: req.query["endpoint"] as string,
      email: req.query["email"] as string,
      password: req.query["password"] as string,
    },
  });
  return res.json(response);
});

app.post("/", async (req: Request, res: Response) => {
  const response = await doPost(req.body);
  return res.json(response);
});

const handler = serverless(app);

export { handler };
