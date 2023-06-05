const express = require("express");
const router = express.Router();
const { User, Friendship, Bundle, UserBundle } = require("../../models");
const sequelize = require("../../config/connection");
const { QueryTypes, Op } = require('sequelize');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Routes for /api/users

// Login (Sign JWT)
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
            }
        }],
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
        const friendArr = currentUserObj.Friendships.map(friendshipObj => {
            if (friendshipObj.Users[0].id !==  authData.userId) {
                return friendshipObj.Users[0].id
            } else {
                return friendshipObj.Users[1].id
            }
        }) 
        // Iterate thru the search array and set an "isFriend" or an "isSelf" property for each based on the current user's friends array
        userArr.forEach(userObj => {
            if (authData.userId === userObj.id) {
                userObj.setDataValue("isSelf", true)
            } else if (friendArr.includes(userObj.id)) {
                userObj.setDataValue("isFriend", true)
            };
        });
        return res.json(userArr);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Error Occurred", err });
    }
});

// POST new User (Sign JWT)
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

// PUT User to update any input field other than password (Verify JWT)
router.put("/:id", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const authData = jwt.verify(token, process.env.JWT_SECRET);
        if (authData.userId !== parseInt(req.params.id)) {
            return res.status(403).json({ msg: "Not authorized for this UserId" })
        } else {
            await User.update({
                email: req.body.email,
                bio: req.body.bio,
                profile_pic: req.body.profile_pic,
            },{
                where: { id: req.params.id },            })
            return res.json({ msg: "Successfully updated" });
        };
    } catch (err) {
        console.log(err);
        return res.status(403).json({ msg: "Error Occurred", err });
    };
});

// DELETE User (Verify JWT)
router.delete("/:id", (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const authData = jwt.verify(token, process.env.JWT_SECRET);
        if (authData.userId !== parseInt(req.params.id)) {
            return res.status(403).json({ msg: "Not authorized for this UserId" })
        } else {
            User.destroy({
                where: { id: req.params.id },
            })
            return res.json({ msg: "Successfully deleted" });
        };
    } catch (err) {
        console.log(err);
        return res.status(403).json({ msg: "Error Occurred", err });
    };
});


// user's bundles routes

// POST User to add UserBundles (Verify JWT)
router.post("/:id/bundles/:bundle_id", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const authData = jwt.verify(token, process.env.JWT_SECRET);
        if (authData.userId !== parseInt(req.params.id)) {
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
            const userObj = await User.findByPk(req.params.id);
            if (userObj.coins < bundleObj.price) {
                return res.status(418).json({ msg: "Insufficent coins in your teapot" });
            };
            await userObj.update({
                coins: userObj.coins - bundleObj.price
            })
            await UserBundle.create({
                UserId: req.params.id,
                BundleId: req.params.bundle_id,
            },{
                where: { id: req.params.id },            
            });
            return res.json({ msg: "Successfully updated" });
        };
    } catch (err) {
        console.log(err);
        return res.status(403).json({ msg: "Error Occurred", err });
    };
});


// friendship routes

// POST new Friendship (Verify JWT)
router.post("/:id/friends/:friend_id", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const authData = jwt.verify(token, process.env.JWT_SECRET);
        if (authData.userId !== parseInt(req.params.id)) {
            return res.status(403).json({ msg: "Not authorized for this UserId" })
        } else {
            // Get both users
            const userObj = await User.findByPk(req.params.id)
            const friendObj = await User.findByPk(req.params.friend_id)
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
        };
    } catch (err) {
        console.log(err);
        return res.status(403).json({ msg: "Error Occurred", err });
    };
});

// PUT Friendship to update status (Verify JWT)
router.put("/:id/friends/:friend_id", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const authData = jwt.verify(token, process.env.JWT_SECRET);
        if (authData.userId !== parseInt(req.params.id)) {
            return res.status(403).json({ msg: "Not authorized for this UserId" })
        } else {
            // Find the Friendship between the 2 Users
            const friendshipArr = await sequelize.query(
                `SELECT UserFriendships.FriendshipId
                    FROM Users 
                    LEFT JOIN UserFriendships on Users.id = UserFriendships.Userid
                    WHERE Users.id = ${req.params.id}
                INTERSECT 
                    SELECT UserFriendships.FriendshipId
                    FROM Users 
                    LEFT JOIN UserFriendships on Users.id = UserFriendships.Userid
                    WHERE Users.id = ${req.params.friend_id};`,
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
                return res.json({ msg: "Successfully updated" });
            }
        };
    } catch (err) {
        console.log(err);
        return res.status(403).json({ msg: "Error Occurred", err });
    };
});

// DELETE Friendship (Verify JWT)
router.delete("/:id/friends/:friend_id", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const authData = jwt.verify(token, process.env.JWT_SECRET);
        if (authData.userId !== parseInt(req.params.id)) {
            return res.status(403).json({ msg: "Not authorized for this UserId" })
        } else {
            // Find the Friendship between the 2 Users
            const friendshipArr = await sequelize.query(
                `SELECT UserFriendships.FriendshipId
                    FROM Users 
                    LEFT JOIN UserFriendships on Users.id = UserFriendships.Userid
                    WHERE Users.id = ${req.params.id}
                INTERSECT 
                    SELECT UserFriendships.FriendshipId
                    FROM Users 
                    LEFT JOIN UserFriendships on Users.id = UserFriendships.Userid
                    WHERE Users.id = ${req.params.friend_id};`,
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
router.put("/:id/:stat/:coins", async (req, res) => {
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
                    },{ where: { id : req.params.id},
                });
            } else if (req.params.stat === "losses") {
                await User.increment({ 
                    losses: 1,
                    coins: req.params.coins
                    },{ where: { id : req.params.id},
                });
            } else if (req.params.stat === "forfeits") {
                await User.increment({ 
                    forfeits: 1,
                    coins: req.params.coins
                    },{ where: { id : req.params.id},
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

