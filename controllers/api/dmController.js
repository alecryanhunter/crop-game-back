const express = require("express");
const router = express.Router();
const { User, DirectMessage } = require("../../models")
const sequelize = require("../../config/connection");
const { QueryTypes } = require('sequelize');


// Routes for /api/dms

// Get all DMs between User and Friend
router.get("/:username/:friendname", (req, res) => {
    sequelize.query(
        `SELECT DirectMessages.*, Senders.username AS senderName, Receivers.username AS receiverName
        FROM DirectMessages LEFT JOIN Users AS Senders
        ON SenderId = Senders.id
        LEFT JOIN Users AS Receivers
        ON ReceiverId = Receivers.id
        WHERE (Senders.username = "${req.params.username}" AND Receivers.username = "${req.params.friendname}")
        OR (Senders.username = "${req.params.friendname}" AND Receivers.username = "${req.params.username}")
        ORDER BY createdAt;`,
        { type: QueryTypes.SELECT }
    ).then(dmArr => {
        if (dmArr.length === 0) {
            return res.status(404).json({ msg: "No Users found" });
        } else {
            return res.json(dmArr);
        };
    }).catch(err => {
        console.log(err);
        res.status(500).json({ msg: "Error Occurred", err });
    });
});


module.exports = router;