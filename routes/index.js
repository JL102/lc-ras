const express = require("express");
const router = express.Router();
const utilities = require("../utilities");

router.get('/', async function(req, res){
	
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
	
	res.render('ras', {
		title: "LockedCraft Related Alternative Servers",
		description:  "A listing of servers related to, similar to, suggested by the players of, and/or derivative of, the now-defunct LockedCraft server.",
		previewImg: "https://i.imgur.com/mB17FW9.png",
		listingsByCategory: listingsByCategory
	})
});

module.exports = router;