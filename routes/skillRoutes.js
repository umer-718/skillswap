const express = require("express");
const router = express.Router();

const skillController = require("../controllers/skillController");

const { isAuthenticated } = require("../middleware/auth");

router.get("/", skillController.getSkills);

router.get("/mine", isAuthenticated, skillController.getMySkills);

router.post("/", isAuthenticated, skillController.addSkill);

router.delete("/:id", isAuthenticated, skillController.deleteSkill);

module.exports = router;