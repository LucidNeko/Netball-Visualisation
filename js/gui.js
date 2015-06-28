"use strict";

(function (self) {

	var settings = {
		year: "all",
		visualisation: "rivals"
	}

	var onReady = function (data) {
		self.data = data;

        var width = 1000,
            height = 800;
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
            var score = netball.visuals.scoreVis;
			score.setup(self.data, d3.select("#vis-svg"), settings);
			break;
		case "courts" :
			netball.visuals.courts.setup(self.data, d3.select("#vis-svg"), settings);
			break;
		}
	}

	self.onYearChange = function (year) {
        // if year is number string, convert to number
		settings.year = year == "all" ? year : +year;
		// d3.select("#vis-svg").selectAll("*").remove();
		switch(settings.visualisation) {
		case "rivals" :
            netball.visuals.rivals.update(settings);
			break;
		case "scores" :
			netball.visuals.scoreVis.update(settings);
			break;
		case "courts" :
			netball.visuals.courts.update(settings);
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
