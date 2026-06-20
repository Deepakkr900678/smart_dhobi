const express = require("express");
const cors = require("cors");
const http = require("http");
const dotenv = require("dotenv");
const fileUpload = require("express-fileupload");
const database = require("./config/database");
const { initSocket } = require("./socket");

dotenv.config();

const app = express();
const server = http.createServer(app);

/* =========================
   PAYOUT WEBHOOK
   Must come BEFORE express.json()
========================= */
const payoutController = require("./controllers/payoutController");
app.use(
  "/api/payout/webhook",
  express.raw({ type: "application/json" }),
  payoutController.handlePayoutWebhook
);

/* =========================
   CORS
========================= */
const allowedOrigins = [
  "http://localhost:5173",
  "http://44.211.176.149",
  "http://localhost:3000",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any localhost port in development
    if (
      process.env.NODE_ENV !== "production" &&
      /^http:\/\/localhost:\d+$/.test(origin)
    ) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
}));

/* =========================
   MIDDLEWARES
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({ useTempFiles: true, tempFileDir: "/tmp/" }));
app.use("/uploads", express.static("uploads"));

/* =========================
   ROUTES
========================= */
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/providers", require("./routes/providerRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/notification", require("./routes/notificationRoutes"));
app.use("/api/payout", require("./routes/payoutRoutes"));

/* =========================
   SWAGGER
========================= */
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (_req, res) => res.send("Welcome to SmartDhobi API 🚀"));
app.get("/health", (_req, res) => res.status(200).json({ status: "OK" }));

/* =========================
   START
========================= */
const PORT = process.env.PORT || 8000;

database.connectDb()
  .then(() => {
    initSocket(server);
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📄 Swagger: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  });