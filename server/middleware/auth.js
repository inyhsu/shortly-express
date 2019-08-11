const models = require('../models');
const Promise = require('bluebird');
const _ = require('underscore');

module.exports.createSession = (req, res, next) => {
  if (!req.cookies || Object.keys(req.cookies).length === 0) {
    console.log('first line in createSession, request body', req.body);
    models.Users.get({username : req.body.username})
      .then((results) => {
        if (results) {
          return models.Sessions.create(results.id);
        } else {
          return models.Sessions.create(null);
        }
      })
      .then((result) => {
        return models.Sessions.get({id: result.insertId});
      })
      .then((session) => {
        req.session = session;
        //console.log('this is the session username', req.session.user.username);
        if (res.cookies) {
          res.cookies['shortlyid'] = {};
          res.cookies['shortlyid'].value = session.hash;
        } else {
          res.cookies = {};
          res.cookies['shortlyid'] = {};
          res.cookies['shortlyid'].value = session.hash;
        }
        // console.log('req.cookies is equal to', res.cookies);
        res.cookie('shortlyid', session.hash);
        next();
      })
  } else {
    console.log('if cookie exists', req.cookies);
    models.Sessions.get({ hash : req.cookies.shortlyid})
      .then((result) => {
        if (result) {
          // console.log('with cookie', result);
          req.session = result;
          next();
        } else {
          models.Users.get({username : req.body.username})
            .then((results) => {
              if (results) {
                return models.Sessions.create(results.id);
              } else {
                return models.Sessions.create(null);
              }
            })
            .then((result) => {
              return models.Sessions.get({id: result.insertId});
            })
            .then((session) => {
              // console.log('this is the one with bad cookies', session)
              res.cookies = {};
              res.cookies['shortlyid'] = {value: session.hash};
              res.cookie('shortlyid', session.hash);
              next();
            })
        }
      })
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

module.exports.verifySession = (req, res, next) => {
  console.log('req.session', req.session);
  console.log('res.session', res.session);
  console.log('req.url', req.url);
  if(req.url === '/' || req.url === '/create' || req.url === '/links') {
    if (models.Sessions.isLoggedIn(req.session)) {
      next();
    } else {
      res.redirect('/login');
    }
  } else {
    next();
  }
}