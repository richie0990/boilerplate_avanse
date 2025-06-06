'use strict';
require('dotenv').config();
const LocalStrategy = require('passport-local');
const express = require('express');
const myDB = require('./connection');
const { ObjectID } = require('mongodb');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const app = express();
const session = require("express-session");
const passport = require("passport");
const { addAbortListener } = require('mongodb/lib/apm.js');

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'pug');
app.set('views', "./views/pug")

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}))

app.use(passport.initialize())
app.use(passport.session())

const PORT = process.env.PORT || 3000;
myDB(async client => {
  const myDataBase = await client.db('database').collection('users');
  // Be sure to change the title
  app.route('/').get((req, res) => {
    // Change the response to render the Pug template
    res.render("index", {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true
    });
  });
  passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username: username }, (err, user) => {
      console.log(`User ${username} attempted to log in.`);
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (password !== user.password) { return done(null, false); }
      return done(null, user);
    });
  }));
  // Serialization and deserialization here...
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      console.log(doc)
      done(null, doc);

    });
  });
  // Be sure to add this...
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});
app.route("/login").post( passport.authenticate('local'),(req,res)=>{

})
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
