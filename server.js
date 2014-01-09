var express = require('express'),
	partials = require('express-partials'),
	flash = require('connect-flash'),
	mongodb = require('mongodb'),
	mongoose = require('mongoose'),
	loginManager = require('./lib/loginManager'),
	url = require('url'),
	querystring = require('querystring'),
	passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  crypto = require('crypto'),
	appPort = 80;
	
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    console.log("Passport Local Strategy Firing");
    console.log(username);
    console.log(password);

    loginManager.managers.UserManager.findOrCreateItem({ username: username, password:password }, function (err, user) {
      console.log("Passport local strategy.findOrCreateItem.callback");
      if (err) {console.log(err); return done(err); }
      
      if (!user) {
        console.log("No user profile returned");
        return done(null, false, { message: 'Incorrect username.' });
      }
      if(!loginManager.managers.UserManager.authenticatePassword({plainText:password, password:user.password, salt:user.passwordSalt})) {
        console.log("Incorrect Password");
        return done(null, false, { message: 'Incorrect password.' });
      }
      console.log("User Found");
      return done(null, user);
    });
  }
));


//Set up the webserver
var app = express(),
http = require('http'), 
server = http.createServer(app),
io = require('socket.io').listen(server);

app.configure(function(){
    //var edt = require('express-debug');
    //edt(app, {/* settings */});
    app.set('view engine', 'jade');
    app.use(partials());
    app.use(express['static'](__dirname+'/public', {maxAge: 86400000}));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.session({ secret: "kekekekeke"}));
    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
    
    app.use(function (req, res, next) {
      if(req.session == undefined || req.session.profile == undefined){
        res.locals({'registeredUser':"none"});
      }
      else{
        res.locals({'registeredUser':req.session.profile.username});
      }
      
      next();
    });
    app.use(app.router);
});

app.post('/login',
  function(req, res, next){

  	console.log("Starting login sequence");
  	console.log(req.body);
    if(req.body.changePassword == "true"){
      console.log("Changing user password");
      loginManager.managers.UserManager.changeUserPassword({username:req.body.username, password:req.body.password}, function(err, user){
          if(err){
            console.log(err);

          }
          else{
            console.log("User password changed successfully");
            next();
          }
      });
    }
    else{
    	console.log("No password change.  Moving to next step");
      next();
    }
  },

  function(req, res, next) {
  	console.log("Attempting to authenticate user");
    passport.authenticate('local', function(err, user, info) {
    	console.log("Passport.authenticate.callback");
        if (err) { return console.log("There was an error."); console.log(err); next(err); }
        if (!user) { console.log("No User"); req.flash('loginError',"Incorrect username or password."); return res.redirect('/'); }
        if (info && info.changePassword) { return res.render('login', { title: 'Login Form', changePassword: info.changePassword }); }
        req.logIn(user, function(err) {
          if (err) { return next(err); }
          return next();
        });
    })(req, res, next);
  },
  function(req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    console.log("User authenticated");
    res.locals.registeredUser = req.user.username;
    loginManager.managers.UserManager.findItem({"username":req.user.username}, function(err, profile){
      if(err){
        console.log(err);
      }
      else{
        req.session.profile = profile;
        if(req.session.redirectTo){
          console.log("Redirecting");
          res.redirect(req.session.redirectTo);
          req.session.redirectTo = undefined;
        }
        else{
          if(req.user.role == "administrator"){
            res.redirect("/admin");
          }
          else{
            res.redirect("/home");
          }
        }
      }
    });
});

app.get('/logout', function(req, res){
  req.logout();
  req.session.registeredUser = "none";
  req.session.profile = undefined;
  res.locals.registeredUser = "none";
  res.redirect('/');
});

function isLoggedIn(req, res, next){
  req.session.registeredUser = undefined;
  if(req.user){
    req.registeredUser = req.user.username;
    req.session.registeredUser = req.user.username;
    next();
  }
  else {
    req.session.redirectTo = req.route.path;
    res.redirect('/');
  }
}

function isAlreadyLoggedIn(req, res, next){
  if(req.user){
    res.redirect('/home');
  }
  else {
    next();
  }
}

//Functions for parsing actions meant for specific managers
app.param('myAction', function(req, res, next, myAction){
  console.log("Parsing the action");
  console.log(myAction);
  req.myAction = myAction;
  next();
});

app.all("/userAdmin/:myAction", function (req, res){
  console.log("Receiving userAdmin Request");
  res.writeHead(200, {"Content-Type": "text/plain"});
  loginManager.managers.UserManager.router.trigger(req.myAction, req, res);
});

//Standard pages to be accessed
app.get('/', isAlreadyLoggedIn, function(req, res){
  console.log("Rendering index page");
    res.render('index', { pageTitle: 'Welcome to the app', messages: req.flash('loginError')});
});

app.get('/home', isLoggedIn, function(req, res){
  console.log("Rendering user home page");
    res.render('home', { title: 'You are logged in to the app'});
});

app.get('/settings', isLoggedIn, function(req, res){
  console.log("Rendering user settings page");
    res.render('settings', { title: 'User Account Settings'});
});

app.get('/forgotmypassword', function(req, res){
    res.render('forgotPassword', { title: 'Reset Your Password'});
});

app.get('/resetmypassword', function(req, res){
	var queryData = url.parse(req.url, true).query;
	console.log(queryData);
    res.render('resetPassword', { title: 'Change Your Password', username:queryData.username, resetCode:queryData.code});
});

app.listen(appPort);
console.log('Listening on port ' + appPort);