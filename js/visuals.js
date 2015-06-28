"use strict";

(function(self){

    // vis margins
    var margin = {top: 20, right: 20, bottom: 30, left: 50};

    // inspired by http://bl.ocks.org/mbostock/3883245
    // assumes svg is blank
    self.scoreVis = (function (self){

        var colour = d3.scale.category20();
        // non-repeating things (maybe)
        self.setup = function (data, svg, settings){

            self.games = data;
            self.svg = svg;

            var width = svg.attr("width") - margin.left - margin.right,
                height = svg.attr("height") - margin.top - margin.bottom;

            var g = svg.append("g")
                .attr("class", "score-vis")
                .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

            self.x = d3.scale.linear()
                .range([0, width]);

            self.y = d3.scale.linear()
                .range([0, height]);

            self.xAxis = d3.svg.axis()
                .scale(self.x)
                .orient("bottom");
                //.ticks(settings.year === "all" ? d3.time.year : d3.time.month);

            self.yAxis = d3.svg.axis()
                .scale(self.y)
                .orient("left");

            self.line = d3.svg.line()
                .x(function (d, i) { return self.x(i); })
                .y(function (d) { return self.y(d.score.thisTeam - d.score.otherTeam); });

            var teamGames = netball.data.teamGames(self.games, settings.year);

            //x.domain(d3.extent(data, function (d, i) { return i; }));
            self.x.domain([0, d3.max(teamGames.map(function (d){ return d.length; }))]);
            self.y.domain([
                d3.max(teamGames.map(function (team) {
                    return d3.max(team.map(function (d){
                        return Math.max(d.score.thisTeam - d.score.otherTeam, d.score.thisTeam - d.score.otherTeam);
                    }));
                })),
                d3.min(teamGames.map(function (team) {
                    return d3.min(team.map(function (d){
                        return Math.min(d.score.thisTeam - d.score.otherTeam, d.score.thisTeam - d.score.otherTeam);
                    }));
                }))
              ]);

            // axis
            g.append("g")
                .attr("class", "axis")
                .attr("id", "x-axis")
                .attr("transform", "translate (0, " + height + ")")
                .call(self.xAxis)
                    .append("text")
                .attr("y", -6)
                .attr("x", width)
                .attr("dx", "-.71em")
                .style("text-anchor", "end")
                .text("Game");

            g.append("g")
                .attr("class", "axis")
                .attr("id", "y-axis")
                .call(self.yAxis)
                    .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Score difference");

            self.lines = g.append("g")
                .attr("class", "team-lines");


            // make line for each team
            // TODO: do this without loop?
            teamGames.forEach(function (team, i) {
                self.lines.append("path")
                    .datum(team)
                    .attr("class", "team-line")
                    .attr("id", "team-line-"+i)
                    .attr("d", self.line)
                    .attr("stroke", colour(i))
                    .attr("title", function (team){
                        return team.thisTeam;
                    })
                    .on("mouseover", function(d){
                        spotlightLine(i);
                        //console.log(d);
                    })
                    .on("mouseout", function(d){
                        unspotlightLine(i);
                    })
                    .each(function(d, i){
                        //console.log(i);
                    });
            });

            // add legend
            var legend = g.append("g")
                .attr("class", "legend")
                .attr("x", width)
                .attr("y", 20)
                .attr("width", 200)
                .attr("height", 500);

             legend.selectAll("g").data(teamGames)
              .enter()
              .append("g")
              .each(function(d, i) {
                var g = d3.select(this);

                g.append("rect")
                  .attr("x", width + 50)
                  .attr("y", i * 25)
                  .attr("width", 20)
                  .attr("height", 20)
                  .style("fill", colour(i));

                g.append("text")
                  .attr("x", width + 50 + 25)
                  .attr("y", i * 25 + 16)
                  .attr("height", 20)
                  .attr("width", 100)
                  .style("fill", colour(i))
                  .text(function (d){
                        return d[0].thisTeam;
                  });

              })
              .on("mouseover", function (d, i){
                    spotlightLine(i);
                })
              .on("mouseout", function(d, i){
                    unspotlightLine(i);
                });


            addHelpButton(
                svg,
                +svg.attr("width"),
                +svg.attr("height"),
                "Score difference (team score - opponent score) for all teams across the season/s"
            );
        }

        // update the graph with new time and team settings
        self.update = function(settings){

            // data arranged into teams
            var teamGames = netball.data.teamGames(self.games, settings.year);

            self.x.domain([0, d3.max(teamGames.map(function (d){ return d.length; }))]);
            self.y.domain([
                d3.max(teamGames.map(function (team) {
                    return d3.max(team.map(function (d){
                        return Math.max(d.score.thisTeam - d.score.otherTeam, d.score.thisTeam - d.score.otherTeam);
                    }));
                })),
                d3.min(teamGames.map(function (team) {
                    return d3.min(team.map(function (d){
                        return Math.min(d.score.thisTeam - d.score.otherTeam, d.score.thisTeam - d.score.otherTeam);
                    }));
                }))
              ]);

            // update axis
            self.svg.select("#x-axis")
                .transition()
                .duration(800)
                .call(self.xAxis);

            self.svg.select("#y-axis")
                .transition()
                .duration(800)
                .call(self.yAxis);

            self.line
                .x(function (d, i) { return self.x(i); })
                .y(function (d) { return self.y(d.score.thisTeam - d.score.otherTeam); });

            // update lines
            teamGames.forEach(function (team, i){
                // TODO: transition
                self.lines.select("#team-line-"+i)
                    .datum(team)
                    .attr("d", self.line);
            });
        }

        function spotlightLine(i){
            var selector = ".team-line:not(#team-line-"+i+")";
            var lines = self.svg.selectAll(selector);
            lines.transition()
                .duration(200)
                .style("opacity", 0.2);
        }

        function unspotlightLine(i){
            var selector = ".team-line:not(#team-line-"+i+")";
            var lines = self.svg.selectAll(selector);
            lines.transition()
                .duration(200)
                .style("opacity", 1);
        }

        return self;

    })({});

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

            addHelpButton(
                self.svg,
                +self.svg.attr("width"),
                +self.svg.attr("height"),
                "Rivalry across all teams. Click on a team to see 1v1 Rivalry"
            );
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

        //create tooltip div
        $('body').append('<div class="tooltip"><div class="tipBody"></div></div>');

        var rawData;
        var filteredData;

        var courtsData;

        var preFilter = function (data, settings) {
            if(settings.year === "all") {
                return data;
            }

            var year = +settings.year;

            return data = data.filter(function (data) {
                return data.date.getFullYear() === year;
            });
        }

        var formatData = function (data) {
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

            return clean;
        }

        self.setup = function (data, svg, settings) {

            self.svg = svg;

            rawData = data;
            filteredData = preFilter(rawData, settings);
            courtsData = formatData(filteredData);

            addHelpButton(
                svg,
                +svg.attr("width"),
                +svg.attr("height"),
                "Number of games won in each court"
            );

            self.update(settings);
        };

        self.update = function (settings) {
            self.svg.selectAll("*").remove();

            filteredData = preFilter(rawData, settings);
            courtsData = formatData(filteredData);

            var diameter = 760,
                format = d3.format(",d");

            var pack = d3.layout.pack()
                .size([diameter - 4, diameter - 4])
                .value(function(d) { return d.wins; });

            var svg = self.svg;

            //adapted from the example from http://bl.ocks.org/mbostock/4063530

            var nodes = svg.selectAll(".node-courts")
                  .data(pack.nodes(courtsData));


            var node = nodes.enter().append("g")
                  .attr("class", function(d) { return d.children ? ".node-courts" : "leaf-courts .node-courts"; })
                  .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

              node.append("title")
                  .text(function(d) { return d.name + (d.children ? "" : ": wins " + format(d.wins)); });

              node.append("circle")
                    .attr("title", function(d) { return d.name + (d.children ? "" : ": wins " + format(d.wins)); })
                    .attr("class", "circle-courts")
                    .attr("r", function(d) { return d.r; });


              node.filter(function(d) { return !d.children; }).append("text")
                  .attr("class", "ignore-events")
                  .attr("dy", ".3em")
                  .style("text-anchor", "middle")
                  .text(function(d) { return d.name.substring(0, d.r / 3); });

            nodes.exit().remove();

            netball.gui.giveToolTip(".circle-courts");
        }

        return self;
    })({});

    function addHelpButton(svg, x, y, text){
            // add help button
            var help = svg.append("g")
                .attr("id", "help")
                .attr("transform", "translate("
                      + (x - margin.left - margin.right + 100) + ", "
                      + (y - margin.top - margin.bottom) + ")")
                .attr("title", text);

            help.append("image")
                .attr("xlink:href", "img/info.png")
                .attr("width", 40)
                .attr("height", 40);

            netball.gui.giveToolTip("#help");
    }

})(netball.visuals = netball.visuals || {});
