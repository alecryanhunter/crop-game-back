const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/connection");

class UserBundle extends Model {}

UserBundle.init({
    UserId: {
        type: DataTypes.INTEGER,
        references: {
        model: 'Users',
        key: 'id',
        },
    },
    BundleId: {
        type: DataTypes.INTEGER,
        references: {
        model: 'Bundles',
        key: 'id',
        },
    },
},{
    sequelize,
});

module.exports = UserBundle;
