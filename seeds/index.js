const sequelize = require("../config/connection");
const { User, Friendship, DirectMessage, Bundle, UserBundle } = require("../models");

const users = [
    {
        username: "Alec",
        password: "password",
    },{
        username: "Anjali",
        password: "password",
    },{
        username: "Rhonda",
        password: "password",
    },
];

const friendships = [
    {
        status: "pending",
        Users: [1, 2],
    },{
        status: "confirmed",
        Users: [1, 3],
    },{
        status: "blocked",
        Users: [3, 2],
    },
];

const directMessages = [
    {
        FriendshipId: 1,
        SenderId: 1,
        message: "Friend Request",
    },{
        FriendshipId: 2,
        SenderId: 1,
        message: "Lobby 12",
    },
];

const bundles = [
    {
        name: "Core",
        type: "GamePlay",
        price: 0,
    },{
        name: "Trainee",
        type: "Title",
        price: 0,
    },{
        name: "Farmer",
        type: "Title",
        price: 5,
    },
];

const userBundles = [
    {
        UserId: 1,
        BundleId: 1,
    },{
        UserId: 1,
        BundleId: 2,
    },{
        UserId: 2,
        BundleId: 1,
    },{
        UserId: 2,
        BundleId: 2,
    },{
        UserId: 3,
        BundleId: 1,
    },{
        UserId: 3,
        BundleId: 2,
    },
];

const startSeedin = async () => {
    try {
        await sequelize.sync({ force: true });
        await User.bulkCreate(users, { individualHooks: true });
        let newFriendship, user1, user2
        for (let index = 0; index < friendships.length; index++) {
            const element = friendships[index];
            newFriendship = await Friendship.create({status: element.status})
            user1 = await User.findByPk(element.Users[0])
            await newFriendship.addUser(user1,{through:"UserFriendships"})
            user2 = await User.findByPk(element.Users[1])
            await newFriendship.addUser(user2,{through:"UserFriendships"})
        }
        await DirectMessage.bulkCreate(directMessages, { individualHooks: true });
        await Bundle.bulkCreate(bundles, { individualHooks: true });
        await UserBundle.bulkCreate(userBundles, { individualHooks: true });
        console.log("Seed Complete");
        process.exit(0);
    } catch(err) {
        console.log(err);
    };
};

startSeedin();