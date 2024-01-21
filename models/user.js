const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  address: {
    type: String,
    default: "",
    unique: true,
  },
  credit: {
    type: Number,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
