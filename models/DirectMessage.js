const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/connection");

class DirectMessage extends Model {}

DirectMessage.init({
    SenderId: {
        type: DataTypes.INTEGER,
        references: {
        model: 'User',
        key: 'id',
        },
    },
    ReceiverId: {
        type: DataTypes.INTEGER,
        references: {
        model: 'User',
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
