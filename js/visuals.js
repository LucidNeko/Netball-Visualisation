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
            .ticks(settings.year === "all" ? d3.time.year : d3.time.month);

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
        self.setup = function (games, svg, settings) {

            self.games = games;
            self.svg = svg;
            self.force = d3.layout.force()
                .charge(-50)
                .size([svg.attr("width") - margin.left - margin.right,
                    svg.attr("height") - margin.top - margin.bottom]);

            self.teams = netball.data.getTeams(games, settings.year);
            self.teamNames = netball.data.getTeamNames();

            var colour = d3.scale.category20();

            var node = svg.selectAll(".team")
                .data(self.teams)
              .enter().append("g")
                .attr("class", "team noselect")
                .attr("id", function (d, i){
                    return "team-"+i;
                })
                .on("click", function(d){
                    self.singleTeamView(d);
                })
                .on("mouseover.wl", function (d){
                    var parent = self.svg.select("#" + this.id);
                    addWLText(parent);
                })
                .on("mouseout.wl", function(d){
                    node.select("#wl-tip").remove();
                });

            node.append("circle")
                .attr("class", "team-node-circle")
                .attr("r", function (team) {
                    return team.ratio * maxR;
                })
                .attr("fill", function (d) {
                    return colour(d.name);
                })
                .attr("id", function (d, i) {
                    return "circle-" + i;
                });

            node.append("text")
                .attr("class", "team-node-text")
                .text(function (team){
                    return team.name;
                })
                .attr("y", function (team){
                    var r = team.ratio * maxR;
                    return -(r + 3);
                });

            // add nodes to the graph
            self.force.nodes(self.teams);

            node.call(self.force.drag);

            // default view for this force layout
            self.fullTeamView();
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

            self.svg.selectAll(".team-node-circle")
                .transition()
                .duration(800)
                .ease("cubic-out")
                .attr("r", function (d){
                    return d.ratio * maxR;
                });

            // remove possible old elements
            self.svg.selectAll(".force-line").remove();
            self.svg.select("#back-button").remove();

            // reset mouse listeners on nodes
            self.svg.selectAll(".team")
                .on("mouseover", null)
                .on("mouseout", null);

            self.force.linkStrength(1.0);

            // bind nodes and links to the force graph
            self.force.links(links);
            self.force.charge(-150);
            self.force.gravity(0.1);

            self.force.on("tick", function () {
                // move teams to right place
                defaultTick();
            });

            // start the simulation
            self.mode = "fullTeamView";
            self.force.start();
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

            // remove old lines
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
                defaultTick();
                line.attr("x1", function(d) { return d.source.x; })
                        .attr("y1", function(d) { return d.source.y; })
                        .attr("x2", function(d) { return d.target.x; })
                        .attr("y2", function(d) { return d.target.y; });

            });

            // remove old stuff
            self.svg.select("#back-button").remove();

            // add back button
            var back = self.svg.append("g")
                .attr("id", "back-button")
                .attr("transform", "translate(" + 50 + ", " + 50 + ")")
                .on("click", function(){
                    self.fullTeamView();
                });

            back.append("rect")
                .attr("width", 50)
                .attr("height", 25)
                .style("opacity", 0.3);

            back.append("text")
                .attr("id", "back-button-text")
                .text("Back")
                .attr("x", 5)
                .attr("y", 15);

            // start the simulation
            self.singleTeam = team;
            self.mode = "singleTeamView";
            self.force.start();
        }

        // trigger an update on the vis.
        // add or remove teams / years
        self.update = function(settings){
            var year = settings.year;
            self.teams = netball.data.getTeams(self.games, year);
            if (self.mode === "fullTeamView")
                self.fullTeamView();
            else if (self.mode === "singleTeamView")
                self.singleTeamView(self.singleTeam);
        }

        function defaultTick(){
            self.svg.selectAll(".team")
                .attr("transform", function (d) {
                    return "translate( " + d.x + ", " + d.y + ")";
                });
        }

        function addWLText(parent){
            var wLText = parent.append("g")
                .attr("id", "wl-tip");

            var gap = 10,
                textLength = 15,
                textHeight = 14;

            wLText.append("text")
                .attr("class", "wl-text")
                .attr("id", "win-text")
                .text(function (d){
                    return d.wins + "\t";
                })
                .attr("x", -gap/2 - textLength)
                .attr("y", textHeight/2);

            wLText.append("text")
                .attr("class", "wl-text")
                .attr("id", "loss-text")
                .text(function (d){
                    return d.losses;
                })
                .attr("x", gap/2)
                .attr("y", textHeight/2);
        }
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

        return self;
    })({});


    self.courts = (function (self) {

        self.setup = function (data, svg, settings) {
            var teams = {};
            netball.data.getTeamNames().map(function (d) { teams[d] = {}; });

            // console.log(data);

            //tally wins in courts
            data.map(function (d) {
                if(d.score.home < d.score.away) {
                    //home lost
                    //add venue with 1 win, or increment venues wins by 1
                    var team = teams[d.awayTeam];
                    team[d.venue] = (d.venue in team) ? team[d.venue]+1 : 1;
                } else if(d.score.home > d.score.away) {
                    //home won
                    var team = teams[d.homeTeam];
                    team[d.venue] = (d.venue in team) ? team[d.venue]+1 : 1;
                } else {
                    //tie (but there are none in the data atm, ignore?)
                    // console.log("tie");
                }
            });

            var courts = {};
            netball.data.getCourtNames().map(function (d) { courts[d] = {}; });

            //add teams and their wins to courts
            for(var teamName in teams) {
                var team = teams[teamName];
                for(var courtName in team) {
                    courts[courtName][teamName] = team[courtName];
                }
            }

            //remove courts with only 1 team
            for(var key in courts) {
                if(Object.keys(courts[key]).length < 2) {
                    delete courts[key];
                }
            }

            // console.log(courts);

            var clean = {};
            clean.name = "Courts";
            clean.children = [];

            for(var key in courts) {
                var obj = {name: key};
                obj.children = [];

                for(var team in courts[key]) {
                    var obj2 = {name: team, wins: courts[key][team]};
                    obj.children.push(obj2);
                }

                clean.children.push(obj);
            }


            //clean dataset ready for pack layout
            self.clean = clean;

            // console.log(clean);

            self.courts = courts;
            self.teams = teams;

            self.svg = svg;



            self.update(settings);
        };

        self.update = function (settings) {
            var diameter = 760,
                format = d3.format(",d");

            var pack = d3.layout.pack()
                .size([diameter - 4, diameter - 4])
                .value(function(d) { return d.wins; });

            var svg = self.svg;

            //adapted from the example from http://bl.ocks.org/mbostock/4063530

            var node = svg.selectAll(".node-courts")
                  .data(pack.nodes(self.clean))
                .enter().append("g")
                  .attr("class", function(d) { return d.children ? ".node-courts" : "leaf-courts .node-courts"; })
                  .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

              node.append("title")
                  .text(function(d) { return d.name + (d.children ? "" : ": wins " + format(d.wins)); });

              node.append("circle")
                   .attr("class", "circle-courts")
                  .attr("r", function(d) { return d.r; });

              node.filter(function(d) { return !d.children; }).append("text")
                  .attr("dy", ".3em")
                  .style("text-anchor", "middle")
                  .text(function(d) { return d.name.substring(0, d.r / 3); });
        }

        return self;
    })({});

})(netball.visuals = netball.visuals || {});
