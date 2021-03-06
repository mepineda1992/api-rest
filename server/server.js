const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path')
const User = require('./models/userModel')
const routes = require('./routes/route.js');
require("dotenv").config({
  path: path.join(__dirname, "../.env")
});

var jsyaml = require('js-yaml');
var fs = require('fs');

const app = express();

const PORT = process.env.PORT || 4000;

const DB_PORT = process.env.DB_PORT || 27017;

const DB_HOSTNAME = process.env.DB_HOSTNAME || "localhost";

const DB_NAME = process.env.DB_NAME || "votos";

const JWT_SECRET = process.env.JWT_SECRET || "secret123"

mongoose.connect(`mongodb://${DB_HOSTNAME}:${DB_PORT}/${DB_NAME}`, { useNewUrlParser: true }).then(() => {
  console.log('Connected to the Database successfully')
});

app.use(bodyParser.urlencoded({ extended: true }));

app.use(async (req, res, next) => {

  if (req.headers["x-access-token"]) {
    try {
      const accessToken = req.headers["x-access-token"];
      const { userId, exp } = await jwt.verify(accessToken, JWT_SECRET);
      // If token has expired
      if (exp < Date.now().valueOf() / 1000) {
        return res.status(401).json({
          error: "JWT token has expired, please login to obtain a new one"
        });
      }
      res.locals.loggedInUser = await User.findById(userId);
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});
//without swagger
// app.use('/', routes);
var spec = fs.readFileSync(path.join(__dirname,'./app.yaml'), 'utf8');

var swaggerUi = require('swagger-ui-express'),
    swaggerDocument = jsyaml.safeLoad(spec);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/', routes);

app.listen(PORT, () => {
  console.log('Server is listening on Port:', PORT)
})