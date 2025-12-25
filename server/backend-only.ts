import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Enable CORS for frontend running on different port
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));

// Serve static files from sample-images directory
app.use('/sample-images', express.static(path.join(__dirname, '../sample-images')));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      console.log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error(`Error ${status}: ${message}`);
    res.status(status).json({ message });
  });

  // Simple health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "localhost",
    reusePort: false,
  }, () => {
    console.log(`🚀 Backend server running on http://localhost:${port}`);
    console.log(`📋 API endpoints available at http://localhost:${port}/api`);
    console.log(`💗 Health check: http://localhost:${port}/health`);
  });
})();
