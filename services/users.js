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

exports.removeFavoritesToUser = function(userId, songId) {
  return Users.findOneAndDeleteAsync(
    {_id: userId},
    {$push: {listFavoriteSongs: songId}},
    {new: true}
  );
};

exports.find = function(query) {
    return Users.findAsync(query);
};

exports.lastUsers = function() {
    return Users.find({}).sort('-createdAt').limit(3);
};

exports.createUser = function(user) {
  return Users.createAsync(user);
};
