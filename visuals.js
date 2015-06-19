// http://bl.ocks.org/mbostock/3883245
(function(self){
    // assume svg is blank
    self.scoreVis = function (data, svg, settings){

        var margin = {top: 20, right: 20, bottom: 30, left: 50},
            width = svg.attr("width") - margin.left - margin.right,
            height = svg.attr("height") - margin.top - margin.bottom;

        var g = svg.append("g")
            .attr("class", "score-vis")
            .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

        var x = d3.time.scale()
            .range([0, width]);

        var y = d3.scale.linear()
            .range([0, height]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(d3.time.month);

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var line = d3.svg.line()
            .x(function (d) { return x(d.date); })
            .y(function (d) { return y(d.score.thisTeam); });

        x.domain(d3.extent(data, function (d) { return d.date; }));
        y.domain([
            d3.max(data.map(function (d) {
                return Math.max(d.score.home, d.score.away)
            })),
            d3.min(data.map(function (d){
                return Math.min(d.score.home, d.score.away)
            }))
          ]);

        g.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate (0, " + height + ")")
            .call(xAxis);

        g.append("g")
            .attr("class", "y axis")
            //.attr("transform", "translate (" + margin.left + ", 0)")
            .call(yAxis)
                .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Score");

        var lines = g.append("g")
            .attr("class", "lines");

        // data arranged into teams
        var teamGames = netball.data.teamGames(data);

        // make line for each team
        // TODO: do this without loop?
        teamGames.forEach(function (team) {
            lines.append("g")
                .append("path")
                .datum(team)
                .attr("class", "line")
                .attr("d", line)
                .attr("stroke", d3.rgb(Math.random()*255, Math.random()*255, Math.random()*255).toString());
        });
    }
})(netball.visuals = netball.visuals || {});
