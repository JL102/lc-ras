var passport = require('passport');
var bcrypt = require('bcryptjs');					//bcrypt for password encryption
var LocalStrategy = require('passport-local').Strategy; //strategy for passport
var monk = require('monk');

const utilities = require("./utilities");

var db = utilities.getDB("lc_ras");

//Configure local strategy for use by Passport.
passport.use(new LocalStrategy(
	async function(username, password, done) {
		
		console.log("hello!");
		
		var userArr = await utilities.find("users", {"username": username});
		var user = userArr[0];
		
		if(!user){
			return done(null, false, {
				alert: "Unknown user: " + username
			});
		}
		else{
			//if user exists:
			//initialize because we'll get hash from two different possible ways
			var hash;
			
			if( user.password == undefined ){
				
				//if db user doesn't have a pass, something must be wrong with the db collection
				return done("User in database has no password?");
			}
			else{
				//if user exists and password is not default, get the stored hash
				hash = user.password;
				
				//Do bcrypt comparison. It will return done func so we want to return the result.
				return compare( password, hash, user, done );
			}
		}
	}
));

function compare( password, hash, user, done ){

	//Compare hash to entered password
	bcrypt.compare( password, hash, function(err, output){
		
		if(err){
			
			//if there's been an error, then error out
			console.log(err);
			return done(err);
		}
		if(output == true){
			
			//if authentication passes, return user
			console.log(user);
			return done(null, user);
		}
		else{
			
			//if output is not true, then return alert w/ invalid password
			return done(null, false, {
				alert: "Invalid password."
			});
		}
	});
}

// Creates the data necessary to store in the session cookie
passport.serializeUser(function(user, done) {
	//if we switch to mongoose, change to done(null, user.id);
	console.log("serializeUser:"+user._id);
    done(null, user._id);
});

// Reads the session cookie to determine the user from a user ID
passport.deserializeUser(async function(id, done) {
	
	/*if we switch to mongoose, change to 
	[schema name].findById(id, function (err, user) {
        done(err, user);
    });
	*/
	
	var mid = monk.id(id);
	
	var userArr = await utilities.find("users", {"_id": mid} );
	
	console.log(mid);
	console.log(userArr);
	
	var user = userArr[0];
	
	if(!user) console.error("User not found in db: deserializeUser " + id);
	
	else done(null, user);
});
