var express = require("express");
var router = express.Router();
var userController = require("../controllers/userController");

/* Sign Up and Login User. */
router.post("/signup", userController.signUpWithWallet);

module.exports = router;
