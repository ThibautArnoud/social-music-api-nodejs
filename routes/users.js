var express = require('express');
var router = express.Router();
var UserService = require('../services/users');
var SongService = require('../services/songs');
var FriendService = require('../services/friends');

/* GET users listing. */
router.get('/', function(req, res, next) {
  if (req.accepts('text/html') || req.accepts('application/json')) {
    if(req.query.type && req.query.query){
      switch (req.query.type) {
        case 'displayName':
          request = {displayName: {$regex: req.query.query, $options: 'i'}};
          break;
        case 'username':
          request = {username: {$regex: req.query.query, $options: 'i'}}
          break;
      }
      UserService.find(request)
          .then(function(users) {
              return res.render('users', {users: users});
          })
          .catch(function(err) {
              console.log(err);
              res.status(500).send(err);
          })
        ;
      }else{
        UserService.find()
            .then(function(users) {
              var usersSend = [];
              for(var i = 0; i < users.length; i++){
                var user = {
                  displayName: users[i].displayName,
                  username: users[i].username,
                  _id: users[i]._id
                }
                usersSend.push(user);
              }
              if (req.accepts('text/html')) {
                  return res.render('users', {users: usersSend});
              }
              if (req.accepts('application/json')) {
                  res.status(200).send(usersSend);
              }
            })
        ;
      }
  }
  else {
      res.status(406).send({err: 'Not valid type for asked ressource'});
  }
});

router.post('/:id/friend', function(req, res){
  if (req.accepts('text/html') || req.accepts('application/json')){
    FriendService.create({userAskId: req.user._id, userReceiveId: req.params.id})
      .then(function(friend){
        if (req.accepts('text/html')) {
          return res.redirect(req.header('Referer') || '/');
        }
        if (req.accepts('application/json')) {
          res.status(200).send(friend);
        }
      })
    ;
  }else {
    res.status(406).send({err: 'Not valid type for asked ressource'});
  }
});

router.get('/me', function(req, res){
  if (req.accepts('text/html') || req.accepts('application/json')){
      UserService.findOneByQuery({_id: req.user._id})
          .then(function(user) {
              if (!user) {
                  res.status(404).send({err: 'No user found with id' + req.params.id});
                  return;
              }
              var userSend = {
                displayName: user.displayName,
                username: user.username,
                _id: user._id,
                createdAt: user.createdAt,
              }
              SongService.findWhereIdIn(user.listFavoriteSongs)
                .then(function(songs){
                  if(!songs){
                    if (req.accepts('text/html')) {
                        return res.render('me', {user: userSend, songs: 0});
                    }
                    if (req.accepts('application/json')) {
                        res.status(200).send(userSend);
                    }
                  }
                  if (req.accepts('text/html')) {
                      return res.render('me', {user: userSend, songs: songs});
                  }
                  if (req.accepts('application/json')) {
                      res.status(200).send(userSend);
                  }
                })
          })
          .catch(function(err){
              console.log(err);
              res.status(500).send(err);
          })
      ;
  }
  else{
      res.status(406).send({err: 'Not valid type for asked ressource'});
  }
});

router.get('/:id', function(req, res){
  if (req.accepts('text/html') || req.accepts('application/json')){
      UserService.findOneByQuery({_id: req.params.id})
          .then(function(user) {
              if (!user) {
                  res.status(404).send({err: 'No user found with id' + req.params.id});
                  return;
              }
              var userSend = {
                displayName: user.displayName,
                username: user.username,
                _id: user._id,
                createdAt: user.createdAt,
              }
              SongService.findWhereIdIn(user.listFavoriteSongs)
                .then(function(songs){
                  if(!songs){
                    if (req.accepts('text/html')) {
                        return res.render('user', {user: userSend, songs: 0});
                    }
                    if (req.accepts('application/json')) {
                        res.status(200).send(userSend);
                    }
                  }
                  if (req.accepts('text/html')) {
                      return res.render('user', {user: userSend, songs: songs});
                  }
                  if (req.accepts('application/json')) {
                      res.status(200).send(userSend);
                  }
                })
          })
          .catch(function(err){
              console.log(err);
              res.status(500).send(err);
          })
      ;
  }
  else{
      res.status(406).send({err: 'Not valid type for asked ressource'});
  }
});


module.exports = router;
