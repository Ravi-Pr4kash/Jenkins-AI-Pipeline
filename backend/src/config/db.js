const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    host: "postgres",
    database: "docker_project",
    password: "postgres",
    port: 5432
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