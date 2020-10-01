//load dependencies
const express = require('express');					//main express shiz
const path = require('path');						//for filesystem
const favicon = require('serve-favicon');			//serves favicon
const bodyParser = require('body-parser');			//parses http request information
const session = require('express-session');			//session middleware (uses cookies)
const passport = require('passport');				//for user sessions
const useragent = require('express-useragent');	//for info on connected users
const useFunctions = require('./useFunctions');		//Functions inside separate module for app.use
const utilities = require("./utilities");
const vhostFunc = require('vhost');


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

//RAS EXPRESS FUNC
const ras = express();

//set app's bools to these arguments
ras.isDev = isDev; 
ras.debug = debug; 

//Boilerplate setup
ras.set('views', path.join(__dirname, 'views'));
ras.set('view engine', 'pug');
ras.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
ras.use(bodyParser.json());
ras.use(bodyParser.urlencoded({ extended: false }));
ras.use(express.static(path.join(__dirname, 'public')));

//Session
ras.use(session({
	secret: 'marcus night',
	resave: false,
	saveUninitialized: true
}));
//User agent for logging
ras.use(useragent.express());

//Passport setup (user authentication)
require('./passport-config');
ras.use(passport.initialize());
ras.use(passport.session());

ras.use(function(req, res, next){
	//For logging
	req.requestTime = Date.now();
	//For user login
	req.passport = passport;
	
	next();
});
//View variables
ras.use(useFunctions.userViewVars);
//Logging and timestamping
ras.use(useFunctions.logger);
//adds logging to res.render function
ras.use(useFunctions.renderLogger);

//USER ROUTES
var index = require('./routes/index');
var login = require('./routes/user');
var editor = require('./routes/editor');
var admin = require('./routes/admin');

//CONNECT URLS TO ROUTES
ras.use('/', index);
ras.use('/user', login);
ras.use('/editor', editor);
ras.use('/admin', admin);

// catch 404 and forward to error handler
ras.use(useFunctions.notFoundHandler);
// error handler
ras.use(useFunctions.errorHandler);

//MAPS EXPRESS FUNC.
const maps = express();

maps.use((req, res, next) => {
	req.requestTime = Date.now();
	next();
});

maps.set('view engine', 'pug');
maps.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
maps.use(useragent.express());

//View variables
//maps.use(useFunctions.userViewVars);
//Logging and timestamping
//maps.use(useFunctions.logger);

//Use RAS under /ras subdomain
maps.use('/ras', ras);

//Serve static files for Maps
const MAPS_LOCATION = '../MapSites/OldMaps';
const MapsPath = path.resolve(__dirname, MAPS_LOCATION);
console.log(`MapsPath: ${MapsPath}`);;


maps.use(express.static(path.join(__dirname, 'public')));
maps.use('/players', express.static(path.join(MapsPath, 'PlayerPortals')))
maps.use('/staff', express.static(path.join(MapsPath, 'StaffPortals')))
maps.use('/other', express.static(path.join(MapsPath, 'MiscTransport')))
//Serve index.html from maps directory (If I did express.static, then they would be able to access /maps/PlayerPortals)
maps.use('/', (req, res, next) => {
	if (req.url != '/') {
		res.redirect('/');
		req.url = '/';
	}
	else {
		res.render('./mapslanding', {
			title: 'Maps'
		});
		//res.sendFile(path.join(MapsPath, 'index.html'));
	}
});

maps.use(useFunctions.notFoundHandler);
maps.use((err, req, res, next) => {
	
	res.status(err.status || 500);
	res.sendStatus(err.status || 500);
});

//LOCKEDCRAFT LANDING PAGE
const lockedcraft = express();
lockedcraft.use(express.static(path.join(__dirname, 'public')));
lockedcraft.use('/', (req, res, next) => {
	res.sendFile(path.join(__dirname, 'views/lockedcraft.com.html'));
})

//VHOST EXPRESS FUNC
const vhost = express();

vhost.use(requireHTTPS);

vhost.use(vhostFunc('ras.localhost', ras));
vhost.use(vhostFunc('localhost', ras));
vhost.use(vhostFunc('maps.localhost', maps));
vhost.use(vhostFunc('lockedcraft.localhost', lockedcraft));

vhost.use(vhostFunc('ras.mc-smp.com', ras));
vhost.use(vhostFunc('test.mc-smp.com', ras));
vhost.use(vhostFunc('maps.mc-smp.com', maps));
vhost.use(vhostFunc('lockedcraft.mc-smp.com', lockedcraft));
vhost.use(vhostFunc('lockedcraft.com', lockedcraft));

console.log("ras.js:".red + " " +"Ready!".bgGreen)

module.exports = vhost;

function requireHTTPS(req, res, next) {
	// The 'x-forwarded-proto' check is for Heroku
	if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV !== "development" && process.env.HTTPS_ENABLED == 'true') {
		console.log('requireHTTPS: Redirecting user to HTTPS');
		return res.redirect('https://' + req.get('host') + req.url);
	}
	next();
}