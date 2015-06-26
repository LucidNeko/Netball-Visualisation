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

        var colour = d3.scale.category20();

        // make line for each team
        // TODO: do this without loop?
        teamGames.forEach(function (team) {
            lines.append("g")
                .append("path")
                .datum(team)
                .attr("class", "line")
                .attr("d", line)
                .attr("stroke", colour(team));
        });

        // add legend
        //
    }

    self.rivals = (function (self) {

        // max radius of a team circle
        var maxR = 100;

        // stores important objects and creates svg elements
        // and sets non-changing settings
        self.setup = function (data, svg, settings) {

            self.svg = svg;
            self.force = d3.layout.force()
                .charge(-50)
                .size([svg.attr("width") - margin.left - margin.right,
                    svg.attr("height") - margin.top - margin.bottom]);

            self.teams = netball.data.getTeams(data);
            self.teamNames = netball.data.getTeamNames();

            var node = svg.selectAll(".team")
                .data(self.teams)
              .enter().append("g")
                .attr("class", "team noselect")
                .attr("id", function (d, i){
                    return "team-"+i;
                })
                .on("click", function(d){
                    self.singleTeamView(d);
                });

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

            node.append("text")
                .attr("class", "team-node-text")
                .text(function (team){
                    return team.name;
                });

            node.call(self.force.drag);

            // default view for this force layout
            self.fullTeamView();
            // starts the force physics
            self.force.start();
        }

        // show rivalries between all teams at once
        self.fullTeamView = function (){
            // make links
            var links = [];
            self.teams.forEach( function (team, index){
                for (var opponentName in team.opponents){
                    var opponent = team.opponents[opponentName];
                    var sourceIndex = index;
                    var targetIndex = self.teamNames.indexOf(opponentName);

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

            self.force.linkDistance(function (link){
                // wl ratio of totally even is 0.5
                // so we get distance to 0.5 represented in range 0 - 1
                var difference = ratioToDifference(link.wLRatio);

                // radii of circles
                var srcRad = +self.svg.select("#circle-" + link.source.index).attr("r");
                var targetRad = +self.svg.select("#circle-" + link.target.index).attr("r");

                var minDist = srcRad + targetRad;
                var maxDist = 500;

                // scale difference in wl ratio to distance apart
                var scale = d3.scale.linear().domain([0, 1]).range([minDist, maxDist]);
                var scaled = scale(difference);

                // console.log(link.source.name + " <-> " + link.target.name
                //     + "\nMin Dist: " + minDist
                //     + "\nActual Dist: " + scaled
                //     + "\nDiff: " + difference);

                return scaled;
            });

            // reset mouse listeners on nodes
            self.svg.selectAll(".team")
                .on("mouseover", null)
                .on("mouseout", null);

            self.force.linkStrength(1.0);

            // bind nodes and links to the force graph
            self.force.nodes(self.teams);
            self.force.charge(-150);
            self.force.links(links);
            self.force.gravity(0.1);

            self.force.on("tick", function () {
                // move teams to right place
                self.svg.selectAll(".team-node-circle")
                    .attr("cx", function (d) {
                        return d.x;
                    })
                    .attr("cy", function (d) {
                        return d.y;
                    });

                self.svg.selectAll(".team-node-text")
                    .attr("x", function (d){
                        return d.x;
                    })
                    .attr("y", function (d) {
                        return d.y;
                    });
            });

        }

        // changes vis to be centered on one team
        // team param is the name of a team
        self.singleTeamView = function (team) {
            // links change to only be to chosen team
            var teamIndex = self.teamNames.indexOf(team.name);
            var selector = "#team"+teamIndex;

            var links = [];
            self.teams.forEach( function (otherTeam, index){
                if (otherTeam.name === team.name) return;
                links.push({
                    source: index,
                    target: teamIndex
                });
            });

            self.force.links(links);
            self.force.linkDistance(200);
            self.force.charge(-500);
            self.force.gravity(0.01);

            // change size of circles to be win loss
            // vs chosen team
            self.svg.selectAll(".team-node-circle")
                .transition()
                .ease("bounce")
                .duration(800)
                .attr("r", function (d){
                    // don't change central team circle's radius
                    if (d.name !== team.name){
                        var thisTeam = getTeam(self.teams, d.name);
                        var ratio = thisTeam.opponents[team.name].ratio;
                        return ratio * maxR;
                    } else {
                        // (what it used to be)
                        return d.ratio * maxR;
                    }
                });

            self.svg.selectAll(".force-line").remove();

            // add lines (invisible at first)
            var line = self.svg.selectAll(".force-line")
                .data(self.force.links())
              .enter().append("line")
                .attr("class", "force-line")
                .attr("id", function (d, i){
                    return "force-line-" + d.source;
                })
                .style("stroke", "black")
                .style("stroke-width", function (d){
                    return d.wLRatio;
                })
                .style("opacity", "0");

            // add mouse listening
            var node = self.svg.selectAll(".team:not("+selector+")")
                .on("mouseover", function(d, i){
                    var linkLine = self.svg.select("#force-line-"+d.index);
                    linkLine.transition()
                        .style("opacity", "1");
                })
                .on("mouseout", function (d, i){
                    var linkLine = self.svg.select("#force-line-"+d.index);
                    linkLine.transition()
                        .style("opacity", "0");
                });

            self.force.on("tick", function (){
                line.attr("x1", function(d) { return d.source.x; })
                        .attr("y1", function(d) { return d.source.y; })
                        .attr("x2", function(d) { return d.target.x; })
                        .attr("y2", function(d) { return d.target.y; });

                // copied from above
                // move teams to right place
                self.svg.selectAll(".team-node-circle")
                    .attr("cx", function (d) {
                        return d.x;
                    })
                    .attr("cy", function (d) {
                        return d.y;
                    });

                self.svg.selectAll(".team-node-text")
                    .attr("x", function (d){
                        return d.x;
                    })
                    .attr("y", function (d) {
                        return d.y;
                    });
            });

            self.force.start();
        }

        return self;
    })({});

    // wl ratio of totally even is 0.5
    // so we get distance to 0.5 represented in range 0 - 1
    function ratioToDifference(ratio) {
        return Math.abs(ratio - 0.5) * 2;
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

    // get team from teams array given a name
    function getTeam(teams, teamName){
        var team;
        teams.forEach(function (elem){
            if (elem.name === teamName)
                team = elem;
        });
        return team;
    }

})(netball.visuals = netball.visuals || {});
