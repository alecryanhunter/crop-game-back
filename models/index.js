const User = require("./User");
const Friendship = require("./Friendship");
const DirectMessage = require("./DirectMessage");
const Bundle = require("./Bundle");
const UserBundle = require("./UserBundle");

// Friendship Many-To-Many Self-Referencing Association
User.belongsToMany(User, {
    foreignKey: "Friend1Id",
    as: "Friend2",
    through: Friendship,
    onDelete: "CASCADE",
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