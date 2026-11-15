const express = require("express");
const pool = require("./config/db");
const redisClient = require("./config/redis");
const userRoutes = require("./routes/user");

const app = express();

app.use(express.json());

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

        app.listen(3000, () => {
            console.log("Server running on port 3000");
        });
    } catch (error) {
        console.error("Failed to start application:", error);
        process.exit(1);
    }
}

startServer();