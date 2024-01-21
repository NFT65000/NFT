const express = require("express");
const publishController = require("../controllers/publishController");

const router = express.Router();
// multiple file upload
router.post("/generate/:address/:id", publishController.generateArts);
router.post("/download/:address/:id", publishController.downloadZip);
router.post("/compile/:address/:id", publishController.compileNFTContract);
router.post("/compile-smart-contract", publishController.compileSmartContract);
router.post("/ipfs/:address/:id", publishController.pinFolderToIPFS);
module.exports = router;
