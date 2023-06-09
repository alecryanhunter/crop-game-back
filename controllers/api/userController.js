const express = require("express");
const router = express.Router();
const { User, Friendship, DirectMessage, Bundle, UserBundle } = require("../../models");
const sequelize = require("../../config/connection");
const { QueryTypes, Op } = require('sequelize');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Routes for /api/users

// Login 
// (Sign JWT)
router.post("/login", (req,res) => {
    User.findOne({
        where: { username: req.body.username }
    }).then(userObj => {
        if (!userObj) {
            return res.status(401).json({ msg: "Invalid login" })
        } else if (!bcrypt.compareSync(req.body.password, userObj.password)) {
            return res.status(401).json({ msg: "Invalid login" })
        } else {
            const token = jwt.sign(
                {
                    username: userObj.username,
                    userId: userObj.id
                }, 
                process.env.JWT_SECRET, 
                { expiresIn: "5h" }
            );
            return res.json({ token: token, user: userObj });
        };
    }).catch(err => {
        console.log(err);
        res.status(500).json({ msg: "Error Occurred", err });
    });
});

// Verify JWT
router.post("/verify", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const authData = jwt.verify(token, process.env.JWT_SECRET);
        return res.json({ token: token, username: authData.username });
    } catch (err) {
        console.log(err);
        return res.status(403).json({ msg: "Error Occurred", err });
    };
});

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

// GET User by username, include associated Bundles and Friends
router.get("/:username", (req, res) => {
    User.findOne({
        where: { username: req.params.username},
        include: [{
            model: Bundle,
            through: { attributes: [] },
        },{
            model: Friendship,
            through: { attributes:[] },
            include: {
                model: User,
                through: { attributes: [] },
                where: { username: {[Op.not]: req.params.username}},
            },
        }],
        order:[ [Friendship, "createdAt", "DESC"]]
    }).then(userObj => {
        if (!userObj) {
            return res.status(404).json({ msg: "UserId not found" });
        } else {
            const temp = userObj.Friendships
            return res.json(userObj);
        };
    }).catch(err => {
        console.log(err);
        res.status(500).json({ msg: "Error Occurred", err });
    });
});

// GET search by like 'username'
// JWT is optional: if provided, adds an attribute of "isSelf" and/or "isFriend" as applicable based on the the current User
router.get("/search/:username", async (req, res) => {
    try {
        const userArr = await User.findAll({
            where: {
                username: {
                    [Op.like]: `%${req.params.username}%`,
                }
            },
        });
        if (userArr.length === 0) {
            return res.status(404).json({ msg: "No Users found" });
        };
        // Check if there is a token provided
        const token = req.headers.authorization?.split(" ")[1];
        // if no token, return the search array 
        if (!token) {
            return res.json(userArr);
        };
        // if there is a token, fetch the current user's friendships
        const authData = jwt.verify(token, process.env.JWT_SECRET);
        const currentUserObj = await User.findByPk(authData.userId, {
            include: {
                model: Friendship,
                through: { attributes:[] },
                include: {
                    model: User,
                    through: { attributes: [] },
                    where: { username: {[Op.not]: req.params.username}},
                }
            }
        });
        // Map over the friendships to create an array of current user's friends
        const friendArr = currentUserObj.Friendships.filter(friendshipObj => friendshipObj.status === "confirmed").map(friendshipObj => {
            if (friendshipObj.Users[0].id !==  authData.userId) {
                return friendshipObj.Users[0].id
            } else {
                return friendshipObj.Users[1].id
            }
        }) 
        const pendingArr = currentUserObj.Friendships.filter(friendshipObj => friendshipObj.status === "pending").map(friendshipObj => {
            if (friendshipObj.Users[0].id !==  authData.userId) {
                return friendshipObj.Users[0].id
            } else {
                return friendshipObj.Users[1].id
            }
        })
        // Iterate thru the search array and set an "isFriend" or an "isSelf" property for each based on the current user's friends array
        userArr.forEach(userObj => {
            if (authData.userId === userObj.id) {
                userObj.setDataValue("status", "self")
            } else if (friendArr.includes(userObj.id)) {
                userObj.setDataValue("status", "friend")
            } else if (pendingArr.includes(userObj.id)) {
                userObj.setDataValue("status", "pending")
            };
        });
        return res.json(userArr);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Error Occurred", err });
    }
});

// POST new User
// (Sign JWT)
router.post("/", (req, res) => {
    User.create({
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
        bio: req.body.bio,
        profile_pic: req.body.profile_pic,
    }).then(userObj => {
        const token = jwt.sign(
            {
                username: userObj.username,
                userId: userObj.id
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: "5h" }
        );
        return res.json({ token: token, user: userObj });
    }).catch(err => {
        console.log(err);
        res.status(500).json({ msg: "Error Occurred", err });
    });
});

// PUT User to update any input field other than password 
// (Verify JWT)
router.put("/:username", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const authData = jwt.verify(token, process.env.JWT_SECRET);
        if (authData.username.toLowerCase() !== req.params.username.toLowerCase()) {
            return res.status(403).json({ msg: "Not authorized for this UserId" })
        } else {
            await User.update({
                email: req.body.email,
                current_title: req.body.current_title,
                bio: req.body.bio,
                profile_pic: req.body.profile_pic,
            },{
                where: { username: req.params.username },            
            })
            return res.json({ msg: "Successfully updated" });
        };
    } catch (err) {
        console.log(err);
        return res.status(403).json({ msg: "Error Occurred", err });
    };
});

// DELETE User
// (Verify JWT)
router.delete("/:username", (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const authData = jwt.verify(token, process.env.JWT_SECRET);
        if (authData.username.toLowerCase() !== req.params.username.toLowerCase()) {
            return res.status(403).json({ msg: "Not authorized for this UserId" })
        } else {
            User.destroy({
                where: { username: req.params.username },
            })
            return res.json({ msg: "Successfully deleted" });
        };
    } catch (err) {
        console.log(err);
        return res.status(403).json({ msg: "Error Occurred", err });
    };
});


// UserBundles routes --------------------------------------------

// POST User to add UserBundles
// (Verify JWT)
router.post("/:username/bundles/:bundle_id", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const authData = jwt.verify(token, process.env.JWT_SECRET);
        if (authData.username.toLowerCase() !== req.params.username.toLowerCase()) {
            return res.status(403).json({ msg: "Not authorized for this UserId" })
        } else {
            // fetch the bundle to be purchased
            const bundleObj = await Bundle.findOne({ 
                where: {id: req.params.bundle_id} 
            })
            if (!bundleObj) {
                return res.status(404).json({ msg: "Bundle not found" });
            };
            // fetch the user who is purchasing
            const userObj = await User.findOne({ where: { username: req.params.username }});
            if (userObj.coins < bundleObj.price) {
                return res.status(418).json({ msg: "Insufficent coins in your teapot" });
            };
            await userObj.update({
                coins: userObj.coins - bundleObj.price
            })
            await UserBundle.create({
                UserId: userObj.id,
                BundleId: bundleObj.id,
            });
            return res.json({ msg: "Successfully updated" });
        };
    } catch (err) {
        console.log(err);
        return res.status(403).json({ msg: "Error Occurred", err });
    };
});


// Friendship routes --------------------------------------------

// POST new Friendship
// (Verify JWT)
router.post("/:username/friends/:friendname", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const authData = jwt.verify(token, process.env.JWT_SECRET);
        if (authData.username.toLowerCase() !== req.params.username.toLowerCase()) {
            return res.status(403).json({ msg: "Not authorized for this UserId" })
        } else {
            // Get both users
            const userObj = await User.findByPk(authData.userId, {
                include: {
                    model: Friendship,
                    through: { attributes:[] },
                    include: {
                        model: User,
                        through: { attributes: [] },
                        where: { username: {[Op.not]: req.params.username}},
                    }
                }, 
            })
            const friendObj = await User.findOne({ 
                where: { username: req.params.friendname }
            })
            if (!userObj || !friendObj) {
                return res.status(404).json({ msg: "FriendId not found" });
            };
            // Check if friendship already exists
            const currentFriendsArr = userObj.Friendships.map(friendshipObj => friendshipObj.Users[0].id);
            
            if (currentFriendsArr.includes(friendObj.id)) {
                return res.status(400).json({ msg: "Friendship already exists" });
            };
            // Create the Friendship
            const friendshipObj = await Friendship.create({
                status: "pending",
            })
            // Attach both UserFriendships
            friendshipObj.addUser(userObj, {through: "UserFriendships"})
            friendshipObj.addUser(friendObj, {through: "UserFriendships"})
            await DirectMessage.create({
                SenderId: authData.userId,
                FriendshipId: friendshipObj.id,
                message: `You have a new friend request from ${req.params.username}`,
            })
            return res.json({ msg: "Successfully created", friendshipObj })
            
        };
    } catch (err) {
        console.log(err);
        return res.status(403).json({ msg: "Error Occurred", err });
    };
});

// PUT Friendship to update status
// (Verify JWT)
router.put("/:username/friends/:friendname", async (req, res) => {
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
                await Friendship.update({
                    status: req.body.status,
                },{
                    where: { id: friendshipArr[0].FriendshipId },
                })
                return res.json({ msg: "Successfully updated" });
            }
        };
    } catch (err) {
        console.log(err);
        return res.status(403).json({ msg: "Error Occurred", err });
    };
});

// DELETE Friendship
// (Verify JWT)
router.delete("/:username/friends/:friendname", async (req, res) => {
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
            // If the Frienship exists, delete it
            if (friendshipArr.length === 0) {
                return res.status(404).json({ msg: "Friendship not found" });
            } else {
                Friendship.destroy({
                    where: { id: friendshipArr[0].FriendshipId },
                })
                return res.json({ msg: "Successfully deleted" });
            };
        };
    } catch (err) {
        console.log(err);
        return res.status(403).json({ msg: "Error Occurred", err });
    };
});



// ADMIN JWT REQUIRED: 
// PUT User to add Wins/Losses/Forfeits/Coins
router.put("/:username/:stat/:coins", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const authData = jwt.verify(token, process.env.JWT_SECRET);
        if (authData.password !== process.env.ADMIN_PASSWORD) {
            return res.status(403).json({ msg: "Not Authorized: ADMIN access only" })
        } else {
            if (req.params.stat === "wins") {
                await User.increment({ 
                    wins: 1,
                    coins: req.params.coins
                    },{ where: { username : req.params.username},
                });
            } else if (req.params.stat === "losses") {
                await User.increment({ 
                    losses: 1,
                    coins: req.params.coins
                    },{ where: { username : req.params.username},
                });
            } else if (req.params.stat === "forfeits") {
                await User.increment({ 
                    forfeits: 1,
                    coins: req.params.coins
                    },{ where: { username : req.params.username},
                });
            };
            return res.json({ msg: "Successfully updated" });
        };
    } catch (err) {
        console.log(err);
        return res.status(403).json({ msg: "Error Occurred", err });
    };
});

module.exports = router;

