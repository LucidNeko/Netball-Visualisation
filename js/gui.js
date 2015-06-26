"use strict";

(function (self) {

	var onReady = function (data) {
		self.data = data;

        var width = 1000,
            height = 600;
		var svg = d3.select("#vis-svg")
					.attr("width", width)
					.attr("height", height)
                    .attr("transform", "translate(0,0)");

        // netball.visuals.scoreVis(data, svg);
        // netball.visuals.rivals(data, svg);
        self.onRival();
	}

	self.onScore = function () {
		self.clearSVG();
		d3.select("#vis-svg")
		netball.visuals.scoreVis(self.data, d3.select("#vis-svg"));
	}

	self.onRival = function () {
		self.clearSVG();
		d3.select("#vis-svg")
		netball.visuals.rivals(self.data, d3.select("#vis-svg"));
	}

	self.clearSVG = function () {
		d3.select("#vis-svg").selectAll("*").remove()
	}

	//calls onRead with the data once ready.
	netball.parser.loadData().then(function (data) {
		onReady(data);
	});

})(netball.gui = netball.gui || {});
