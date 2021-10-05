const { Pool } = require('pg');

var pool = new Pool({
    user: process.env.user,
    password: process.env.password,
    host: process.env.host,
    port: process.env.port,
    database: process.env.database

});

exports.pool = pool;
