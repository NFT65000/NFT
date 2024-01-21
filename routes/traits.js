const express = require("express");
const traitsController = require("../controllers/traitsController");

const router = express.Router();
// multiple file upload
router.post("/upload", traitsController.uploadTraits);
router.post("/permutation/:address/:id", traitsController.permutationTraits);
module.exports = router;
