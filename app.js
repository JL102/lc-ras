//load dependencies
const express = require('express');					//main express shiz
const path = require('path');						//for filesystem
const favicon = require('serve-favicon');			//serves favicon
const bodyParser = require('body-parser');			//parses http request information
const session = require('express-session');			//session middleware (uses cookies)
const passport = require('passport');				//for user sessions
const useragent = require('express-useragent');	//for info on connected users
const useFunctions = require('./useFunctions');		//Functions inside separate module for app.use
const utilities = require("./utilities")


//isDev is typically used as a locals var in view engine.
//debug is used for logging.
//production is used to cache pug views.
var isDev = false, debug = false, production = false;

/* Check process arguments.
	If -dev or --dev, isDev = true.
	If -debug or --debug, debug = true.
	If -d or --d, both = true.
*/
for(var i in process.argv){
	switch(process.argv[i]){
		case "-dev":
		case "--dev":
			console.log("Dev");
			isDev = true;
			break;
		case "-d":
		case "--d":
			console.log("Dev");
			isDev = true;
		case "-debug":
		case "--debug":
			console.log("Debug");
			debug = true;
			break;
		case "-production":
		case "--production":
			production = true;
	}
}

//PUG CACHING (if dev is NOT enabled or production IS enabled)
if(production){
	console.log("Production");
	process.env.NODE_ENV = "production";
}

//Create app.
var app = express();

//set app's bools to these arguments
app.isDev = isDev; 
app.debug = debug; 

//Boilerplate setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

//Session
app.use(session({
	secret: 'marcus night',
	resave: false,
	saveUninitialized: true
}));
//User agent for logging
app.use(useragent.express());

//Passport setup (user authentication)
require('./passport-config');
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next){
	//For logging
	req.requestTime = Date.now();
	//For user login
	req.passport = passport;
	
	next();
});
//View variables
app.use(useFunctions.userViewVars);
//Logging and timestamping
app.use(useFunctions.logger);
//adds logging to res.render function
app.use(useFunctions.renderLogger);

//USER ROUTES
var index = require('./routes/index');
var login = require('./routes/user');
var editor = require('./routes/editor');
var admin = require('./routes/admin');

//CONNECT URLS TO ROUTES
app.use('/', index);
app.use('/user', login);
app.use('/editor', editor);
app.use('/admin', admin);

// catch 404 and forward to error handler
app.use(useFunctions.notFoundHandler);
// error handler
app.use(useFunctions.errorHandler);

console.log("app.js:".red + " " +"Ready!".bgGreen)

module.exports = app;
