const express = require('express');
const app = express();
const routes = require('./routes');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require("cors");

app.use((req, res, next) =>{
    req.header('Access-Control-Allow-Origin', '*');
    req.header(
        'Access-Control-Allow-Header', 
        'Origin, X-Requerested-Width, Content-Type, Accept, Authorization'
    );
    if ( req.method === 'OPTIONS' ) {
        res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, PATCH, DELETE');
        return res.status(200).send({});
    }
    next();
});

app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());


app.use(routes);

module.exports = app;