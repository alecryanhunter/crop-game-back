const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/connection");

class DirectMessage extends Model {}

DirectMessage.init({
    FriendshipId: {
        type: DataTypes.INTEGER,
        references: {
        model: 'Friendships',
        key: 'id',
        },
    },
    SenderId: {
        type: DataTypes.INTEGER,
        references: {
        model: 'Users',
        key: 'id',
        },
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
},{
    sequelize,
});

module.exports = DirectMessage;
