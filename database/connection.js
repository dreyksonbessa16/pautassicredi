const { Pool } = require('pg');

var pool = new Pool({
    user: "sicredi",
    password: "teste01",
    host: "192.168.77.38",
    port: 5432,
    database: "pautas-sessao"

});

exports.pool = pool;
