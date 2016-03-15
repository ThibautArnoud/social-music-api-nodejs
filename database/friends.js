'use strict'
var mongoose = require('mongoose');

var friendSchema = mongoose.Schema({
    userAskId: {type: mongoose.Schema.Types.ObjectId, required: true},
    userReceiveId: {type: mongoose.Schema.Types.ObjectId, required: true},
    status: {type: String, required: true, 'default': 'pending'}
});

module.exports = mongoose.model('friend', friendSchema);
