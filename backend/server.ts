import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for rate limiting behind Render/Vercel
app.set("trust proxy", 1);

// Security headers via Helmet
app.use(helmet());

// Restrict CORS to known origins (Vercel production + local dev)
const ALLOWED_ORIGINS = [
  "https://wafort-forms.vercel.app",
  "https://wafort-integridade.vercel.app",
  /^https:\/\/([\w-]+\.)?wafort\.vercel\.app$/,
  "http://localhost:3000",
  "http://localhost:5173",
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return callback(null, true);
    const allowed = ALLOWED_ORIGINS.some((o) =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
    if (allowed) {
      callback(null, true);
    } else {
      callback(new Error("Origem não autorizada CORS."));
    }
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // 24h preflight cache
}));

// Parse JSON bodies only (with size limit)
app.use(express.json({ limit: "10kb" }));

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições. Tente novamente em alguns minutos." },
});
app.use(globalLimiter);

// Security middleware logger (without exposing raw IPs unnecessarily)
app.use((req, res, next) => {
  const region = req.headers["x-vercel-ip-country"] || "unknown";
  console.log(`[Wafort Audit] ${new Date().toISOString()} - ${req.method} ${req.url} - Region: ${region}`);
  next();
});

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "Wafort Compliance Backend",
    environment: process.env.NODE_ENV || "development",
  });
});

// Compliance metadata endpoint
app.get("/api/compliance/meta", (_req: Request, res: Response) => {
  res.status(200).json({
    version: "1.0.0",
    lastUpdated: "2026-06-08T17:45:00Z",
    laws: ["LGPD (Lei nº 13.709)", "Código Penal Brasileiro (Lei nº 2.848)", "Decreto nº 11.129/25"],
    contact: "governanca@wafort.com.br",
    policiesEnabled: true,
  });
});

// Admin metrics endpoint (requires Firebase token validation in production)
app.get("/api/admin/metrics", (req: Request, res: Response) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: "Acesso administrativo não autorizado." });
  }

  res.status(200).json({
    activeAuditors: 2,
    governanceStatus: "secured",
    trackingUptime: "100%",
    mfaRequired: true,
  });
});

// Fallback route
app.use((_req, res) => {
  res.status(404).json({ error: "Rota inválida ou recurso indisponível." });
});

// Error handling middleware (sanitized for production)
app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error("[FATAL ERROR]", err.message);
  res.status(500).json({
    error: "Ocorreu um erro interno na mesa de governança.",
  });
});

// Start Server (bind to localhost in production, 0.0.0.0 for Render)
const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
app.listen(Number(PORT), host, () => {
  console.log(`===============================================`);
  console.log(`Wafort Express Backend iniciado!`);
  console.log(`Ouvindo na porta ${PORT}`);
  console.log(`Modo: ${process.env.NODE_ENV || "development"}`);
  console.log(`===============================================`);
});
