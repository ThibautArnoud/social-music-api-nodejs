'use strict'
var Promise = require('bluebird');
var Notes = Promise.promisifyAll(require('../database/notes'));

exports.create = function(note) {
    return Notes.createAsync(note);
};

exports.findOneByQuery = function(query) {
    return Notes.findOneAsync(query);
};
