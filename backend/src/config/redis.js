const redis = require("redis");

const redisClient = redis.createClient({
    url: "redis://redis:6379"
});

redisClient.on("error", (err) => {
    console.error("Redis error:", err);
});

redisClient.on("connect", () => {
    console.log("Redis connected!");
});

module.exports = redisClient;
