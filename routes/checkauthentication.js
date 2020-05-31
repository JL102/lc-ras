var passport = require('passport');

var utilities = require("../utilities");

/** For each scouter or admin page, this function exists to check
 *  if a user is logged in. 
 * @param req Express IncomingRequest
 * @param res Express OutgoingResponse
 * @param accessLevel (int) Access level of page. (e.g.: 1 for users, 2 for editors, 3 for admins)
 * 
 USE:
 At the start of each non-public page, copy one of these:

	if(!require('./checkauthentication')(req, res)) return null; //Authentication check.
	
IF THE ROUTE EXISTS WITHIN A SUBFOLDER: Use '../checkauthentication' 
because it has to backtrack one folder. 

 */
module.exports = async function(req, res, accessLevel){
		
	//if dev server AND NOT LOGGED IN, always return true.
	if(req.app.isDev && !req.user){
		return true;
	}
	
	//Check if user is logged in
	if(req.user){
		
		var thisUser = req.user;
		//Default is -1, is changed when we find a role matching this user's type.
		var thisUserAccessLevel = -1;
		
		var rolesList = await utilities.find("roles");
		
		for(var i in rolesList){
			var role = rolesList[i];
			
			//If role matches, then grab the access level.
			if(role.role == thisUser.role){
				thisUserAccessLevel = role.access_level;
			}
		}
		
		//If user's access level is equal to or greater than that to which the page allows, then allow and log.
		if(thisUserAccessLevel >= accessLevel){
			res.log(`Granting user ${thisUser.username} (${thisUser.role}) to page ${req.path} (Access level ${thisUserAccessLevel} >= ${accessLevel})`, true, "green");
			return true;
		}
		//Otherwise, reject and log.
		else{
			res.log(`Rejecting user ${thisUser.username} (${thisUser.role}) from page ${req.path} (Access level ${thisUserAccessLevel} < ${accessLevel})`, true, "red");
			return false;
		}
	}
	else{
		
		//If user isn't logged in, then redirect to homepage w/ message
        return res.status(401).redirect('/?alert=Not authorized to access this page.');
	}
}