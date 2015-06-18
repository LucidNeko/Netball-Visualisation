(function(self){
    // assume svg is blank
    self.scoreVis = function (data, svg, settings){

        var margin = {top: 20, right: 20, bottom: 30, left: 50},
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        var x = d3.time.scale()
            .range([0, width]);

        var y = d3.scale.linear()
            .range([0, height]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("left");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("bottom");

        var line = d3.svg.line()
            .x(function (d) { return x(d.date); })
            .y(function (d) { return y(d.score.home); });

        x.domain(d3.extent(data, function (d) { return d.date; }));
        y.domain(d3.extend(data, function (d) { return d.score.home; }));

        svg.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", line);

    }
})(netball.visuals = netball.visuals || {});
