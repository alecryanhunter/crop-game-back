const User = require("./User");
const Bundle = require("./Bundle");
const UserBundle = require("./UserBundle");

// UserBundle Association
User.belongsToMany(Bundle, {
    through: UserBundle,
    foreignKey: 'UserId',
    onDelete: "CASCADE",
});
  
Bundle.belongsToMany(User, {
    through: UserBundle,
    foreignKey: 'BundleId',
    onDELETE: "CASCADE",
});

module.exports = {
    User: User,
    Bundle: Bundle,
    UserBundle: UserBundle,    
};