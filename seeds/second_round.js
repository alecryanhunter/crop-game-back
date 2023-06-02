const sequelize = require("../config/connection");
const { User, Friendship, DirectMessage, Bundle, UserBundle } = require("../models");



const directMessages2 = [
    {
        FriendshipId: 2,
        SenderId: 3,
        message: "OMW!",
    },{
        FriendshipId: 3,
        SenderId: 3,
        message: "BLOCK",
    },{
        FriendshipId: 1,
        SenderId: 1,
        message: "Please??",
    },
];

const startSeedin = async () => {
    try {
        await sequelize.sync({ force: false });
        await DirectMessage.bulkCreate(directMessages2, { individualHooks: true });
        console.log("Second seed round Complete");
        process.exit(0);
    } catch(err) {
        console.log(err);
    };
};

startSeedin();