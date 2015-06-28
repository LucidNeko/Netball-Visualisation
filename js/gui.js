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

        //load images
        var head = d3.select("#team-logo-container");

        netball.data.getTeamImages().forEach(function (imageName) {
        	head.append("img")
        		.attr("class", "team-logo")
        		.attr("src", "img/team/" + imageName)
        		.attr("title", imageName.substring(0, imageName.length -4));
        });

        //add tooltip

        self.giveToolTip(".team-logo");
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

	self.giveToolTip = function (selector) {
		//jquery adapted from: http://stackoverflow.com/questions/6629294/tooltip-jquery

        $(selector).mouseover(function(e) { // no need to point to 'rel'. Just if 'a' has [title] attribute.

                tip = $(this).attr('title'); // tip = this title
                $(this).attr('title','');    // empty title
                $('.tooltip').fadeTo(300, 0.9).children('.tipBody').html( tip ); // fade tooltip and populate .tipBody

            }).mousemove(function(e) {

                $('.tooltip').css('top', e.pageY + 10 ); // mouse follow!
                $('.tooltip').css('left', e.pageX + 20 );

            }).mouseout(function(e) {
                $('.tooltip').hide(); // mouseout: HIDE Tooltip (do not use fadeTo or fadeOut )
                $(this).attr( 'title', tip ); // reset title attr
            });
	}

	//calls onReady with the data once ready.
	netball.parser.loadData().then(function (data) {
		onReady(data);
	});

})(netball.gui = netball.gui || {});
