const express = require("express");
const router = express.Router();

const requestController = require("../controllers/requestController");

const { isAuthenticated } = require("../middleware/auth");

router.get("/", isAuthenticated, requestController.getRequests);

router.post("/", isAuthenticated, requestController.sendRequest);

router.patch("/:id", isAuthenticated, requestController.updateRequest);

module.exports = router;