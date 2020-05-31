const express = require("express");
const router = express.Router();

const utilities = require("../utilities");

const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

router.get('/logout', async function(req, res){
	
	//Log out user
	req.logout();
	
	res.redirect('/');
})

router.get('/login', async function(req, res){
	
	res.render('user/login', {
		title: "Login",
	});
});

router.post('/login', async function(req, res){
	
	var username = req.body.username;
	var password = req.body.password;
	
	if(!username || !password){
		return res.redirect('/user/login?alert=Please enter a valid username and password.');
	}
	
	var user = await utilities.find("users", {username: username});
	
	if(!user || !user[0]){
		console.log("Invalid user entered: " + username);
		return res.redirect("/user/login?alert=Username or password incorrect.");
	}
	
	req.passport.authenticate("local", function(err, user, info){
		// if any problems exist, error out
		if (err) {
			res.sendStatus(500);
			res.log(err);
			return err;
		}
		
		//If user isn't passed, render login with the error message.
		if (!user) {
			var alert = info != undefined ? info.alert || null : null;
			
			return res.redirect('/user/login?alert='+alert);
		}
		
		// log in the user
		req.logIn(user, function(err) {
			if (err) 
				return err;
			//redirect to homepage
			return res.redirect('/');
		});
	})(req, res);
});

/*
	ADMIN-ONLY PAGES
*/

router.get('/manage', async function(req, res){
	if(!require('./checkauthentication')(req, res, 3)) return null; //Authentication check for admin.
	
	var users = await utilities.find("users");
	
	res.log(users);
	
	res.render('./admin/manageusers', {
		title: 'Manage Users',
		users: users
	})
})

router.get('/create', async function(req, res){
	
	if(!require('./checkauthentication')(req, res, 3)) return null; //Authentication check for admin.
	
	var roles = await utilities.find("roles");
	
	res.render('user/create', {
		title: "Create a User",
		roles: roles
	});
});

router.post('/create', async function(req, res){
	
	if(!require('./checkauthentication')(req, res, 3)) return null; //Authentication check for admin.
	
	//get specified params
	var username = req.body.username;
	var password = req.body.password;
	var selectedRole = req.body.role;
	
	//if all params not sent, send alert
	if(!username || !password || !selectedRole){
		return res.redirect('/user/create?alert=Please enter a valid username, password and role."');
	}
	
	//search through users to see if we have one with that name
	var existingUserWithName = await utilities.find("users", {username: username});
	
	if(existingUserWithName && existingUserWithName[0]){
		return res.redirect(`/user/create?alert=A user with name ${username} already exists.`);
	}
	
	//hash password
	var hash = bcrypt.hashSync(password, salt);
	
	//create new user object
	var newUser = {
		username: username,
		password: hash,
		role: selectedRole
	}
	
	//insert new user
	var writeResult = await utilities.insert("users", newUser);
	
	res.redirect(`/user/create?alert=Created user ${username} successfully.`);
});

module.exports = router;