const express = require("express");
const router = express.Router();
const utilities = require('../utilities');

router.get('/', async function(req, res){
	if(!require('./checkauthentication')(req, res, 3)) return null; //Auth check for admin
	
	res.render('admin/admin', {
		title: "Admin Hompeage"
	});
});

module.exports = router;