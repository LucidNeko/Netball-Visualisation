"use strict";
// http://bl.ocks.org/mbostock/3883245
(function(self){

    var margin = {top: 20, right: 20, bottom: 30, left: 50};

    // assume svg is blank
    self.scoreVis = function (data, svg, settings){

            var width = svg.attr("width") - margin.left - margin.right,
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

        // add legend
        //
    }

    self.rivals = function (data, svg, settings) {

        var force = d3.layout.force()
            .charge(-300)
            .size([svg.attr("width") - margin.left - margin.right,
                svg.attr("height") - margin.top - margin.bottom]);

        var teams = netball.data.getTeams(data);
        var teamNames = netball.data.getTeamNames();

        // make links
        var links = [];
        teams.forEach( function (team, index){
            for (var opponentName in team.opponents){
                var opponent = team.opponents[opponentName];
                var sourceIndex = index;
                var targetIndex = teamNames.indexOf(opponentName);

                // if link is not already made, add to links
                if ((sourceIndex !== targetIndex) &&
                    !containsLink(links, {source: sourceIndex, target: targetIndex })){
                    links.push({
                        source: sourceIndex,
                        target: targetIndex, 
                        wLRatio: opponent.ratio
                    });
                }
            }
        });

        force.linkDistance(function (link){
            // wl ratio of totally even is 0.5
            // so we get distance to 0.5 
            var difference = Math.abs(link.wLRatio - 0.5) * 2;

            // console.log("#" + link.source.index + "-circle");

            var srcRad = +svg.select("#circle-" + link.source.index).attr("r");
            var targetRad = +svg.select("#circle-" + link.target.index).attr("r");

            var minDist = srcRad + targetRad;
            var maxDist = 500;

            var scale = d3.scale.linear().domain([0, 1]).range([minDist, maxDist]);
            var scaled = scale(difference);
            console.log(link.source.name + " <-> " + link.target.name
                + "\nMin Dist: " + minDist
                + "\nActual Dist: " + scaled
                + "\nDiff: " + difference);
            return scaled;
        });

        force.linkStrength(1.0);

        force.nodes(teams);
        force.links(links);

        var node = svg.selectAll(".team")
            .data(teams)
          .enter().append("g")
            .attr("class", "team")

        // max radius of a team circle
        var maxR = 100;

        node.append("circle")
            .attr("class", "team-node-circle")
            .attr("r", function (team) {
                return team.ratio * maxR;
            })
            .attr("fill", function (d) {
                return d3.rgb(Math.random()*255, Math.random()*255, Math.random()*255).toString();
            })
            .attr("id", function (d, i) {
                return "circle-" + i;
            });


        node.call(force.drag);

        node.append("text")
            .attr("class", "team-node-text")
            .text(function (team){
                return team.name;
            });

        var link = svg.selectAll(".link")
            .data(links)
          .enter().append("text")
            .attr("class", "link")
            .text( function (link) {
                return parseFloat(link.wLRatio).toFixed(2);
            });

        // after the force layout's calculations are done?
        force.on("tick", function () {
            // move teams to right place
            svg.selectAll(".team-node-circle")
                .attr("cx", function (d) {
                    return d.x;
                })
                .attr("cy", function (d) {
                    return d.y;
                });

            svg.selectAll(".team-node-text")
                .attr("x", function (d){
                    return d.x;
                })
                .attr("y", function (d) {
                    return d.y;
                });

            // svg.selectAll(".link")
            //     .attr("x", function (d){
            //         return Math.abs((d.source.x + d.target.x)/2);
            //     })
            //     .attr("y", function (d){
            //         return Math.abs((d.source.y + d.target.y)/2);
            //     });
        });

        force.start();
    }

    // returns true if links contains an equivilent link
    function containsLink(links, link){
        for (var i = 0; i < links.length; i++){
            var elem = links[i];
            if ((elem.source === link.source && elem.target === link.target) ||
                (elem.source === link.target && elem.target === link.source))
                return true;
        }
        return false;
    }

})(netball.visuals = netball.visuals || {});