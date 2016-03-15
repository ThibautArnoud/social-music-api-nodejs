'use strict'
var Promise = require('bluebird');
var Users = Promise.promisifyAll(require('../database/users'));

exports.findOneByQuery = function(query) {
  return Users.findOneAsync(query);
};

exports.addFavoritesToUser = function(userId, songId) {
  return Users.findOneAndUpdateAsync(
    {_id: userId},
    {$push: {listFavoriteSongs: songId}},
    {new: true}
  );
};

exports.addFriend = function(userId, friendId) {
  return Users.findOneAndUpdateAsync(
    {_id: userId},
    {$push: {friends: friendId}},
    {new: true}
  );
};

exports.findFriendsWhereIdIn = function(array) {
   return Users.find({
       '_id': { $in: array}
   });
};

exports.removeFavoriteToUser = function(userId, songId) {
  return Users.findOneAndUpdateAsync(
    {_id: userId},
    {$pop: {listFavoriteSongs: songId}},
    {new: true}
  );
};

exports.removeAllFavorites = function(userId) {
  return Users.findOneAndUpdateAsync(
    {_id: userId},
    {listFavoriteSongs: []},
    {new: true}
  );
};

exports.find = function(query) {
    return Users.findAsync(query);
};

exports.findWhereIdIn = function(array) {
   return Users.find({
       '_id': { $in: array}
   });
};

exports.lastUsers = function() {
    return Users.find({}).sort('-createdAt').limit(3);
};

exports.createUser = function(user) {
  return Users.createAsync(user);
};
