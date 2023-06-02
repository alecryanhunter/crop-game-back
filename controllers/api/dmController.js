const express = require("express");
const router = express.Router();
const { User, Friendship, DirectMessage } = require("../../models")
const sequelize = require("../../config/connection");
const { QueryTypes } = require('sequelize');


// `SELECT DirectMessages.id, DirectMessages.message, DirectMessages.createdAt,
// DirectMessages.FriendshipId, Friendships.status AS FriendshipStatus, Friendships.Friend1Id, Friendships.Friend2Id,
// DirectMessages.SenderId, IF(SenderId = Friend1Id, Friend1.username, Friend2.username) AS SenderName,
// IF(SenderId = Friend1Id, Friend2Id, Friend1Id) AS ReceiverId, IF(SenderId = Friend1Id, Friend2.username, Friend1.username) AS ReceiverName

// FROM DirectMessages 
// LEFT JOIN Friendships ON FriendshipId = Friendships.id
// LEFT JOIN Users AS Friend1 ON Friend1Id = Friend1.id
// LEFT JOIN Users AS Friend2 ON Friend2Id = Friend2.id
// ORDER BY DirectMessages.createdAt;`,

// Routes for /api/dms

// For a specific User, GET the most recent message with each friend (regardless of who was sender vs receiver)
router.get("/:username", (req, res) => {
    sequelize.query(
        `SELECT DirectMessages.id, DirectMessages.message, DirectMessages.createdAt,
        DirectMessages.FriendshipId, Friendships.status AS FriendshipStatus, Friendships.Friend1Id, Friendships.Friend2Id,
        DirectMessages.SenderId, IF(SenderId = Friend1Id, Friend1.username, Friend2.username) AS SenderName,
        IF(SenderId = Friend1Id, Friend2Id, Friend1Id) AS ReceiverId, IF(SenderId = Friend1Id, Friend2.username, Friend1.username) AS ReceiverName

        FROM DirectMessages 
        LEFT JOIN Friendships ON FriendshipId = Friendships.id
        LEFT JOIN Users AS Friend1 ON Friend1Id = Friend1.id
        LEFT JOIN Users AS Friend2 ON Friend2Id = Friend2.id
        JOIN (
            SELECT FriendshipId, MAX(createdAt) AS createdAt FROM DirectMessages
            GROUP BY FriendshipId
        ) AS Recent 
        ON (DirectMessages.FriendshipId = Recent.FriendshipId AND DirectMessages.createdAt = Recent.createdAt)

        WHERE (Friend1.username = "${req.params.username}" OR Friend2.username = "${req.params.username}" )

        ORDER BY DirectMessages.createdAt;`,
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

// GET all DMs between User and Friend
router.get("/:username/:friendname", (req, res) => {
    sequelize.query(
        `SELECT DirectMessages.id, DirectMessages.message, DirectMessages.createdAt,
        DirectMessages.FriendshipId, Friendships.status AS FriendshipStatus, Friendships.Friend1Id, Friendships.Friend2Id,
        DirectMessages.SenderId, IF(SenderId = Friend1Id, Friend1.username, Friend2.username) AS SenderName,
        IF(SenderId = Friend1Id, Friend2Id, Friend1Id) AS ReceiverId, IF(SenderId = Friend1Id, Friend2.username, Friend1.username) AS ReceiverName

        FROM DirectMessages 
        LEFT JOIN Friendships ON FriendshipId = Friendships.id
        LEFT JOIN Users AS Friend1 ON Friend1Id = Friend1.id
        LEFT JOIN Users AS Friend2 ON Friend2Id = Friend2.id

        WHERE (Friend1.username = "${req.params.username}" AND Friend2.username = "${req.params.friendname}" )
        OR (Friend1.username = "${req.params.friendname}" AND Friend2.username = "${req.params.username}" )
 
        ORDER BY DirectMessages.createdAt;`,
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