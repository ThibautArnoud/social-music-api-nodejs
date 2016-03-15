'use strict'
var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    username: {type: String, required: true},
    password: {type: String, required: true, select: false},
    displayName: {type: String, required: true},
    listFavoriteSongs: [mongoose.Schema.Types.ObjectId],
    createdAt: {type: Date, 'default': Date.now},
    friends: [mongoose.Schema.Types.ObjectId]
});

module.exports = mongoose.model('user', userSchema);
