const express = require("express");
const router = express.Router();
const { User, Friendship, DirectMessage } = require("../../models")
const sequelize = require("../../config/connection");
const { QueryTypes, Op } = require('sequelize');
const jwt = require("jsonwebtoken");


// Routes for /api/dms

// POST new DM 
// (Verify JWT)
router.post("/:username/:friendname", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const authData = jwt.verify(token, process.env.JWT_SECRET);
        if (authData.username.toLowerCase() !== req.params.username.toLowerCase()) {
            return res.status(403).json({ msg: "Not authorized for this UserId" })
        } else {
            // Find the Friendship between the 2 Users
            const friendshipArr = await sequelize.query(
                `SELECT UserFriendships.FriendshipId
                    FROM Users 
                    LEFT JOIN UserFriendships on Users.id = UserFriendships.Userid
                    WHERE Users.username = "${req.params.username}"
                INTERSECT (
                    SELECT UserFriendships.FriendshipId
                    FROM Users 
                    LEFT JOIN UserFriendships on Users.id = UserFriendships.Userid
                    WHERE Users.username = "${req.params.friendname}"
                    );`,
                { type: QueryTypes.SELECT }
            )
            // If the Frienship exists, POST the DM
            if (friendshipArr.length === 0) {
                return res.status(404).json({ msg: "Friendship not found" });
            } else {
                const dmObj = await DirectMessage.create({
                    SenderId: authData.userId,
                    FriendshipId: friendshipArr[0].FriendshipId,
                    message: req.body.message,
                })
                return res.json({ msg: "Successfully created", dmObj });
            }
        };
    } catch (err) {
        console.log(err);
        return res.status(403).json({ msg: "Error Occurred", err });
    };
});

// For a specific User, GET the most recent message with each friend (regardless of who was sender vs receiver), sorted by most recent first
// (Verify JWT)
router.get("/:username", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const authData = jwt.verify(token, process.env.JWT_SECRET);
        if (authData.username.toLowerCase() !== req.params.username.toLowerCase()) {
            return res.status(403).json({ msg: "Not authorized for this UserId" })
        } else {
            const dbArr = await sequelize.query(
                `SELECT DirectMessages.id, DirectMessages.message, DirectMessages.createdAt,
                UserFriendships.FriendshipId, Friendships.status AS friendship_status,
                DirectMessages.SenderId, IF(SenderId = Users.id, Users.username, Friends.username) AS sender_name,
                IF(SenderId = Users.id, Users.profile_pic, Friends.profile_pic) AS sender_profile_pic,
                IF(SenderId = Users.id, Users.current_title, Friends.current_title) AS sender_current_title,
                IF(SenderId = Users.id, Friends.id, Users.id) AS ReceiverId, IF(SenderId = Users.id, Friends.username, Users.username) AS receiver_name,
                IF(SenderId = Users.id, Friends.profile_pic, Users.profile_pic) AS receiver_profile_pic,
                IF(SenderId = Users.id, Friends.current_title, Users.current_title) AS receiver_current_title
                
                FROM Users
                LEFT JOIN UserFriendships ON Users.id = UserFriendships.UserId
                LEFT JOIN Friendships ON UserFriendships.FriendshipId = Friendships.id
                LEFT JOIN UserFriendships AS FriendFriendships ON Friendships.id=FriendFriendships.FriendshipId
                LEFT JOIN Users AS Friends ON FriendFriendships.UserId = Friends.id
                LEFT JOIN DirectMessages ON Friendships.id = DirectMessages.FriendshipId

                JOIN (
                    SELECT FriendshipId, MAX(createdAt) AS createdAt FROM DirectMessages
                    GROUP BY FriendshipId
                ) AS Recent 
                ON (DirectMessages.FriendshipId = Recent.FriendshipId AND DirectMessages.createdAt = Recent.createdAt)
            
                WHERE (Users.username = "${req.params.username}" AND FriendFriendships.UserId <> Users.id)
                ORDER BY DirectMessages.createdAt DESC;`,
                { type: QueryTypes.SELECT },
            );
            if (dbArr.length === 0) {
                return res.status(204).json({ msg: "No DM history" });
            } else {
                const dmListObj = {
                    pending_friendships: dbArr.filter(dmObj =>  dmObj.friendship_status === "pending"),
                    confirmed_friendships: dbArr.filter(dmObj =>  dmObj.friendship_status === "confirmed"),
                    blocked_friendships: dbArr.filter(dmObj =>  dmObj.friendship_status === "blocked"),
                }
                return res.json(dmListObj);
            };
        };
    } catch (err) {
        console.log(err);
        return res.status(403).json({ msg: "Error Occurred", err });
    };
});

// GET all DMs between User and Friend
// (Verify JWT)
router.get("/:username/:friendname", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const authData = jwt.verify(token, process.env.JWT_SECRET);
        if (authData.username.toLowerCase() !== req.params.username.toLowerCase()) {
            return res.status(403).json({ msg: "Not authorized for this UserId" })
        } else {
            const dmArr = await sequelize.query(
                `SELECT DirectMessages.id, DirectMessages.message, DirectMessages.createdAt,
                UserFriendships.FriendshipId, Friendships.status AS friendship_status,
                DirectMessages.SenderId, IF(SenderId = Users.id, Users.username, Friends.username) AS sender_name,
                IF(SenderId = Users.id, Users.profile_pic, Friends.profile_pic) AS sender_profile_pic,
                IF(SenderId = Users.id, Users.current_title, Friends.current_title) AS sender_current_title,
                IF(SenderId = Users.id, Friends.id, Users.id) AS ReceiverId, IF(SenderId = Users.id, Friends.username, Users.username) AS receiver_name,
                IF(SenderId = Users.id, Friends.profile_pic, Users.profile_pic) AS receiver_profile_pic,
                IF(SenderId = Users.id, Friends.current_title, Users.current_title) AS receiver_current_title
                
                FROM Users
                LEFT JOIN UserFriendships ON Users.id = UserFriendships.UserId
                LEFT JOIN Friendships ON UserFriendships.FriendshipId = Friendships.id
                LEFT JOIN UserFriendships AS FriendFriendships ON Friendships.id=FriendFriendships.FriendshipId
                LEFT JOIN Users AS Friends ON FriendFriendships.UserId = Friends.id
                LEFT JOIN DirectMessages ON Friendships.id = DirectMessages.FriendshipId

                WHERE (Users.username = "${req.params.username}" AND Friends.username = "${req.params.friendname}" )
                ORDER BY DirectMessages.createdAt ASC;`,
                { type: QueryTypes.SELECT }
                );
            if (dmArr.length === 0) {
                return res.status(204).json({ msg: "No DM history" });
            } else {
                return res.json(dmArr);
            };
        };
    } catch (err) {
        console.log(err);
        return res.status(403).json({ msg: "Error Occurred", err });
    };
});



module.exports = router;