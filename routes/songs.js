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
          //malheuresement avec cet if, la requete que fait de filtre ne renvoie que du html,
          // t'as qu'un render et pas un autre send dans la cas application/json
          // si tu regardes, les deux blocs font appel à la même function du SongService: find. donc le code peut être factorisé
          //
        type = req.query.type;
      // cette variable est useless
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
          // TRES BIEN !
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
/*
    En regorgisant ton code, on pourrait avoir cette version...
        query = {};
        if(req.query.type && req.query.query) {
            switch (req.query.type) {
                case 'artiste':
                case 'album':
                case 'title':
                    query[req.query.type] = {$regex: req.query.query, $options: 'i'};
                    break;
                case 'year':
                case 'bpm':
                    query[req.query.type] = req.query.query;
                    break;
            }
        }
        SongService.find(query)
            .then(function (songs) {
                if (req.accepts('text/html')) {
                    return res.render('songs', {songs: songs});
                }
                if (req.accepts('application/json')) {
                    res.status(200).send(songs);
                }
            })
        ;
*/
    }
    else {
        res.status(406).send({err: 'Not valid type for asked ressource'});
    }
});

router.get('/add', function(req, res) {
    // il manque quand meme un middleware pour verfier que c'est l'admin qui est en session
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
    //personellement j'aurais crée une route exclusivement pour les notes. On aurait pu être plus explicit sur cette URL
    //genre POST /songs/:id/user/:user_id/note pour indiquer que la note appartient et est lié à un user spécifique
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
                // c'est plutot la note qu'on devrait renvoyer, pas la chanson
            }
        })
        .catch(function(err) {
            res.status(500).send(err);
        })
    ;
});

router.post('/:id/favorite', function(req, res) {
    // pareil, ici l'url choisi m'embete un peu... on ne fait pas reference à l'user et en plus
    // c'est la ressource principale à être modifiée
    // sinon la logique est la bonne
    UserService.addFavoritesToUser(req.user._id, req.params.id)
        .then(function(user) {
          req.logIn(user, function(error) {
          //tiens, je connaissais pas.
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
    // moi j'ai fait ça sur la route des users, et pour mettre à jour l'objet req.user, j'ai juste assigné les nouvelles chansons
    /**
     * router.put('/me/addFavoriteSong/:song_id', function(req, res, next) {
        UserService.addFavoritesToUser(req.user._id, req.params.song_id)
        .then(function(updatedUser) {
            req.user.favoriteSongs = updatedUser.favoriteSongs;
            // une fois l'user mise à jour, je redigire vers la route qu'affiche l'user, elle se debrouille pour
            // gerer le cas json ou html avec les headers qui viennent déjà dans la requete
            return res.redirect('/users/me');
        })
    ;
});
     */
});


router.delete('/:id/favorite', function(req, res) {
    // pareil, l'url me derange
    UserService.removeFavoriteToUser(req.user._id, req.params.id)
        .then(function(user) {
          req.logIn(user, function(error) {
            if (!error) {
              if (req.accepts('text/html')) {
                  return res.redirect("/users/me");
              }
              if (req.accepts('application/json')) {
                  res.status(201).send(user);
                  //200, 204!!!!
              }
            }
            res.status(500).send(err);
            return;
          });
        })
        .catch(function(err) {
            res.status(500).send(err);
        })
    ;
});

router.delete('/favorite/all', function(req, res) {
    // pareil, l'url me derange
    UserService.removeAllFavorites(req.user._id, req.params.id)
        .then(function(user) {
          req.logIn(user, function(error) {
            if (!error) {
              if (req.accepts('text/html')) {
                  return res.redirect("/users/me");
              }
              if (req.accepts('application/json')) {
                  res.status(201).send(user);
                  //204, 200
              }
            }
            res.status(500).send(err);
            return;
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
                      // t'as un erreur de syntaxe là, {song} n'est pas un objet JSON valide comme ça
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
