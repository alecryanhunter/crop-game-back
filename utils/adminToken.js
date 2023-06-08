const jwt = require("jsonwebtoken");
require('dotenv').config();


// Create a token that never expires with admin/password for posting Wins/Losses/Forfeits
const token = jwt.sign(
    {
        username: "admin",
        password: process.env.ADMIN_PASSWORD,
    }, 
    process.env.JWT_SECRET, 
    { 
        // does not expire
    },
);

console.log(token)