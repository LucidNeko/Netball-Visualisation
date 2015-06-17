"use strict";

(function (self) {

	var onReady = function (data) {
		var svg = d3.select("body").append("svg")
					.attr("width", 500)
					.attr("height", 500);

		console.log(data[10]);

		data.map(function (entry) {
			if(entry.byes) {
				console.log(entry);
			}
		});
	}

	//calls onReady with the data once ready.
	netball.parser.loadData().then(function (data) {
		onReady(data);
	});

})(netball.gui = netball.gui || {});