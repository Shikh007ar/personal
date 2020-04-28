// jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const request = require("request");
const app = express();
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
var instagram = require('passport-instagram');


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.use(session({
  secret: 'Our little secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/BlogDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const blogSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  username : String,
  password: String,
  googleId: String
});
blogSchema.plugin(passportLocalMongoose);
blogSchema.plugin(findOrCreate);
const Blog = new mongoose.model("Blog",blogSchema);

passport.use(Blog.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  Blog.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/blog",
    userProfileURl: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    Blog.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
// passport.use(new InstagramStrategy({
//     clientID: INSTAGRAM_CLIENT_ID,
//     clientSecret: INSTAGRAM_CLIENT_SECRET,
//     callbackURL: "http://127.0.0.1:3000/auth/instagram/callback"
//   },
//   function(accessToken, refreshToken, profile, done) {
//     Blog.findOrCreate({ instagramId: profile.id }, function (err, user) {
//       return done(err, user);
//     });
//   }
// ));
// app.get('/auth/instagram',
//   passport.authenticate('instagram'));
//
// app.get('/auth/instagram/blog',
//   passport.authenticate('instagram', { failureRedirect: '/login' }),
//   function(req, res) {
//     res.redirect('/blog');
//   });

app.get("/auth/google",
passport.authenticate("google", {scope: ["profile"]})
);
app.get("/auth/google/blog",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    res.redirect("/blog");
  });

app.get("/",function(req,res){
  res.render("list");
});

app.get("/login",function(req, res){
  res.render("login");
})
app.get("/register", function(req, res){
  res.render("register");
})

app.get("/blog", function(req, res){
  if(req.isAuthenticated()){
    res.render("blog");
  }else{
    res.redirect("/login");
  }
});

  app.post("/register", function(req, res){
    Blog.register({firstname: req.body.first, lastname: req.body.last, username: req.body.username}, req.body.password, function(err,user){
      if(err){
        console.log(err);
        res.redirect("/register");
      }else{
        console.log("hye");
        passport.authenticate("local")(req ,res, function(){
          res.redirect("/blog");
        });
      }
    });
    });


app.post("/login",function(req,res){
  const user = new Blog({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/blog");
      });
    }
  });
  });

  app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/login");
});









app.listen(3000, function(){
  console.log("Server is running on port 3000");
})
