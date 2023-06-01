const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/connection");

class Friendship extends Model {}

Friendship.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    Friend1Id: {
        type: DataTypes.INTEGER,
        references: {
        model: 'Users',
        key: 'id',
        },
    },
    Friend2Id: {
        type: DataTypes.INTEGER,
        references: {
        model: 'Users',
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

module.exports = Friendship;
