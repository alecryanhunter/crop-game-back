const express = require("express");
const router = express.Router();
const { User, Friendship, DirectMessage, Bundle, UserBundle } = require("../../models")

// Routes for /api/shop

// GET all Bundles
router.get("/", (req, res) => {
    Bundle.findAll()
    .then(bundleArr => {
        if (bundleArr.length === 0) {
            return res.status(404).json({ msg: "No Bundles found" });
        } else {
            return res.json(bundleArr);
        };
    }).catch(err => {
        console.log(err);
        res.status(500).json({ msg: "Error Occurred", err });
    });
});

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

// GET the Bundles NOT already owned by User
// router.get("/users/:userid", (req, res) => {
//     sequelize.query(
//         `SELECT *
//         FROM Bundles
//         LEFT JOIN UserBundle
//         ORDER BY DirectMessages.createdAt DESC;`,
//         { type: QueryTypes.SELECT }
//     )
//     .then(bundleArr => {
//         if (bundleArr.length === 0) {
//             return res.status(404).json({ msg: "No Bundles found" });
//         } else {
//             return res.json(bundleArr);
//         };
//     }).catch(err => {
//         console.log(err);
//         res.status(500).json({ msg: "Error Occurred", err });
//     });
// });

module.exports = router;