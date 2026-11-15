const express = require("express");
const pool = require("../config/db");
const redisClient = require("../config/redis");

const router = express.Router();

const CACHE_KEY = "users:all";

// Create user
router.post("/", async (req, res) => {
    try {
        const { name, email } = req.body;

        const result = await pool.query(
            `INSERT INTO users (name, email)
             VALUES ($1, $2)
             RETURNING *`,
            [name, email]
        );

        // Invalidate old cached users
        await redisClient.del(CACHE_KEY);

        res.status(201).json({
            message: "User created successfully",
            user: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all users
router.get("/", async (req, res) => {
    try {
        // 1. Check Redis
        const cachedUsers = await redisClient.get(CACHE_KEY);

        if (cachedUsers) {
            console.log("Cache HIT");

            return res.json({
                source: "Redis Cache",
                users: JSON.parse(cachedUsers)
            });
        }

        console.log("Cache MISS");

        // 2. Fetch from PostgreSQL
        const result = await pool.query(
            "SELECT * FROM users ORDER BY id"
        );

        const users = result.rows;

        // 3. Store result in Redis for 60 seconds
        await redisClient.set(
            CACHE_KEY,
            JSON.stringify(users),
            { EX: 60 }
        );

        // 4. Return result
        res.json({
            source: "PostgreSQL",
            users
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;