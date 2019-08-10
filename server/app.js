const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');
const cookieParser = require('./middleware/cookieParser');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(cookieParser);
app.use(Auth.createSession);



app.get('/',
(req, res) => {
  res.render('index');
});

app.get('/create',
(req, res) => {
  res.render('index');
});

app.get('/links',
(req, res, next) => {
  models.Links.getAll()
    .then(links => {
      res.status(200).send(links);
    })
    .error(error => {
      res.status(500).send(error);
    });
});

app.get('/logout', (req, res) => {
  console.log('in logout req.cookies', req.cookies);
  models.Sessions.delete({ hash: req.cookies.shortlyid});
  res.cookie('shortlyid', null);
  res.send(200);
})

app.post('/links',
(req, res, next) => {
  var url = req.body.url;
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }

  return models.Links.get({ url })
    .then(link => {
      if (link) {
        throw link;
      }
      return models.Links.getUrlTitle(url);
    })
    .then(title => {
      return models.Links.create({
        url: url,
        title: title,
        baseUrl: req.headers.origin
      });
    })
    .then(results => {
      return models.Links.get({ id: results.insertId });
    })
    .then(link => {
      throw link;
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(link => {
      res.status(200).send(link);
    });
});


// SELECT * FROM users WHERE username = ? AND 'password = ? values ( 'Jhon', 'Samantha' )
/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/signup', (req, res) => {
  console.log('from req body', req.body);
  // console.log('users.get on non existant user', models.Users.get({username: req.body.username}));

  // if(models.Users.get({username: req.body.username})) {
  //   res.redirect('/signup');
  //   return;
  // }

  return models.Users.create({
        username: req.body.username,
        password: req.body.password
    })
    .then(results => {
      console.log('req.cookies', req.cookies);
      console.log('res.cookies', res.cookies);
      console.log('users results', results);
      models.Sessions.update({hash: res.cookies.shortlyid.value}, {userId :results.insertId})
      res.redirect('/');
    })
    .error(error => {
      if (error.cause.sqlMessage.includes('Duplicate')) {
        res.redirect('/signup');
      } else {
        res.status(500).send(error);
      }
    })
});
//WHERE sessions.hash = ? AND users.id = sessions.userId
app.post('/login', (req, res) => {
  // console.log('login', req.body);
  models.Users.get({username: req.body.username})
    .then(results => {
      if (results) {
        if (models.Users.compare(req.body.password, results.password, results.salt)) {
          return results.id;
        } else {
          return false;
        }
      } else {
        return false;
      }
    })
    .then(id => {
      if (id) {
        console.log('login session update', req.cookies);
        models.Sessions.update({hash: req.cookies.shortlyid}, {userId :id})
        .then(() => {
          res.redirect('/');
        });
      } else {
        res.redirect('/login');
      }
    })
    .error(error => {
      res.status(500).send(error);
    });
})


/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
