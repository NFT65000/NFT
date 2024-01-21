const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const basePath = process.cwd();
const fs = require("fs");
const multer = require("multer");
const fileUpload = require("../middlewares/upload-middleware");
const _ = require("lodash");
const Project = require("../models/project");
const { getPermutationsWithRarities } = require("../utils/utils");
const { s3Bucket } = require("../utils/s3Bucket");

const createPermutation = async (_address, _projectID, rarities) => {
  let projectSetting = await Project.findById(_projectID);
  let layers = projectSetting.traits;
  let totalSupply = projectSetting.totalsupply;
  let hasRarity = projectSetting.rarity;
  let layerArray = layers.split(",");
  const layerfiles = [];
  const layerImgUrls = JSON.parse(projectSetting.img_urls);
  layerImgUrls.forEach((layer, index) => {
    let layerInfo = layer.map(
      (item) => item.split("/")[item.split("/").length - 1]
    );
    layerfiles[index] = layerInfo;
  });

  var layerPermutation;
  if (!hasRarity) {
    layerPermutation = getPermutations(layerfiles);
  } else {
    const maxSupply = layerfiles.reduce((a, b) => a * b.length, 1);
    const maxPermutations = getPermutationsWithRarities(
      layerfiles,
      rarities,
      maxSupply
    );
    layerPermutation = maxPermutations.slice(0, totalSupply);
  }

  var arraylayer = [];
  layerPermutation.forEach((permutation, index) => {
    attributesList = [];
    rowper = [];
    var vtime = Date.now();
    rowAttribute = permutation.split(",");
    var ext = rowAttribute[0].split(".").pop();
    var DNA = crypto.createHmac("sha256", permutation).digest("hex");
    var objlayer = {};
    objlayer["dna"] = DNA;
    objlayer["name"] = `${index + 1}.${ext}`;
    objlayer["status"] = "pending"; //opt: (generate, upload, publish)
    objlayer["layers"] = layers; //layerArray;
    objlayer["attributes"] = permutation; //rowAttribute;
    arraylayer.push(objlayer);
  });

  const unique = [...new Map(arraylayer.map((m) => [m.dna, m])).values()];
  return arraylayer;
};

/* upload multiple files  */
const uploadTraits = async (req, res, next) => {
  var upload = multer({
    // storage: fileUpload.files.storage(),
    allowedFile: fileUpload.files.allowedFile,
  }).array("traits", 50);
  upload(req, res, async function (err, result) {
    if (err instanceof multer.MulterError) {
      return res.json({ status: "error", data: err });
    } else if (err) {
      return res.json({ status: "error", data: err });
    }
    let projectInfo = req.body;
    let imgUrls = [];
    let files = req.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const savePath = `${projectInfo.address}/${projectInfo.projectID}/traits/${projectInfo.name}/${file.originalname}`;
      var params = {
        Bucket: process.env.S3_BUCKET,
        Key: "asset/arts/" + savePath,
        Body: file.buffer, //got buffer by reading file path
        ContentType: file.mimetype,
      };

      try {
        const data = await s3Bucket.upload(params).promise();
        imgUrls.push(savePath);
      } catch (error) {}
    }
    res.json({ status: "success", data: imgUrls });
  });
};

//function getPermutations(layerfiles) {
const getPermutations = (layerfiles) => {
  let rowresult = [];
  var keyDNA = "traits"; // hash1;
  var objDNA = {};
  if (layerfiles.length == 1) {
    return layerfiles[0];
  } else {
    var result = [];
    var allCasesOfRest = getPermutations(layerfiles.slice(1)); // recursive array
    for (var i = 0; i < allCasesOfRest.length; i++) {
      rowresult = [];
      for (var j = 0; j < layerfiles[0].length; j++) {
        result.push(layerfiles[0][j] + "," + allCasesOfRest[i]);
      }
      rowresult.push(result[i]);
    }
    return result;
  }
};

/* create data permutation json */
const permutationTraits = async (req, res, next) => {
  var address = req.params.address;
  var projectID = req.params.id;
  let projectSetting = await Project.findById(projectID);
  let rarities = JSON.parse(projectSetting.rarity_values);
  var permutationData = await createPermutation(address, projectID, rarities);
  var strPermutationData = JSON.stringify(permutationData, null, 2);

  const permutationJsonSavePath = `asset/arts/${address}/${projectID}/_permutation.json`;
  var params = {
    Bucket: process.env.S3_BUCKET,
    Key: permutationJsonSavePath,
    Body: Buffer.from(strPermutationData), //got buffer by reading file path
    ContentType: "application/json",
  };
  try {
    const data = await s3Bucket.upload(params).promise();
    res.json({ status: "Permutation Json created", data: permutationData });
  } catch (error) {}
};

module.exports = {
  uploadTraits,
  permutationTraits,
};
