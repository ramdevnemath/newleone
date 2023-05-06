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
// const MongoDBStore = require('connect-mongodb-session')
const connectDB = require('./config/connection')
const multer = require('multer')
require('dotenv').config();

var userRouter = require('./routes/users');
var adminRouter = require('./routes/admin');

var app = express();
app.use(expressLayout);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('layout','./layout/layout')


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret:"Key",cookie:{maxAge:6000000}}))

app.use('/', userRouter);
app.use('/admin', adminRouter);

db.connect((err) => {
  if (err) console.log("Connection Error" + err);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('users/error');
});

module.exports = app;
