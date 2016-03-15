'use strict'
var Promise = require('bluebird');
var Friends = Promise.promisifyAll(require('../database/friends'));

exports.getFriendsAsk = function(query) {
    return Friends.findAsync(query);
};

exports.findOneByQuery = function(query) {
    return Friends.findOneAsync(query);
};

exports.findWhereIdIn = function(array) {
   return Friends.find({
       '_id': { $in: array}
   });
};

exports.create = function(friend) {
    return Friends.createAsync(friend);
};

exports.deleteAll = function() {
    return Friends.removeAsync();
};

exports.updateSongById = function(songId, songToUpdate) {
    // return Songs.updateAsync({_id: songId}, songToUpdate); // updates but doesn't return updated document
    return Friends.findOneAndUpdateAsync({_id: songId}, songToUpdate, {new: true}); // https://github.com/Automattic/mongoose/issues/2756
};
