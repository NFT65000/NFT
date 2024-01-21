const express = require("express");
const router = express.Router();
const basePath = process.cwd();
const fs = require("fs");
const jwt = require("jsonwebtoken");
const User = require("./../models/user");

// Sign Up with wallet
const signUpWithWallet = async (req, res) => {
  const { address } = req.body;
  let token, strMessage, strStatus, existingUser, httpStatus;
  existingUser = await User.findOne({ address: address });
  if (existingUser) {
    strStatus = "warning";
    strMessage = "Logged in successfully.";
    httpStatus = 200;
  } else {
    const newUser = new User({
      address,
    });
    try {
      await newUser.save();
      strStatus = "success";
      strMessage = "Your Account created successfully.";
      httpStatus = 201;
      if (!fs.existsSync(`${basePath}/public/asset/arts/${address}`)) {
        fs.mkdirSync(`${basePath}/public/asset/arts/${address}`, { recursive: true });
      }
    } catch (err) {
      return next(err);
    }
  }

  try {
    token = jwt.sign({ address: address }, process.env.jwt_secret, {
      expiresIn: "1h",
    });
  } catch (err) {
    return next(err);
  }
  res.status(httpStatus).json({
    status: strStatus,
    message: strMessage,
    data: {
      address: address,
      token: token,
    },
  });
};

module.exports = {
  signUpWithWallet,
};
