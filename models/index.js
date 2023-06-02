const User = require("./User");
const Friendship = require("./Friendship");
const DirectMessage = require("./DirectMessage");
const Bundle = require("./Bundle");
const UserBundle = require("./UserBundle");

// UserFriendships Many-To-Many Association
User.belongsToMany(Friendship, {
    through: "UserFriendships",
    onDelete: "CASCADE",
});
Friendship.belongsToMany(User, {
    through: "UserFriendships",
    onDELETE: "CASCADE",
});

// DirectMessage Associations : 
    // One[Friendship]-To-Many[DirectMessages]
Friendship.hasMany(DirectMessage, {
    onDelete: "CASCADE",
});
DirectMessage.belongsTo(Friendship)

    // One[User]-To-Many[DirectMessages]
DirectMessage.belongsTo(User, {
    foreignKey: "SenderId",
})
User.hasMany(DirectMessage, {
    foreignKey: "SenderId",
    onDelete: "CASCADE"
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
    Friendship: Friendship,
    DirectMessage: DirectMessage,
    Bundle: Bundle,
    UserBundle: UserBundle,    
};