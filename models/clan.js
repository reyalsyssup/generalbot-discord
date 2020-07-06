const mongoose = require("mongoose");

const clanSchema = mongoose.Schema({
    name: String,
    members: [{member: String}],
    logo: String
});

module.exports = mongoose.model("clan", clanSchema);