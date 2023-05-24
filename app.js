var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var mongoose = require('mongoose')
var db = require("./config/connection");
const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const expressLayout = require('express-ejs-layouts')
const flash = require('express-flash')
const methodOverride = require('method-override')
var swal = require('sweetalert2')
// const MongoDBStore = require('connect-mongodb-session')

var app = express();

app.use(flash())

app.use(function (req, res, next) {
  if (req.path === '/login') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

const connectDB = require('./config/connection')
const multer = require('multer')
require('dotenv').config();

var userRouter = require('./routes/users');
var adminRouter = require('./routes/admin');

app.use(expressLayout);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('layout', './layout/layout')

app.use(methodOverride('_method'));
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(bodyParser.json())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: "Key", cookie: { maxAge: 6000000 } }))

app.use('/', userRouter);
app.use('/admin', adminRouter);

db.connect((err) => {
  if (err) console.log("Connection Error" + err);
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
