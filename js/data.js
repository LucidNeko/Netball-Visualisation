"use strict";
(function (self){

    var teamNames = [
            "Central Pulse",
            "New South Wales Swifts",
            "Northern Mystics",
            "Adelaide Thunderbirds",
            "Waikato Bay of Plenty Magic",
            "Melbourne Vixens",
            "Southern Steel",
            "West Coast Fever",
            "Canterbury Tactix",
            "Queensland Firebirds"
        ];

    self.getTeamNames = function () {
        return teamNames;
    }

    self.teamGames = function (games) {
        // make blank team array for each team
        var teams = teams.map(function (d){ return []; });

        // sort each game into team array
        games.forEach(function (game) {
            var homeIndex = teamNames.indexOf(game.homeTeam);
            var awayIndex = teamNames.indexOf(game.awayTeam);

            // make games objects for
            var homeGame = cloneGame(game, true);
            var awayGame = cloneGame(game, false);

            teams[homeIndex].push(homeGame);
            teams[awayIndex].push(awayGame);
        });

        return teams;
    }

    // make it clear which score belongs to which team
    var cloneGame = function (game, home) {
        var cloned = clone(game);
        if (home){
            cloned.thisTeam = cloned.homeTeam;
            cloned.otherTeam = cloned.awayTeam;
            cloned.score = { thisTeam: cloned.score.home, otherTeam: cloned.score.away };
        } else {
            cloned.thisTeam = clone.awayTeam;
            cloned.otherTeam = clone.homeTeam;
            cloned.score = { thisTeam: cloned.score.away, otherTeam: cloned.score.home };
        }

        delete cloned.homeTeam;
        delete cloned.awayTeam;

        return cloned;
    }

    // gets weight (success) value for all teams given games games
    // currently just gets win/loss measure
    self.getTeams = function (games) {

        var teams = {};

        teamNames.forEach(function (teamName) {
            // win loss total
            teams[teamName] = { name: teamName, wins: 0, losses: 0, opponents: {}};
            // win loss for each other team
            teamNames.forEach( function (opponentName){
                teams[teamName].opponents[opponentName] = { name: opponentName, wins: 0, losses: 0 };
            });
        });

        games.forEach( function (game) {
            if (game.score.home > game.score.away){
                teams[game.homeTeam].wins++;
                teams[game.homeTeam].opponents[game.awayTeam].wins++;
                teams[game.awayTeam].losses++;
                teams[game.awayTeam].opponents[game.homeTeam].losses++;
            } else if (game.score.home < game.score.away) {
                teams[game.homeTeam].losses++;
                teams[game.homeTeam].opponents[game.awayTeam].losses++;
                teams[game.awayTeam].wins++;
                teams[game.awayTeam].opponents[game.homeTeam].wins++;
            }
        });

        // calculate ratios
        Object.keys(teams).forEach(function (teamName) {
            var team = teams[teamName];
            team.ratio = team.wins / (team.wins + team.losses);
            // iterate through all opposing teams
            for (var opponent in team.opponents){
                opponent.ratio = opponent.wins / (opponent.wins + opponent.losses);
            }
        });

        // returns as array of team stats, rather than mappings from name to stats
        var teamsArray = Object.keys(teams).map(function (name) {
            return teams[name];
        });

        console.log("returning teams");
        return teamsArray;
    }

    // splits teams into clusters, based on how similar their weighting is
    self.rivalClusters = function (teamWeights) {
        // TODO maybe
    }

})(netball.data = netball.data || {});
