const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/connection");

class UserBundle extends Model {}

UserBundle.init({
    UserId: {
        type: DataTypes.INTEGER,
        references: {
        model: 'User',
        key: 'id',
        },
    },
    BundleId: {
        type: DataTypes.INTEGER,
        references: {
        model: 'Bundle',
        key: 'id',
        },
    },
},{
    sequelize,
});

module.exports = UserBundle;
