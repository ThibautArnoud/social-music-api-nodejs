var express = require('express');
var router = express.Router();
var UserService = require('../services/users');
var SongService = require('../services/songs');
var FriendService = require('../services/friends');

/* GET users listing. */
router.get('/', function(req, res, next) {
  if (req.accepts('text/html') || req.accepts('application/json')) {
    if(req.query.type && req.query.query){
        // même remarque que pour le filtrage des songs, la logique est bonne, mais on peut factoriser encore
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

router.get('/me/friends/ask', function(req, res){
  if (req.accepts('text/html') || req.accepts('application/json')){
    FriendService.getFriendsAsk({userReceiveId: req.user._id})
      .then(function(requestsFriend){
        if(!requestsFriend){
          res.status(404).send({err: 'No request friend found'});
          return;
        }
        idRequestsFriend = [];
        requestsFriend.forEach(function(request){
          idRequestsFriend.push(request.userAskId);
        });
        UserService.findWhereIdIn(idRequestsFriend)
          .then(function(askFriends){
            return res.render('friendsAsk', {askFriends: askFriends});
          })
      })
    ;
  }
  else{
    res.status(406).send({err: 'Not valid type for asked ressource'});
  }
});

router.post('/me/friends/:id/accepts', function(req,res){
  if (req.accepts('text/html') || req.accepts('application/json')){
    UserService.addFriend(req.params.id, req.user._id)
      .then(function(){
        UserService.addFriend(req.user._id, req.params.id)
          .then(function(user){
            FriendService.deleteAsk(req.user._id, req.params.id)
            //deleteAsk d'attend un unique objet Json formatté pour faire la query, mais ici tu passes deux params separés...
              .then(function(){
                req.logIn(user, function(error) {
                  if (!error) {
                    if (req.accepts('text/html')) {
                        return res.redirect("/users/me/friends");
                    }
                    if (req.accepts('application/json')) {
                        res.status(201).send(user);
                    }
                  }
                });
              })
            ;
          })
      })
    ;
    /*
      voici un autre façon de faire en reorganisant tes appels async avec Bluebird
      Promise.all([UserService.addFriend(req.user._id, req.params.id),
                  UserService.addFriend(req.params.id, req.user._id),
                  FriendService.deleteAsk(req.user._id, req.params.id)])
          .then(function (currentUserUpdate) {
              req.user.friends = currentUserUpdate.friends;
              if (req.accepts('text/html')) {
                  return res.redirect("/users/me/friends");
              }
              if (req.accepts('application/json')) {
                  res.status(201).send(currentUserUpdate);
              }
          })
          .catch(function(err) {
            console.log(err, err.stack);
          })
      ;
      */
  }
  else{
    res.status(406).send({err: 'Not valid type for asked ressource'});
  }
});

router.get('/me/friends', function(req, res){
  if(req.accepts('text/html') || req.accepts('application/json')){
    UserService.findOneByQuery({_id: req.user._id})
      .then(function(user){
        UserService.findFriendsWhereIdIn(user.friends)
          .then(function(friends){
            if(friends){
              if(req.accepts('text/html')) {
                  return res.render("friends", {user: user, friends: friends});
              }
              if (req.accepts('application/json')) {
                  res.status(201).send(user);
              }
            }
            if(req.accepts('text/html')) {
                return res.render("friends", {user: user});
            }
            if (req.accepts('application/json')) {
                res.status(201).send(user);
            }
          })
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
