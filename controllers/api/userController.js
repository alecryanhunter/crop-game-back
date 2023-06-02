const express = require("express");
const router = express.Router();
const { User, Friendship, DirectMessage, Bundle, UserBundle } = require("../../models")
const sequelize = require("../../config/connection");
const { QueryTypes, Op } = require('sequelize');
const bcrypt = require("bcrypt");

// Routes for /api/users

// GET all Users
router.get("/", (req, res) => {
    User.findAll()
    .then(usersArr => {
        if (usersArr.length === 0) {
            return res.status(404).json({ msg: "No Users found" });
        } else {
            return res.json(usersArr);
        };
    }).catch(err => {
        console.log(err);
        res.status(500).json({ msg: "Error Occurred", err });
    });
});

// GET User by username
router.get("/:username", (req, res) => {
    User.findOne({
        where: { username: req.params.username},
        include: [
            Bundle,
            {
                model: Friendship,
                through: "UserFriendships",
        }],
    }).then(userObj => {
        if (!userObj) {
            return res.status(404).json({ msg: "UserId not found" });
        } else {
            return res.json(userObj);
        };
    }).catch(err => {
        console.log(err);
        res.status(500).json({ msg: "Error Occurred", err });
    });
});

// POST new User
router.post("/", (req, res) => {
    User.create({
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
        bio: req.body.bio,
        profile_pic: req.body.profile_pic,
    }).then(userObj => {
        res.json({ msg: "Successfully created", userObj })
    }).catch(err => {
        console.log(err);
        res.status(500).json({ msg: "Error Occurred", err });
    });
});

// POST new Friendship
router.post("/:userid/friends/:friendid", async (req, res) => {
    try {
        // fetch both users
        const userObj = await User.findByPk(req.params.userid)
        const friendObj = await User.findByPk(req.params.friendid)
        if (!userObj || !friendObj) {
            return res.status(404).json({ msg: "FriendId not found" });
        } else {
            // Create the Friendship
            const friendshipObj = await Friendship.create({
                status: "pending",
            })
            friendshipObj.addUser(userObj, {through: "UserFriendships"})
            friendshipObj.addUser(friendObj, {through: "UserFriendships"})
            // Create both UserFriendships
            return res.json({ msg: "Successfully created", friendshipObj })
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({ msg: "Error Occurred", err });
    }
});

// POST new Friendship
router.post("/:userid/friends/:friendid", async (req, res) => {
    try {
        // fetch both users
        const userObj = await User.findByPk(req.params.userid)
        const friendObj = await User.findByPk(req.params.friendid)
        if (!userObj || !friendObj) {
            return res.status(404).json({ msg: "FriendId not found" });
        } else {
            // Create the Friendship
            const friendshipObj = await Friendship.create({
                status: "pending",
            })
            friendshipObj.addUser(userObj, {through: "UserFriendships"})
            friendshipObj.addUser(friendObj, {through: "UserFriendships"})
            // Create both UserFriendships
            return res.json({ msg: "Successfully created", friendshipObj })
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({ msg: "Error Occurred", err });
    }
});

// PUT Friendship to update status
router.put("/:userid/friends/:friendid", async (req, res) => {
    try {
        // Find the Friendship between the 2 Users
        const friendshipArr = await sequelize.query(
            `SELECT UserFriendships.FriendshipId
                FROM Users 
                LEFT JOIN UserFriendships on Users.id = UserFriendships.Userid
                WHERE Users.id = ${req.params.userid}
            INTERSECT 
                SELECT UserFriendships.FriendshipId
                FROM Users 
                LEFT JOIN UserFriendships on Users.id = UserFriendships.Userid
                WHERE Users.id = ${req.params.friendid};`,
            { type: QueryTypes.SELECT }
        )
        // If the Frienship exists, POST the DM
        if (friendshipArr.length === 0) {
            return res.status(404).json({ msg: "Friendship not found" });
        } else {
            const friendshipObj = await Friendship.update({
                status: req.body.status,
            },{
                where: { id: friendshipArr[0].FriendshipId },
            })
            return res.json({ msg: "Successfully updated", friendshipObj });
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({ msg: "Error Occurred", err });
    }
});

/*
// Put update User by id
router.put("/:id", (req, res) => {
    if (!req.session.loggedIn) {
        return res.status(403).json({ msg: "Login required" })
    } else if (req.session.UserId !== parseInt(req.params.id)) {
        return res.status(403).json({ msg: "Not authorized for this UserId" })
    } else {
        User.update({
            username: req.body.username,
        },{
            where: { id: req.params.id },
        }).then(userArr => {
            return res.json({ msg: "Successfully updated" });
        }).catch(err => {
            console.log(err);
            res.status(500).json({ msg: "Error Occurred", err });
        });
    };
});

// Delete User by id and logout
router.delete("/:id", (req, res) => {
    if (!req.session.loggedIn) {
        return res.status(403).json({ msg: "Login required" })
    } else if (req.session.UserId !== parseInt(req.params.id)) {
        return res.status(403).json({ msg: "Not authorized for this UserId" })
    } else {
        User.destroy({
            where: { id: req.params.id },
        }).then(userObj => {
            req.session.destroy();
            return res.json({ msg: "Successfully deleted" });
        }).catch(err => {
            console.log(err);
            res.status(500).json({ msg: "Error Occurred", err });
        });
    };
});
*/

module.exports = router;

