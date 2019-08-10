const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  if (!req.headers.cookies) {
    models.Sessions.create()
      .then((result) => {
        return models.Sessions.get({id: result.insertId});
      })
      .then((session) => {
        console.log(session);
        req.session = session;
        res.cookies['shortlyid'] = session.hash;
        console.log('req.cookies is equal to', res.cookies);
        next();
      });
  } else {
    res.send('hello');
    next();
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

