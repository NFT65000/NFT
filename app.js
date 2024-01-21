// Import modules
require("dotenv").config();
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require("cors");
const basePath = process.cwd();

// Import Routers
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var projectRouter = require("./routes/project");
var traitsRouter = require("./routes/traits");
var publishRouter = require("./routes/publish");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "/public")));
// Set Routes
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/project", projectRouter);
app.use("/traits", traitsRouter);
app.use("/publish", publishRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
