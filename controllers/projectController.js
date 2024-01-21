const express = require("express");
const router = express.Router();
const basePath = process.cwd();
const fs = require("fs");
const { s3Bucket } = require("../utils/s3Bucket");
const Project = require("./../models/project");

const getProjects = (req, res, next) => {
  var address = req.params.id;
  Project.find(
    { address: address },
    null,
    { sort: { created_at: -1 } },
    (err, docs) => {
      if (err) {
      } else {
        res.json(docs);
      }
    }
  );
};

const getAProject = (req, res, next) => {
  var id = req.params.id;
  Project.findById(id, (err, docs) => {
    if (err) {
    } else {
      res.json(docs);
    }
  });
};

const addProject = async (req, res, next) => {
  var address = req.params.id;
  let addedProject = await Project.create({
    address: address,
  });

  createJsonFile(`asset/arts/${address}/${addedProject._id}`, "_metadata.json");
  if (!fs.existsSync(`${basePath}/public/asset/arts/${address}`)) {
    fs.mkdirSync(`${basePath}/public/asset/arts/${address}`, {
      recursive: true,
    });
  }
  if (
    !fs.existsSync(
      `${basePath}/public/asset/arts/${address}/${addedProject._id}`
    )
  ) {
    fs.mkdirSync(
      `${basePath}/public/asset/arts/${address}/${addedProject._id}`,
      { recursive: true }
    );
  }
  if (
    !fs.existsSync(
      `${basePath}/public/asset/arts/${address}/${addedProject._id}/metajsons`
    )
  ) {
    fs.mkdirSync(
      `${basePath}/public/asset/arts/${address}/${addedProject._id}/metajsons`,
      { recursive: true }
    );
  }
  if (
    !fs.existsSync(
      `${basePath}/public/asset/arts/${address}/${addedProject._id}/collections`
    )
  ) {
    fs.mkdirSync(
      `${basePath}/public/asset/arts/${address}/${addedProject._id}/collections`,
      { recursive: true }
    );
  }

  res.json({
    status: "success",
    message: "Please set all parameters correctly.",
    data: addedProject,
  });
};

const updateTraits = async (req, res, next) => {
  let projectID = req.params.id;
  let address = req.params.address;
  let projectInfo = req.body;
  let updatedProject = await Project.findByIdAndUpdate(projectID, projectInfo);
  let arrTraits = req.body.traits.split(",");

  arrTraits.forEach((item, index) => {
    if (
      !fs.existsSync(
        `${basePath}/public/asset/arts/${address}/${updatedProject._id}/traits/${item}`
      )
    ) {
      // fs.mkdirSync(
      //   `${basePath}/public/asset/arts/${address}/${updatedProject._id}/traits/${item}`,
      //   { recursive: true }
      // );
    }
  });
  res.json({ status: "success", data: req.body });
};

const updateProject = async (req, res, next) => {
  let projectID = req.params.id;
  let projectInfo = req.body;
  let updatedProject = await Project.findByIdAndUpdate(projectID, projectInfo);
  res.json({ status: "success", data: req.body });
};

const createJsonFile = async (_path, _name) => {
  let jsonData = [];
  let strEmptyArray = JSON.stringify(jsonData);
  try {
    var params = {
      Bucket: process.env.S3_BUCKET,
      Key: `${_path}/${_name}`,
      Body: Buffer.from(strEmptyArray),
      ContentType: "application/json",
    };
    const data = await s3Bucket.upload(params).promise();
  } catch (error) {}
};

const removeFolder = async (req, res, next) => {
  let projectID = req.params.id;
  let address = req.params.address;
  let folder = req.params.folder;
  const traits_path = `${basePath}/public/asset/arts/${address}/${projectID}/traits/${folder}`;
  if (fs.existsSync(traits_path)) {
    fs.rmdirSync(traits_path, { recursive: true, force: true });
  }
  return res.json({ status: "success" });
};

module.exports = {
  getProjects,
  addProject,
  getAProject,
  updateProject,
  updateTraits,
  removeFolder,
};
