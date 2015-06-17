(function (self) {

	var dataFiles = [ "data/2008-Table1.csv", 
					  "data/2009-Table1.csv", 
					  "data/2010-Table1.csv", 
					  "data/2011-Table1.csv", 
					  "data/2012-Table1.csv",
					  "data/2013-Table1.csv" ];

	var getYearFromFilename = function (filename) {
		return filename.substring(5, 9);
	}

	//camelcode. Converts str into camelcase.
	//http://stackoverflow.com/
	//questions/2970525/converting-any-string-into-camel-case
	var camelize = function (str) {
		return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
			return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
		}).replace(/\s+/g, '');
	}

	var getFields = function (data) {
		var fields = [];

		data.forEach(function (entry) {
			for(var key in entry) {
				if(fields.indexOf(key) == -1) {
					fields.push(key);
				}
			}
		});

		return fields;
	}

	var formatEntry = function (filename, entry) {
		//Remove time property
		delete entry.Time;

		//make all properties camelcase
		for(var key in entry) {
			var camelKey = camelize(key.toLowerCase());
			if(key !== camelKey) { //if the key wasn't already camelcase
				entry[camelKey] = entry[key];
				delete entry[key];
			}
		}

		//add a year property
		entry.year = getYearFromFilename(filename);

		//Is it a BYES??
		entry.byes = entry.date.startsWith("BYES");

		//If it's BYES
		if(entry.byes) {

			var byesReg = new RegExp("BYES:\\s*")

			var teams = entry.date.replace(byesReg, "").split(" and ");
			entry.homeTeam = teams[0];
			entry.awayTeam = teams[1];
			entry.date = ""; //contained BYES information

			for(var key in entry) {
				if(entry[key] === "" || entry[key] === undefined) {
					entry[key] = undefined;
				}
			}
		}

		//extract score
		if(!entry.byes) {
			var scores = entry.score.match(/\d+/g);
			entry.score = { home: +scores[0], away: +scores[1] }; 
		}

		if(!entry.byes) {
			var dateString = entry.date.match(/\d+.*/);
			entry.date = dateString[0]; //grab first element of match array
			entry.date = entry.date.concat(", ").concat(entry.year);
			entry.date = new Date(entry.date);
		}

		//make numbers
		entry.round = +entry.round;
		entry.year = +entry.year;

		return entry;
	};

	self.loadData = function () {
		return Promise.all(dataFiles.map(function (filename) {
			return new Promise(function (resolve) {
				d3.csv(filename, resolve);
			}).then(function (data) {
				return data.map(function (entry) {
					return formatEntry(filename, entry);
				});
			});
		})).then(function (lists) {
			return Array.prototype.concat.apply([], lists);
		});
	};



})(netball.parser = netball.parser || {});