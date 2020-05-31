const monk = require("monk");
const fs = require("fs");

var utilities = module.exports = {};

/**
 * One-time function that returns Monk DB, with specified DB string name.
 * @param {string} dbName name of DB
 * @return {*} Monk db
 */
utilities.getDB = function(dbName){
	
	//check if we have a db user file
	var hasDBUserFile = fs.existsSync(".dbuser");
	var db;
	
	if(hasDBUserFile){
		var dbUser = JSON.parse(fs.readFileSync(".dbuser", {"encoding": "utf8"}));
		console.log(dbUser);
		console.log(`${dbUser.username}:${dbUser.password}@localhost:27017/${dbName}`);	
		db = monk(`${dbUser.username}:${dbUser.password}@localhost:27017/${dbName}`);	
	}
	else{
		db = monk(`localhost:27017/${dbName}`);			//Local db on localhost without authentication
	}
	
	return db;
}

var db = utilities.getDB("lc_ras");

/**
 * Asynchronous "find" function to a collection specified in first parameter.
 * @param collection [String] Collection to find in.
 * @param parameters [Object] Query parameters.
 * @param options [Object] Query options, such as sort.
 */
utilities.find = async function(collection, parameters, options){
	
	//If the collection is not specified and is not a String, throw an error.
	//This would obly be caused by a programming error.
	if(typeof(collection) != "string"){
		throw new Error("Collection must be specified.");
	}
	//If query parameters are not set, create an empty object for the DB call.
	if(!parameters){
		var parameters = {};
	}
	//If parameters exists and is not an object, throw an error. 
	if(typeof(parameters) != "object"){
		throw new Error("Utilities.find Error: Parameters must be of type object");
	}
	//If query options are not set, create an empty object for the DB call.
	if(!options){
		var options = {};
	}
	//If options exists and is not an object, throw an error.
	if(typeof(options) != "object"){
		throw new Error("Utilities.find Error: Options must be of type object");
	}
	
	//Get collection
	var Col = db.get(collection);
	//Find in collection with parameters and options
	var data = [];
	data = await Col.find(parameters, options);
	
	//Return (Promise to get) data
	return data;
}


/**
 * Asynchronous "remove" function to a collection specified in first parameter.
 * @param collection [String] Collection to remove from.
 * @param parameters [Object] Query parameters (Element/s to remove).
 */
utilities.remove = async function(collection, parameters){
	
	//If the collection is not specified and is not a String, throw an error.
	//This would obly be caused by a programming error.
	if(typeof(collection) != "string"){
		throw new Error("Collection must be specified.");
	}
	//If query parameters are not set, create an empty object for the DB call.
	if(!parameters){
		var parameters = {};
	}
	//If parameters exists and is not an object, throw an error. 
	if(typeof(parameters) != "object"){
		throw new Error("Utilities.find Error: Parameters must be of type object");
	}
	
	//Get collection
	var Col = db.get(collection);
	//Remove in collection with parameters
	var writeResult;
	writeResult = await Col.remove(parameters);
	
	//return writeResult
	return writeResult;
}

/**
 * Asynchronous "insert" function to a collection specified in first parameter.
 * @param collection [String] Collection to insert into.
 * @param parameters [Any] Element or array of elements to insert
 */
utilities.insert = async function(collection, elements){
	
	//If the collection is not specified and is not a String, throw an error.
	//This would obly be caused by a programming error.
	if(typeof(collection) != "string"){
		throw new Error("Collection must be specified.");
	}
	//If query parameters are not set, create an empty object for the DB call.
	if(!elements){
		throw new Error("Must contain an element or array of elements to insert.");
	}
	
	//Get collection
	var Col = db.get(collection);
	//Insert in collection
	var writeResult;
	writeResult = await Col.insert(elements);
	
	//return writeResult
	return writeResult;
}
