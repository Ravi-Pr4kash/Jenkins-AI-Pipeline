const express = require("express");
const pool = require("./config/db");
const redisClient = require("./config/redis");
const userRoutes = require("./routes/user");
const client = require("prom-client");

client.collectDefaultMetrics();

// Count HTTP requests
const httpRequests = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

// Measure response time
const httpDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
});

const app = express();

app.use(express.json());

// Middleware
app.use((req, res, next) => {
  if (req.path === "/metrics") return next();

  const start = process.hrtime();

  res.on("finish", () => {
    const duration = process.hrtime(start);
    const seconds = duration[0] + duration[1] / 1e9;

    const route = req.route
      ? `${req.baseUrl}${req.route.path}`
      : "unmatched";

    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    httpRequests.inc(labels);
    httpDuration.observe(labels, seconds);
  });

  next();
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.get("/", (req, res) => {
    res.json({
        message: "Docker Backend API is running!"
    });
});

app.get("/init-db", async (req, res) => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL
            )
        `);

        res.json({ message: "Users table created successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.use("/users", userRoutes);

async function startServer() {
    try {
        await redisClient.connect();

        console.log("Redis connection established");

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
});
    } catch (error) {
        console.error("Failed to start application:", error);
        process.exit(1);
    }
}

startServer();