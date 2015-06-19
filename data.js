"use strict";
(function (self){

    self.teamGames = function (data) {

        var teams = [
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
        // make blank team array for each team
        var teamData = teams.map(function (d){ return []; });

        // sort each game into team array
        data.forEach(function (game) {
            var homeIndex = teams.indexOf(game.homeTeam);
            var awayIndex = teams.indexOf(game.awayTeam);

            // make games objects for
            var homeGame = cloneGame(game, true);
            var awayGame = cloneGame(game, false);

            teamData[homeIndex].push(homeGame);
            teamData[awayIndex].push(awayGame);
        });

        return teamData;
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
})(netball.data = netball.data || {});
