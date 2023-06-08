const express = require("express");
const router = express.Router();
const { User, Friendship, DirectMessage, Bundle, UserBundle } = require("../../models")
const sequelize = require("../../config/connection");
const { QueryTypes, Op } = require('sequelize');
const jwt = require("jsonwebtoken");

// Routes for /api/shop

// GET Bundle by bundleid
router.get("/:bundleid", (req, res) => {
    Bundle.findOne({
        where: { id: req.params.bundleid},
    }).then(bundleObj => {
        if (!bundleObj) {
            return res.status(404).json({ msg: "BundleId not found" });
        } else {
            return res.json(bundleObj);
        };
    }).catch(err => {
        console.log(err);
        res.status(500).json({ msg: "Error Occurred", err });
    });
});

// GET all Bundles 
// JWT is optional: if not provided, returns ALL Bundles. If provided, returns only Bundles NOT already owned by User
router.get("/", async (req, res) => {
    try {
        // Check if there is a token provided
        const token = req.headers.authorization?.split(" ")[1];
        // if no token, return all Bundles 
        if (!token) {
            const allBundlesArr = await Bundle.findAll()
            if (allBundlesArr.length === 0) {
                return res.status(404).json({ msg: "No Bundles found" });
            } else {
                return res.json(allBundlesArr);
            };
        };
        // if there is a token, return only Bundles NOT already owned by User
        const authData = jwt.verify(token, process.env.JWT_SECRET);
        const filteredBundleArr = await sequelize.query(
            `SELECT Bundles.*
            FROM Bundles
            EXCEPT (
                SELECT Bundles.*
                FROM UserBundles
                LEFT JOIN Bundles ON UserBundles.BundleId = Bundles.id 
                WHERE UserBundles.UserId = ${authData.userId}
            )
            ORDER BY id ASC;`,
            { type: QueryTypes.SELECT }
        )
        if (filteredBundleArr.length === 0) {
            return res.status(404).json({ msg: "No Bundles found" });
        } else {
            return res.json(filteredBundleArr);
        };
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Error Occurred", err });
    };
});

module.exports = router;