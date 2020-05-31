const express = require("express");
const router = express.Router();

const utilities = require("../utilities");

router.get('/ras', async function(req, res){
	if(!require('./checkauthentication')(req, res, 2)) return null; //Auth check for editor
	
	var categoryLayout = await utilities.find("categorylayout", {}, {sort: {categoryNum: 1}});
	
	//Going to add the listings to categories
	var listingsByCategory = categoryLayout;
	
	//create listings sub array in each category
	for(var i in listingsByCategory) listingsByCategory[i].listings = [];
	
	var listings = await utilities.find("raslist", {}, {sort: {category_num: 1}});
	
	for(var i in listings){
		var listing = listings[i];
		
		//index in array is num - 1
		var categoryIdx = listing.category_num - 1;
		
		listingsByCategory[categoryIdx].listings.push(listing);
	}
	
	res.render('editras', {
		title: "Edit RAS page",
		listingsByCategory: listingsByCategory
	});
});

router.post('/ras', async function(req, res){
	if(!require('./checkauthentication')(req, res, 2)) return null; //Auth check for editor
	
	var rawData = req.body;
	
	var sortedData = [];
	
	var currentDataIdx;
	
	var indicesToDelete = [];
	
	for(var i in rawData){
		var thisElementName = i;
		var thisElement = rawData[i];
		var split = thisElementName.split("_");
		
		var thisCategoryNum = parseInt(split[0]);
		var thisListingID = split[1];
		var thisElementType = split[2];
		
		currentDataIdx = thisListingID;
		
		if(!sortedData[currentDataIdx] || !sortedData[currentDataIdx].data){
			sortedData[currentDataIdx] = {
				data: {}
			};
		}
		
		//Filter thisElementType to avoid malicious data insertion.
		switch(thisElementType){
			case "creator":
			case "creatorlink":
			case "discord":
			case "icon":
			case "weblink":
			case "servername":
			case "address":
			case "status":
			case "desc":
				//Insert data into sortedData element.
				sortedData[currentDataIdx].data[thisElementType] = thisElement;
				break;
			case "delete":
				console.log(`Deleting ${currentDataIdx}`);
				indicesToDelete.push(currentDataIdx);
				break;
			default:
				res.log(`Invalid data sent to /editor/ras: ${thisElementName}: ${thisElement}`);
		}
		
		//Set "category_num" to thisCategoryNum
		sortedData[currentDataIdx].category_num = thisCategoryNum;
	}
	
	//Delete whatever is marked for deletion
	if (indicesToDelete.length > 0) {
		for (var index of indicesToDelete) {
			sortedData.splice(index, 1);
		}
	}
	
	//Now, sortedData might have empty elements. Fix that by creating new filteredData w/o the empty items.
	var filteredData = [];
	
	for(var i in sortedData){
		//if data at this index exists, push into filteredData
		if(sortedData[i]){
			
			var sortedDatum = sortedData[i].data;
			//default: (when everything empty) don't add to filtereddata
			var willAddToFilteredData = false;
			
			for(var j in sortedDatum){
				
				console.log(j)
				console.log(sortedDatum[j]);
				//If any item is not empty, then set addToFD to true
				if( !(sortedDatum[j] == "" || !sortedDatum[j]) && j != "status" ){
					willAddToFilteredData = true;
				}
			}
			
			//push to array thang
			if(willAddToFilteredData){
				filteredData.push(sortedData[i]);
			}
			
		}
	}
	
	//Remove data from raslist
	await utilities.remove("raslist");
	
	//Now, insert new data into raslist
	await utilities.insert("raslist", filteredData);
	
	res.redirect('/editor/ras');
});

module.exports = router;