const express = require("express");
const router = express.Router();

const userRoutes = require("./userController");
router.use("/users", userRoutes);

const dmRoutes = require("./dmController");
router.use("/dms", dmRoutes);

module.exports = router;