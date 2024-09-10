// index.js
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./Models/User'); // Import User model

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/userapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true
}));

// Routes
app.use('/', require('./Routes/userRoutes'));

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
