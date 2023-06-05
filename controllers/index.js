const express = require("express");
const router = express.Router();

const apiRoutes = require("./api");
router.use("/api", apiRoutes);

router.get("/", (req, res) => {
    res.send("Visit us at https://cropposition.netlify.app/");
});

module.exports = router;

