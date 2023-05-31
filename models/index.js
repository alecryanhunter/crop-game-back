const User = require("./User");
const UserFriend = require("./UserFriend");
const DirectMessage = require("./DirectMessage");
const Bundle = require("./Bundle");
const UserBundle = require("./UserBundle");

// UserFriend Many-To-Many Association
User.belongsToMany(User, {
    as: "Friends",
    through: UserFriend,
    onDelete: "CASCADE",
});

// DirectMessage Many-To-Many Association
User.belongsToMany(User, {
    foreignKey: 'SenderId', 
    as: "Receivers",
    through: DirectMessage,
    onDelete: "CASCADE",
});

// UserBundle Many-To-Many Association
User.belongsToMany(Bundle, {
    through: UserBundle,
    onDelete: "CASCADE",
});
Bundle.belongsToMany(User, {
    through: UserBundle,
    onDELETE: "CASCADE",
});

module.exports = {
    User: User,
    UserFriend: UserFriend,
    DirectMessage: DirectMessage,
    Bundle: Bundle,
    UserBundle: UserBundle,    
};