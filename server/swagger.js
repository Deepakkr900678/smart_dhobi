console.log("🔥 THIS IS MY SWAGGER FILE");

const swaggerAutogen = require("swagger-autogen")();

const PORT = process.env.PORT || 8000;

const doc = {
  swagger: "2.0",
  info: {
    title: "SmartDhobi API",
    description: "Auto-generated API documentation",
    version: "1.0.0",
  },
  host: `localhost:${PORT}`,
  basePath: "/",
  schemes: ["http"],
};

const outputFile = "./swagger-output.json";

const endpointsFiles = [
  "./server.js",
  "./routes/authRoutes.js",
  "./routes/userRoutes.js",
  "./routes/adminRoutes.js",
  "./routes/providerRoutes.js",
  "./routes/orderRoutes.js",
  "./routes/reviewRoutes.js",
  "./routes/paymentRoutes.js",
  "./routes/notificationRoutes.js",
];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log("✅ Swagger file generated successfully");
});