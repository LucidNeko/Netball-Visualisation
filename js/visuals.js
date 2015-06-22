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
            // .charge(-40)
            .linkDistance(100)
            .size([svg.attr("width") - margin.left - margin.right,
                svg.attr("height") - margin.top - margin.bottom]);

        var teams = netball.data.getTeams(data);
        var teamNames = netball.data.getTeamNames();

        // make links
        var links = [];
        teams.forEach( function (team, index){
            for (var opposing in team.opponents){
                var sourceIndex = index;
                var targetIndex = teamNames.indexOf(opposing);

                // if link is not already made, add to links
                if (!containsLink(links, {source: sourceIndex, target: targetIndex })){
                    links.push({
                        source: sourceIndex,
                        target: targetIndex, 
                        wLRatio: opposing.ratio
                    });
                }
            }
        });

        force.nodes(teams);
        force.links(links);

        var node = svg.selectAll(".team")
            .data(teams)
          .enter().append("g")
            .attr("class", "team");

        node.call(force.drag);

        // max radius of a team circle
        var maxR = 100;

        node.append("circle")
            .attr("class", "team-node-circle")
            .attr("r", function (team) {
                return team.ratio * maxR;
            });
            // todo: call(force.drag) to allow for dragging of the nodes

        node.append("text")
            .attr("class", "team-node-text")
            .text( function (team){
                return team.name;
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
                    return d.x - svg.select(this).attr("r");
                })
                .attr("y", function (d) {
                    return d.y;
                });
        });

        force.start();

    }

    // returns true if links contains an equivilent link
    function containsLink(links, link){
        links.forEach( function (elem) {
            if ((elem.source === link.source && elem.target === link.target) ||
                (elem.source === link.target && elem.target === link.source))
                return true;
        });
        return false;
    }

})(netball.visuals = netball.visuals || {});