var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/healthcheck", function (req, res, next) {
  res.json("I am healthy.");
});

module.exports = router;
