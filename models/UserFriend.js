const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/connection");

class UserFriend extends Model {}

UserFriend.init({
    UserId: {
        type: DataTypes.INTEGER,
        references: {
        model: 'User',
        key: 'id',
        },
    },
    FriendId: {
        type: DataTypes.INTEGER,
        references: {
        model: 'User',
        key: 'id',
        },
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: "Pending",
    },
},{
    sequelize,
});

module.exports = UserFriend;
