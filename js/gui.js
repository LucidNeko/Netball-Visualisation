"use strict";

(function (self) {

	var currentYear = "all"
	var currentVis = "rivals"

	var onReady = function (data) {
		self.data = data;

        var width = 1000,
            height = 600;
		var svg = d3.select("#vis-svg")
					.attr("width", width)
					.attr("height", height)
                    .attr("transform", "translate(0,0)");

        self.onVisChange(currentVis);
	}

	self.onVisChange = function (label) {
		//clear the svg
		d3.select("#vis-svg").selectAll("*").remove();
		//display new visualisation
		switch(label) {
		case "rivals" :
			var rivals = netball.visuals.rivals;
            rivals.setup(self.data, d3.select("#vis-svg"));
			break;
		case "scores" :
			netball.visuals.scoreVis(self.data, d3.select("#vis-svg"), { year: currentYear });
			break;
		}
		currentVis = label;
	}

	self.onYearChange = function (year) {
		// console.log(year);
		currentYear = year;
		d3.select("#vis-svg").selectAll("*").remove();
		switch(currentVis) {
		case "rivals" :
            /*rivals.update(year);*/
			break;
		case "scores" :
			netball.visuals.scoreVis(self.data, d3.select("#vis-svg"), { year: currentYear });
			break;
		}
	}

	//calls onReady with the data once ready.
	netball.parser.loadData().then(function (data) {
		onReady(data);
	});

})(netball.gui = netball.gui || {});
