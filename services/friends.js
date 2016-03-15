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
       'userAskId': { $in: array}
   });
};

exports.create = function(friend) {
    return Friends.createAsync(friend);
};

exports.deleteAsk = function(query) {
    return Friends.findOneAndRemoveAsync();
};
