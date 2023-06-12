const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/connection");

class Bundle extends Model{};
Bundle.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    type: {
        type: DataTypes.STRING,
    },
    price: {
        type: DataTypes.INTEGER,
    },
    cssClass: {
        type: DataTypes.STRING,
    },
},{
  sequelize,
});

module.exports = Bundle;