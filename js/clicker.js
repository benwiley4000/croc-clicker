$(function() {

	var model = {
		crocQueue: [
			{
				name: "Janet",
				url: "janet.jpg",
				source: "https://www.flickr.com/photos/montuschi/6011766251/"
			},
			{
				name: "Harry",
				url: "harry.jpg",
				source: "http://01.gatag.net/0002156-free-photo/"
			},
			{
				name: "Belinda",
				url: "belinda.jpg",
				source: "https://commons.wikimedia.org/wiki/File:American_Alligator_eating_Blue_Crab_2.JPG"
			},
			{
				name: "Freddy",
				url: "freddy.jpg",
				source: "https://www.flickr.com/photos/eirikl/10208820093"
			},
			{
				name: "Steve",
				url: "steve.jpg",
				source: "https://www.flickr.com/photos/bootbearwdc/19788289"
			}
		],
		init: function() {
			// initializes an array of croc data, pulls in crocs from queue, and stores it locally

			if(!localStorage.crocData) {
				var data = [];
				var q = model.crocQueue;
				for(var i = 0; i < q.length; i++) {
					var obj = q[i];
					data.push({
						name: obj.name,
						url: "images/" + obj.url,
						source: obj.source,
						clicks: 0
					});
				};
				localStorage.crocData = JSON.stringify(data);
			}
		},
		reset: function() {
			// clears storage and re-initializes

			localStorage.clear();
			model.init();
		},
		getAllCrocs: function() {
			// returns an array full of croc data
			return JSON.parse(localStorage.crocData);
		},
		click: function(index) {
			// increments the click count for the croc at the given index

			// increments clicks of current croc and place data back in local storage
			var data = model.getAllCrocs();
			if(index < data.length) {
				data[index].clicks++;
			}
			localStorage.crocData = JSON.stringify(data);
		},
		swapObj: function(dataObj, index) {
			// swaps in a whole new data object into stored array at given index; used by admin cheat mode

			var data = model.getAllCrocs();
			data[index] = dataObj;
			localStorage.crocData = JSON.stringify(data);
		}
	};

	var octopus = {
		levelBase: 7,
		getCrocs: function() {
			// returns array of croc data

			return model.getAllCrocs();
		},
		getData: function() {
			// fetch pieces of data necessary for croc rendering

			var data = model.getAllCrocs();
			var currentCroc = data[this.currIndex];

			// get name of current croc
			var name = currentCroc.name;

			// get url of current croc
			var url = currentCroc.url;

			// get source url for current croc
			var source;
			if(!currentCroc.hideSource) {
				source = currentCroc.source;
			} // otherwise goes null

			// get level of current croc
			var currLevel = this.currIndex + 1;

			// get clicks for current croc
			var currClicks = currentCroc.clicks;

			// calculate total clicks among all crocs
			var totalClicks = 0;
			for(var i = 0; i < data.length; i++) {
				totalClicks += data[i].clicks;
			}

			// calculate clicks needed to unlock next croc, and current level
			var ceil = octopus.levelBase;
			var levelUnlocked = 1;
			while(ceil <= totalClicks) {
				ceil *= octopus.levelBase;
				levelUnlocked++;
			}
			clicksToUnlock = ceil - totalClicks;
			if(levelUnlocked > data.length) {levelUnlocked = data.length;
			}

			// determine whether there are still crocs to be unlocked
			var allUnlocked = false;
			if(levelUnlocked === data.length) {
				allUnlocked = true;
			}

			var obj = {
				// full data array, info for current croc, and info for whole game
				"data": data,
				"name": name,
				"url": url,
				"source": source,
				"currLevel": currLevel,
				"currClicks": currClicks,
				"totalClicks": totalClicks,
				"clicksToUnlock": clicksToUnlock,
				"levelUnlocked": levelUnlocked,
				"allUnlocked": allUnlocked
			};

			return obj;
		},
		click: function() {
			// increments click count for current croc in model, and refreshes croc render

			model.click(this.currIndex);
			view.render();
		},
		changeCroc: function(index) {
			// switches current croc to a specified one

			this.currIndex = index;
			view.render();
		},
		modCroc: function(name, url, clicks) {
			// replaces current croc's entry in storage with modified one

			var croc = model.getAllCrocs()[this.currIndex];
			if(name.length > 0) {
				croc.name = name;
			}
			if(url.length > 0 && croc.url !== url) {
				croc.url = url;

				// source is irrelevant if data is swapped, so this hides it
				croc.hideSource = true;
			}
			if(!isNaN(clicks) && clicks.length > 0) {
				croc.clicks = parseInt(clicks);
			}
			model.swapObj(croc, this.currIndex);
			view.render();
		},
		reset: function () {
			// resets model and view

			model.reset();
			this.currIndex = 0;
			view.reset();
		},
		init: function() {
			// initializes model and view, sets current croc to first

			model.init();
			this.currIndex = 0;
			view.init();
		}
	};

	var view = {
		selectAudio: new Audio('audio/crocodile.ogg'),
		init: function() {
			// initializes the view

			// initializes highest level shown yet at 0. each time a new level is shown for the first time, the audio clip plays.
			this.levelRecord = 0;

			// render view
			view.render();

			// create listener for croc image to increase count on click
			$('#croc').click(function(e) {
				octopus.click();
			});

			// set reset button behavior
			$('#reset').click(function() {
				octopus.reset();
			});
		},
		reset: function() {
			// resets level record and renders, without repeating listeners in init method

			this.levelRecord = 0;
			view.render();
		},
		render: function() {

			var obj = octopus.getData();

			// plays new croc audio if a new one has appeared
			if(obj.levelUnlocked > this.levelRecord) {
				view.selectAudio.play();
				this.levelRecord = obj.levelUnlocked;
			}

			/* Main Croc render for Croc and its associated data */

			if($('#croc').length > 0) {
				$('#croc').attr("src", obj.url);
			} else {
				var img = $('<img id="croc">');
				img.attr("src", obj.url);
				$('#croc-box').append(img);
			}

			$('#name').text("Level " + obj.currLevel + ": " + obj.name);
			$('#curr-count').text(obj.currClicks);
			$('#total-count').text(obj.totalClicks);
			if(!obj.allUnlocked) {
				$('#countdown').show();
				$('#unlock-count').text(obj.clicksToUnlock);
			} else {
				// hides countdown if there is nothing to count down to
				$('#countdown').hide();
			}
			if(obj.source) {
				$('#source').attr("href", obj.source);
				$('#source').show();
			} else {
				$('#source').hide();
			}


			/* Selection sidebar render */

			// empty selector box
			$('#croc-selector').empty();

			// gets croc data
			var crocs = obj.data;

			// adds crocs to selector list
			var i = 0;

			// level check should be sufficient, but crocs length check is for safety
			while(i < crocs.length && i < obj.levelUnlocked) {
				var croc = crocs[i];

				// creates thumbnail
				var thumb = $('<div class="thumb"/>');

				// sets id for thumbnail
				thumb.attr('id', 'thumb' + i);
				
				// adds count overlay to displayed on hover
				var overlay = $('<div class="overlay"/>');
				overlay.append('<p>' + croc.name + '&nbsp;</p>');
				var counter = $('<p class="clicks">' + croc.clicks + '&nbsp;</p>');
				overlay.append(counter);
				thumb.append(overlay);

				// sets thumbnail background image
				thumb.css('background-image', 'url('+ croc.url + ')');

				// add listener for tile to switch crocs on click
				thumb.click((function(index) {
					return function() {
						octopus.changeCroc(index);
					};
				})(i));

				// adds thumbnail to selector list
				$('#croc-selector').append(thumb);
				
				i++;
			}

			// adds preview tile for next unlockable croc
			if(i < crocs.length) {
				var croc = crocs[i];

				// creates thumbnail
				var thumb = $('<div class="thumb"/>');
				
				// adds overlay featuring name of next unlockable croc
				var overlay = $('<div id="next" class="overlay"/>');
				overlay.append('<p>Next:&nbsp;</p>');
				overlay.append('<p>' + croc.name + '&nbsp;</p>');
				thumb.append(overlay);

				// adds thumbnail to selector list
				$('#croc-selector').append(thumb);
			}
		}
	};

	octopus.init();
});