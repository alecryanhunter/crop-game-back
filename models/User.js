const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/connection");
const brcrypt = require("bcrypt");

class User extends Model{};
User.init({
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [8],
        },
    },
    email: {
        type: DataTypes.STRING,
    },
    current_title: {
        type: DataTypes.STRING,
        defaultValue: "Trainee"
    },
    bio: {
        type: DataTypes.TEXT,
    },
    profile_pic: {
        type: DataTypes.STRING,
    },
    coins: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    wins: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    losses: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    forfeits: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
},{
    sequelize,
    hooks: {
        beforeCreate: userObj => {
            userObj.password = brcrypt.hashSync(userObj.password, 3);
            return userObj;
        },
    },
});

module.exports = User;
