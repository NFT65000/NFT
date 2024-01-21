const express = require("express");
const axios = require("axios");
const https = require("https");
const path = require("path");
const crypto = require("crypto");
const router = express.Router();
const basePath = process.cwd();
const FormData = require("form-data");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const basePathConverter = require("base-path-converter");
const { getFilesFromPath, Web3Storage } = require("web3.storage");
const AdmZip = require("adm-zip");
const rfs = require("recursive-fs");
const xl = require("excel4node");
const wb = new xl.Workbook();
const ws = wb.addWorksheet("metadata");
const Project = require("../models/project");
const Pusher = require("pusher");
var solc = require("solc");
const { create } = require("ipfs-http-client");
const fsExtra = require("fs-extra");
const { s3Bucket } = require("../utils/s3Bucket");
// const AWS = require("aws-sdk");
// const { S3 } = AWS;
const s3Zip = require("s3-zip");
const JSZip = require("jszip");

const { createFFmpeg } = require("@ffmpeg/ffmpeg");
const { Stream } = require("stream");

const ffmpegInstance = createFFmpeg({
  log: true,
});
let ffmpegLoadingPromise = ffmpegInstance.load();

async function getFFmpeg() {
  if (ffmpegLoadingPromise) {
    await ffmpegLoadingPromise;
    ffmpegLoadingPromise = undefined;
  }
  return ffmpegInstance;
}

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  encrypted: true,
});

const data = [];
const web3_storage_key =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDQwOWQ2QjQyMEY0MDlhNTU3MDY4Rjg2MUZmNGYyQjdFOTdjMTc2ZUIiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NjA1MjA4NjIzODgsIm5hbWUiOiJuZnQtYXJ0LWdlbmVyYXRvciJ9.RYBanSkSiSLIccWGa0ltAOYK8PyWFedPESxWakZjGzI";

const client = new Web3Storage({ token: web3_storage_key });

const createMetaData = async (_address, _projectID, _ipfs_img_base_url) => {
  const projectSetting = await Project.findById(_projectID);
  var permutationDataParams = {
    Bucket: process.env.S3_BUCKET,
    Key: `asset/arts/${_address}/${_projectID}/_permutation.json`,
  };
  const dataPermutation = (
    await s3Bucket.getObject(permutationDataParams).promise()
  ).Body.toString("utf-8");
  const jsonParsedDataPermutation = JSON.parse(dataPermutation);

  await jsonParsedDataPermutation.forEach((permutation, idx) => {
    let arr_attributes = [];
    let traits_type = permutation.layers.split(",");
    let attributes_value = permutation.attributes.split(",");
    for (let j = 0; j < traits_type.length; j++) {
      arr_attributes.push({
        trait_type: traits_type[j],
        value: attributes_value[j].split(".")[0],
      });
    }
    let metadata = {
      name: projectSetting.name + " " + "#" + (idx + 1),
      description: projectSetting.description,
      image: _ipfs_img_base_url + "/" + permutation.name,
      attributes: arr_attributes,
    };
    fs.writeFile(
      `${basePath}/public/asset/arts/${_address}/${_projectID}/metajsons/${
        idx + 1
      }`,
      JSON.stringify(metadata, null, 2),
      "utf8",
      function (err) {
        if (err) throw err;
      }
    );
  });

  let metaJsonFolderPath = `${basePath}/public/asset/arts/${_address}/${_projectID}/metajsons`;
  const files = await getFilesFromPath(metaJsonFolderPath);
  const rootCid = await client.put(files);
  const metadata_url = `https://${rootCid}.ipfs.dweb.link/metajsons/`;
  await Project.findByIdAndUpdate(_projectID, {
    metadata_url: metadata_url,
  });
  return metadata_url;
};

const getFileName = (row, address, projectID) => {
  const arrFiles = [];
  if (typeof row === "undefined") {
    return;
  }
  const layer = row.layers.split(",");
  const filename = row.attributes.split(",");
  for (var i = 0; i <= layer.length - 1; i++) {
    arrFiles.push(
      `asset/arts/${address}/${projectID}/traits/${layer[i]}/${filename[i]}`
    );
  }
  return arrFiles;
};

const getComplexFilter = (row, rodId, address, projectID) => {
  const complexFilterObj = [];
  const layer = row.layers.split(",");
  for (var index = 0; index <= layer.length - 1; index++) {
    if (index < layer.length - 1) {
      layerFilter = {
        inputs: index === 0 ? ["0:v", "1:v"] : ["tmp", `${index + 1}:v`],
        filter:
          "overlay=0:0:format=rgb[overlayed];[overlayed]split[a][b];[a]palettegen=stats_mode=diff[palette];[b][palette]paletteuse",
        outputs: index === layer.length - 2 ? "tmp" : "tmp",
      };
      complexFilterObj.push(layerFilter);
    }
  }
  return complexFilterObj;
};

const writeToLocalDisk = (fileName, path) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path);
    s3Bucket
      .getObject({
        Bucket: process.env.S3_BUCKET,
        Key: fileName,
      })
      .createReadStream()
      .pipe(file);
    file.on("close", () => {
      resolve();
    });
  });
};

async function createCollectionSync(row, rodId, address, projectID) {
  return new Promise(async (resolve, reject) => {
    const command = ffmpeg();
    ffmpeg.setFfmpegPath(process.env.LINUX_FFMPGE_PATH);
    var gif = false;
    var ext = "gif";
    const attribute = getFileName(row, address, projectID);
    if (typeof attribute === "undefined") {
      return;
    }
    for (let i = 0; i < attribute.length; i++) {
      const fileName = attribute[i];
      try {
        extension = fileName.split(".").pop();
        if (extension.toLowerCase() == "gif") {
          gif = true;
        }
        const writePath = `${basePath}/public/temp/${address}-${projectID}-${rodId}-${i}.${extension}`;
        await writeToLocalDisk(fileName, writePath);
        command.input(writePath);
      } catch (err) {}
    }
    if (gif == true) {
      ext = "gif";
    } else {
      ext = "png";
    }
    const tempArtOutPutPath = `${basePath}/public/temp/${address}-${projectID}-${rodId}-art.${ext}`;
    command
      .complexFilter(getComplexFilter(row, rodId, address, projectID), "tmp")
      .output(tempArtOutPutPath)
      .on("progress", function (progress) {
        console.log(
          "Processing: " +
            progress.timemark +
            " done " +
            progress.targetSize +
            " kilobytes"
        );
      })
      .on("end", async function (err, stdout, stderr) {
        const savePath = `asset/arts/${address}/${projectID}/collections/${rodId}.${ext}`;
        const filePath = `${basePath}\\public\\temp\\${address}-${projectID}-${rodId}-art.${ext}`;
        console.log("Save path: ", savePath);
        console.log("File Path: ", filePath);
        try {
          const fileContent = fs.readFileSync(filePath);
          console.log("fileContent: ", fileContent);
          var params = {
            Bucket: process.env.S3_BUCKET,
            Key: savePath,
            Body: fileContent, //got buffer by reading file path
          };
          const data = await s3Bucket.upload(params).promise();
          console.log("Uploaded collection data: ", data);
          attribute.forEach((fileName, index) => {
            fs.unlinkSync(
              `${basePath}/public/temp/${address}-${projectID}-${rodId}-${index}.${ext}`
            );
          });
          fs.unlinkSync(tempArtOutPutPath);
          return await resolve(savePath);
        } catch (error) {
          console.log("generate error: ", error);
        }
        return resolve();
      })
      .run();
  });
}

async function createZip(_folderPath, _savedPath) {
  const outputFile = "arts.zip";
  const zip_file_path = _savedPath + "/" + outputFile;
  if (fs.existsSync(zip_file_path)) {
    return zip_file_path;
  } else {
    try {
      const zip = new AdmZip();
      await zip.addLocalFolder(_folderPath);
      await zip.writeZip(zip_file_path);
      return zip_file_path;
    } catch (e) {}
  }
}

const generateArts = async (req, res, next) => {
  const address = req.params.address;
  const projectID = req.params.id;
  const projectSetting = await Project.findById(projectID);
  const totalSupply = projectSetting.totalsupply;
  let collectionFolderPath = `${basePath}/public/asset/arts/${address}/${projectID}/collections`;
  let metajsonFolderPath = `${basePath}/public/asset/arts/${address}/${projectID}/metajsons`;
  fsExtra.emptyDirSync(collectionFolderPath, (err) => {
    if (err) {
    }
  });
  fsExtra.emptyDirSync(metajsonFolderPath, (err) => {
    if (err) {
    }
  });
  try {
  } catch (error) {}
  var metaDataParams = {
    Bucket: process.env.S3_BUCKET,
    Key: `asset/arts/${address}/${projectID}/_metadata.json`,
  };
  const dataMetadata = (
    await s3Bucket.getObject(metaDataParams).promise()
  ).Body.toString("utf-8");

  var permutationDataParams = {
    Bucket: process.env.S3_BUCKET,
    Key: `asset/arts/${address}/${projectID}/_permutation.json`,
  };
  const dataPermutation = (
    await s3Bucket.getObject(permutationDataParams).promise()
  ).Body.toString("utf-8");
  const jsonParsedDataPermutation = JSON.parse(dataPermutation);

  const filterItem = jsonParsedDataPermutation.filter(
    ({ status }) => status === "pending"
  );
  lastEdition = JSON.parse(dataMetadata).length;
  rowMetadata = [];
  findidx = [];
  randomItem = filterItem;

  var gif = false;
  var ext = "gif";
  if (gif == true) {
    ext = "gif";
  } else {
    ext = "png";
  }
  let generatedCollectionPath = [];
  for (var i = 0; i < totalSupply; i++) {
    const collectionPath = await createCollectionSync(
      randomItem[i],
      i + lastEdition + 1,
      address,
      projectID
    );
    console.log("Collection Path: ", collectionPath);
    generatedCollectionPath.push(collectionPath);
    pusher.trigger("img-process", "progress", {
      i,
    });
    var index = jsonParsedDataPermutation.findIndex(
      (obj) => obj.dna === randomItem[i].dna
    );
    findidx.push(index);
  }

  findidx.forEach(async (val, index) => {
    jsonParsedDataPermutation[val].status = "generate";
  });

  const permutationJsonSavePath = `asset/arts/${address}/${projectID}/_permutation.json`;
  var params = {
    Bucket: process.env.S3_BUCKET,
    Key: permutationJsonSavePath,
    Body: Buffer.from(JSON.stringify(jsonParsedDataPermutation, null, 2)), //got buffer by reading file path
    ContentType: "application/json",
  };
  const permutationUpdateData = await s3Bucket.upload(params).promise();
  console.log("generatedCollectionPath: ", generatedCollectionPath);
  await Project.findByIdAndUpdate(projectID, {
    status: "done",
    generated_collection_img_urls: generatedCollectionPath,
  });
  res.json({
    status: "success",
    message: "NFT arts are generated successfully.",
  });
};

const downloadZip = async (req, res, next) => {
  var zip = new JSZip();
  const address = req.params.address;
  const projectID = req.params.id;
  const projectSetting = await Project.findById(projectID);
  return res.json({
    collections: projectSetting.generated_collection_img_urls,
  });
};

const pinFolderToIPFS = async (req, res, next) => {
  let address = req.params.address;
  let projectID = req.params.id;
  const projectSetting = await Project.findById(projectID);
  let collectionFolderPath = `${basePath}/public/asset/arts/${address}/${projectID}/collections`;
  let collectionFiles = [];
  for (
    let i = 0;
    i < projectSetting.generated_collection_img_urls.length;
    i++
  ) {
    const item = projectSetting.generated_collection_img_urls[i];
    const writePath = `${basePath}/public/asset/arts/${address}/${projectID}/collections/${
      i + 1
    }.png`;
    await writeToLocalDisk(item, writePath);
  }
  const files = await getFilesFromPath(collectionFolderPath);
  const rootCid = await client.put(files);
  const ipfs_img_base_url = `https://${rootCid}.ipfs.dweb.link/collections`;

  await Project.findByIdAndUpdate(projectID, {
    ipfs_img_base_url: ipfs_img_base_url,
  });
  let metadata_url = await createMetaData(
    address,
    projectID,
    ipfs_img_base_url
  );
  let metajsonFolderPath = `${basePath}/public/asset/arts/${address}/${projectID}/metajsons`;
  fsExtra.emptyDirSync(collectionFolderPath, (err) => {
    if (err) {
    }
  });
  fsExtra.emptyDirSync(metajsonFolderPath, (err) => {
    if (err) {
    }
  });
  res.json({
    status: "success",
    message: "Your collection data has been successfully uploaded to IPFS.",
    url: metadata_url,
  });
};

const compileSmartContract = async (req, res, next) => {
  const { id, contract } = req.body;
  var input = {
    language: "Solidity",
    sources: {
      "NFT.sol": {
        content: contract,
      },
    },

    settings: {
      outputSelection: {
        "*": {
          "*": ["*"],
        },
      },
    },
  };
  var output = JSON.parse(solc.compile(JSON.stringify(input)));

  const abi = output.contracts["NFT.sol"]["NFT"].abi;
  const bytecode = output.contracts["NFT.sol"]["NFT"].evm.bytecode.object;

  await Project.findByIdAndUpdate(id, { abi: abi });

  return res.json({
    abi,
    bytecode,
  });
};

const compileNFTContract = async (req, res, next) => {
  const findImports = (path) => {
    let _path = `${basePath}/public/nft/${path}`;
    let content = fs.readFileSync(_path).toString();
    return {
      contents: content,
    };
  };

  const { tokenName, tokenSymbol } = req.body;

  // const name = "Test NFT";
  // const symbol = "TNT";

  let content = fs.readFileSync(`${basePath}/public/nft/NFT.sol`).toString();
  content.replace("{{NAME}}", tokenName);
  content.replace("{{SYMBOL}}", tokenSymbol);

  var input = {
    language: "Solidity",
    sources: {
      "NFT.sol": {
        content,
      },
    },

    settings: {
      outputSelection: {
        "*": {
          "*": ["*"],
        },
      },
    },
  };
  var output = JSON.parse(
    solc.compile(JSON.stringify(input), { import: findImports })
  );

  ABI = output.contracts["NFT.sol"]["NFT"].abi;
  bytecode = output.contracts["NFT.sol"]["NFT"].evm.bytecode.object;

  return res.json({
    status: "success",
    data: { bytecode, ABI },
  });
};

module.exports = {
  generateArts,
  pinFolderToIPFS,
  downloadZip,
  compileNFTContract,
  compileSmartContract,
};
