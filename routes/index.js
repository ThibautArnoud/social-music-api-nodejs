var express = require('express');
var router = express.Router();
var Top5Service = require('../services/top5');
var UserService = require('../services/users');

/* GET home page. */
router.get('/', function(req, res, next) {
    var top5;
    if (req.accepts('text/html') || req.accepts('application/json')) {
        Top5Service.getTop5SongsByNotes()
            .then(function(songs) {
              UserService.lastUsers()
                .then(function(users){
                  if(!users){
                    res.status(404).send({err: 'No Users found'});
                  }
                  if(req.accepts('text/html')) {
                      return res.render('index', {top5: songs, lastUsers: users});
                  }
                  if (req.accepts('application/json')) {
                    res.status(200).send({top5: songs, lastUser: users});
                  }
                })
              ;
            })
        ;
    }
    else {
        res.status(406).send({err: 'Not valid type for asked ressource'});
    }
});

module.exports = router;
