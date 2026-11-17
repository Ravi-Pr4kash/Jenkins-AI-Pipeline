
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "postgres",
  database: process.env.DB_NAME || "docker_project",
  password: process.env.DB_PASSWORD || "postgres",
  port: Number(process.env.DB_PORT || 5432),
});

pool.connect()
  .then(client => {
    console.log("PostgreSQL connected!");
    client.release();
  })
  .catch(err => {
    console.error("PostgreSQL connection failed:", err);
  });

module.exports = pool;
