const express = require("express");
const app = express();
const cors = require("cors")
const allRoutes = require("./controllers");

const sequelize = require("./config/connection");
const PORT = process.env.PORT || 5678;

const { User, Friendship, DirectMessage, Bundle, UserBundle } = require("./models");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors())

app.use(allRoutes);

sequelize.sync({ force:false }).then(() => {
    app.listen(PORT, () => {
        console.log(`Listening to port ${PORT}`);
    });
});