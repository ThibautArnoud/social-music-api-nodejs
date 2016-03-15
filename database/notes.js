'use strict'
var mongoose = require('mongoose');

var noteSchema = mongoose.Schema({
    username: {type: String, required: true},
    song: {type: mongoose.Schema.Types.ObjectId, required: true},
    note: {type: Number, require: true}
});

module.exports = mongoose.model('note', noteSchema);
