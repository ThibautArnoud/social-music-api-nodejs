var express = require('express');
var _ = require('lodash');
var router = express.Router();
var SongService = require('../services/songs');
var NoteService = require('../services/notes');
var UserService = require('../services/users');

var verifyIsAdmin = function(req, res, next) {
    if (req.isAuthenticated() && req.user.username === 'admin') {
        return next();
    }
    else {
        res.status(403).send({err: 'Current user can not access to this operation'});
    }
};

router.get('/', function(req, res) {
    if (req.accepts('text/html') || req.accepts('application/json')) {
      if(req.query.type && req.query.query){
        type = req.query.type;
        switch (req.query.type) {
          case 'artiste':
            request = {artist: {$regex: req.query.query, $options: 'i'}};
            break;
          case 'album':
            request = {album: {$regex: req.query.query, $options: 'i'}}
            break;
          case 'title':
            request = {title: {$regex: req.query.query, $options: 'i'}}
            break;
          case 'year':
            request = {year: req.query.query}
            break;
          case 'bpm':
            request = {year: req.query.query}
            break;
        }
        SongService.find(request)
            .then(function(songs) {
                return res.render('songs', {songs: songs});
            })
            .catch(function(err) {
                console.log(err);
                res.status(500).send(err);
            })
          ;
        }else{
          SongService.find()
              .then(function(songs) {
                  if (req.accepts('text/html')) {
                      return res.render('songs', {songs: songs});
                  }
                  if (req.accepts('application/json')) {
                      res.status(200).send(songs);
                  }
              })
          ;
        }
    }
    else {
        res.status(406).send({err: 'Not valid type for asked ressource'});
    }
});

router.get('/add', function(req, res) {
    var song = (req.session.song) ? req.session.song : {};
    var err = (req.session.err) ? req.session.err : null;
    if (req.accepts('text/html')) {
        req.session.song = null;
        req.session.err = null;
        return res.render('newSong', {song: song, err: err});
    }
    else {
        res.status(406).send({err: 'Not valid type for asked ressource'});
    }
});

router.post('/:id/notes', function(req, res) {
    song_id = req.params.id;
    req.body.song = song_id;
    req.body.username = res.locals.user_name;
    NoteService.create(req.body)
        .then(function(note) {
            if (req.accepts('text/html')) {
                return res.redirect('/songs/' + note.song);
            }
            if (req.accepts('application/json')) {
                return res.status(201).send(song);
            }
        })
        .catch(function(err) {
            res.status(500).send(err);
        })
    ;
});

router.post('/:id/favorite', function(req, res) {
    UserService.addFavoritesToUser(req.user._id, req.params.id)
        .then(function(user) {
          req.logIn(user, function(error) {
            if (!error) {
              if (req.accepts('text/html')) {
                  return res.redirect("/songs/" + req.params.id);
              }
              if (req.accepts('application/json')) {
                  res.status(201).send(user);
              }
            }
          });
        })
        .catch(function(err) {
            res.status(500).send(err);
        })
    ;
});

router.delete('/:id/favorite', function(req, res) {
    UserService.addFavoritesToUser(req.user._id, req.params.id)
        .then(function(user) {
          req.logIn(user, function(error) {
            if (!error) {
              if (req.accepts('text/html')) {
                  return res.redirect("/songs/" + req.params.id);
              }
              if (req.accepts('application/json')) {
                  res.status(201).send(user);
              }
            }
          });
        })
        .catch(function(err) {
            res.status(500).send(err);
        })
    ;
});

router.get('/:id', function(req, res){
  user = req.user;
  if (req.accepts('text/html') || req.accepts('application/json')){
      SongService.findOneByQuery({_id: req.params.id})
          .then(function(song) {
              if (!song) {
                  res.status(404).send({err: 'No song found with id' + req.params.id});
                  return;
              }
              NoteService.findOneByQuery({song: song._id, username: res.locals.user_name})
                .then(function(note){
                  var userHasFav = (req.user.listFavoriteSongs.indexOf(String(song._id)) >= 0);
                  if (!note){
                    if (req.accepts('text/html')){
                        return res.render('song', {song: song, note: 0, userHasFav: userHasFav});
                    }
                    if (req.accepts('application/json')){
                        return res.send(200, song);
                    }
                  }
                  if (req.accepts('text/html')){
                      return res.render('song', {song: song, note: note, userHasFav: userHasFav});
                  }
                  if (req.accepts('application/json')){
                      return res.send(200, {song});
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

router.get('/artist/:artist', function(req, res) {
    SongService.find({artist: {$regex: req.params.artist, $options: 'i'}})
        .then(function(songs) {
            res.status(200).send(songs);
        })
        .catch(function(err) {
            console.log(err);
            res.status(500).send(err);
        })
    ;
});

var songBodyVerification = function(req, res, next) {
    var attributes = _.keys(req.body);
    var mandatoryAttributes = ['title', 'album', 'artist'];
    var missingAttributes = _.difference(mandatoryAttributes, attributes);
    if (missingAttributes.length) {
        res.status(400).send({err: missingAttributes.toString()});
    }
    else {
        if (req.body.title && req.body.album && req.body.artist) {
            next();
        }
        else {
            var error = mandatoryAttributes.toString() + ' are mandatory';
            if (req.accepts('text/html')) {
                req.session.err = error;
                req.session.song = req.body;
                res.redirect('/songs/add');
            }
            else {
                res.status(400).send({err: error});
            }
        }
    }
};

router.post('/', verifyIsAdmin, songBodyVerification, function(req, res) {
    SongService.create(req.body)
        .then(function(song) {
            if (req.accepts('text/html')) {
                return res.redirect('/songs/' + song._id);
            }
            if (req.accepts('application/json')) {
                return res.status(201).send(song);
            }
        })
        .catch(function(err) {
            res.status(500).send(err);
        })
    ;
});

router.delete('/', verifyIsAdmin, function(req, res) {
    SongService.deleteAll()
        .then(function(songs) {
            res.status(200).send(songs);
        })
        .catch(function(err) {
            res.status(500).send(err);
        })
    ;
});

router.get('/edit/:id', verifyIsAdmin, function(req, res) {
    var song = (req.session.song) ? req.session.song : {};
    var err = (req.session.err) ? req.session.err : null;
    if (req.accepts('text/html')) {
        SongService.findOneByQuery({_id: req.params.id})
            .then(function(song) {
                if (!song) {
                    res.status(404).send({err: 'No song found with id' + req.params.id});
                    return;
                }
                return res.render('editSong', {song: song, err: err});
            })
        ;
    }
    else {
        res.status(406).send({err: 'Not valid type for asked ressource'});
    }
});

router.put('/:id', verifyIsAdmin, function(req, res) {
    SongService.updateSongById(req.params.id, req.body)
        .then(function (song) {
            if (!song) {
                res.status(404).send({err: 'No song found with id' + req.params.id});
                return;
            }
            if (req.accepts('text/html')) {
                return res.redirect('/songs/' + song._id);
            }
            if (req.accepts('application/json')) {
                res.status(200).send(song);
            }
        })
        .catch(function (err) {
            res.status(500).send(err);
        })
    ;
});

router.delete('/:id', verifyIsAdmin, function(req, res) {
    SongService.removeAsync({_id: req.params.id})
        .then(function() {
            res.status(204);
        })
        .catch(function(err) {
            res.status(500).send(err);
        })
    ;
});

module.exports = router;
