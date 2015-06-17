"use strict";

(function (self) {

	var onReady = function (data) {
		var svg = d3.select("body").append("svg")
					.attr("width", 500)
					.attr("height", 500)
                    .attr("transform", "translate(0,0)");

        netball.visuals.scoreVis(data, svg);
	}

	//calls onRead with the data once ready.
	netball.parser.loadData().then(function (data) {
		onReady(data);
	});

})(netball.gui = netball.gui || {});
