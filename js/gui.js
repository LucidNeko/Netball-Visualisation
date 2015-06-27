"use strict";

(function (self) {

	var settings = {
		year: "all",
		visualisation: "rivals"
	}

	var onReady = function (data) {
		self.data = data;

        var width = 1000,
            height = 600;
		var svg = d3.select("#vis-svg")
					.attr("width", width)
					.attr("height", height)
                    .attr("transform", "translate(0,0)");

        self.onVisChange(settings.visualisation);
	}

	self.onVisChange = function (label) {
		//update settings
		settings.visualisation = label;
		//clear the svg
		d3.select("#vis-svg").selectAll("*").remove();
		//display new visualisation
		switch(settings.visualisation) {
		case "rivals" :
			var rivals = netball.visuals.rivals;
            rivals.setup(self.data, d3.select("#vis-svg"), settings);
			break;
		case "scores" :
			netball.visuals.scoreVis(self.data, d3.select("#vis-svg"), settings);
			break;
		}
	}

	self.onYearChange = function (year) {
		// console.log(year);
		settings.year = year;
		d3.select("#vis-svg").selectAll("*").remove();
		switch(currentVis) {
		case "rivals" :
            netball.visuals.rivals.update(settings);
			break;
		case "scores" :
			netball.visuals.scoreVis(self.data, d3.select("#vis-svg"), settings);
			break;
		}
	}

	self.onTeamSelectionChange = function (div) {
		//div contains all the team selectables
		
	}

	//calls onReady with the data once ready.
	netball.parser.loadData().then(function (data) {
		onReady(data);
	});

})(netball.gui = netball.gui || {});
