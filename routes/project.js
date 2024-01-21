const express = require("express");
const projectController = require("../controllers/projectController");

const router = express.Router();
router.get("/setting/all/:id", projectController.getProjects);
router.get("/setting/one/:id", projectController.getAProject);
router.post("/setting/add/:id", projectController.addProject);
router.post("/setting/update/:id", projectController.updateProject);
router.post(
  "/setting/update/traits/:address/:id",
  projectController.updateTraits
);
router.post(
  "/setting/delete/traits/:address/:id/:folder",
  projectController.removeFolder
);
module.exports = router;
