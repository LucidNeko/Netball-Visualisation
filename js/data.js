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

    var courtNames = [
            "TSB Bank Arena, Wellington",
            "Brisbane Convention & Exhibition Centre",
            "Trusts Stadium, Auckland",
            "Energy Events Centre, Rotorua",
            "Acer Arena, Sydney",
            "Westpac Centre, Christchurch",
            "State Netball and Hockey Centre,Melbourne",
            "Challenge Stadium, Perth",
            "Newcastle Entertainment Centre",
            "Vodafone Arena, Melbourne",
            "Westpac Arena, Christchurch",
            "Mystery Creek Events Centre,Hamilton",
            "ETSA Park, Adelaide",
            "Sydney Olympic Park Sports Centre",
            "Stadium Southland, Invercargill",
            "Arena Manawatu, Palmerston North",
            "Edgar Centre, Dunedin",
            "North Shore Events Centre, Auckland",
            "Pettigrew Green Arena, Napier",
            "State Netball and Hockey Centre, Melbourne",
            "Brisbane Convention and Exhibition Centre",
            "Queen Elizabeth Youth Centre, Tauranga",
            "The Edgar Centre, Dunedin",
            "Mystery Creek Events Centre, Hamilton",
            "Hisense Arena, Melbourne",
            "Te Rauparaha Arena, Porirua",
            "Adelaide Arena, Adelaide",
            "Gold Coast Convention and Exhibition Centre",
            "State Sports Centre, Sydney",
            "Vector Arena, Auckland",
            "Adelaide Entertainment Centre",
            "CBS Canterbury Arena, Christchurch",
            "Energy Events Centre, Rotorua*",
            "Invercargill ILT Velodrome",
            "Taupo Events Centre",
            "Netball SA Stadium, Adelaide",
            "Stadium Southland Velodrome,Invercargill",
            "Claudelands Arena, Hamilton",
            "Lion Foundation Arena, Dunedin",
            "TECT Arena, Tauranga",
            "Allphones Arena, Sydney",
            "Te Rauparaha, Porirua",
            "Rod Laver Arena, Melbourne",
            "Trafalgar Centre, Nelson",
            "ASB Baypark Arena, Tauranga",
            "Perth Arena, Perth",
            "Claudelands Arena, Waikato",
            "State Netball Hockey Centre, Melbourne",
            "Adelaide Entertainment Centre, Adelaide"
        ];

    var teamImages = [ 
            "Adelaide Thunderbirds.jpg",
            "Canterbury Tactix.jpg",
            "Central Pulse.jpg",
            "Melbourne Vixens.jpg",
            "New South Wales Swifts.jpg",
            "Northern Mystics.jpg",
            "Queensland Firebirds.jpg",
            "Southern Steel.jpg",
            "Waikato Bay of Plenty Magic.jpg",
            "West Coast Fever.jpg" 
        ];

    self.getTeamNames = function () {
        return teamNames;
    }

    self.getCourtNames = function () {
        return courtNames;
    }

    self.getTeamImages = function () {
        return teamImages;
    }

    self.teamGames = function (games) {
        // make blank team array for each team
        var teams = teamNames.map(function (d){ return []; });

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

    // returns array of teams, each with a name, wl, and wl against all other teams
    // currently just gets win/loss measure
    self.getTeams = function (games, year) {

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
            // skip if not appropriate year
            if (year !== "all" && year !== game.year)
                return;

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
            Object.keys(team.opponents).forEach(function (opponentName) {
                var opponent = team.opponents[opponentName];
                opponent.ratio = opponent.wins / (opponent.wins + opponent.losses);
            });
        });

        // returns as array of team stats, rather than mappings from name to stats
        var teamsArray = Object.keys(teams).map(function (name) {
            return teams[name];
        });

        return teamsArray;
    }

    // splits teams into clusters, based on how similar their weighting is
    self.rivalClusters = function (teamWeights) {
        // TODO maybe
    }

})(netball.data = netball.data || {});
