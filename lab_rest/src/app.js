const path = require("path");
const https = require("https");
const cors = require("cors");
const express = require("express");

const app = express();
const port = 3030;
app.use(cors());

const apiUrl = "https://statsapi.web.nhl.com";
const date = new Date();
let year = 0;
if (date.getMonth() < 7) {
  year = 1900 + parseInt(date.getYear()) - 1;
} else {
  year = 1900 + parseInt(date.getYear());
}

const publicDirPath = path.join(__dirname, "../public");
app.use(express.static(publicDirPath));

const getNamePromise = (url) => {
  return new Promise((resolve, reject) => {
    try {
      https.get(url, (response) => {
        response.setEncoding("utf8");
        let body = "";

        response
          .on("data", (chunk) => {
            body += chunk;
          })
          .on("end", () => {
            body = JSON.parse(body);
            if (body.error) {
              reject(body.error);
              return;
            }
            resolve(body);
          });
      });
    } catch (e) {
      res.status(400).send(e);
    }
  });
};

app.get("/", (req, res) => {
  res.send("index.html");
});

app.get("/api/teams", (req, res) => {
  try {
    https.get(`${apiUrl}/api/v1/teams`, (response) => {
      response.setEncoding("utf8");
      let body = "";

      response
        .on("data", (chunk) => {
          body += chunk;
        })
        .on("end", () => {
          body = JSON.parse(body);
          if (body.error) {
            res.type("application/json").send(body);
            return;
          }

          res.type("application/json").send(Object.values(body));
        });
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

app.get("/api/teams/:team", (req, res) => {
  const team = req.params.team;
  try {
    https.get(`${apiUrl}/api/v1/teams/${team}/roster`, (response) => {
      response.setEncoding("utf8");
      let body = "";

      response
        .on("data", (chunk) => {
          body += chunk;
        })
        .on("end", () => {
          body = JSON.parse(body);
          if (body.error) {
            res.type("application/json").send(body);
            return;
          }
          const result = body.roster.map((person) => {
            let r = {
              id: Object.values(person)[0].id,
              fullName: Object.values(person)[0].fullName,
            };
            return r;
          });

          res.type("application/json").send(Object.values(result));
        });
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

app.get("/api/players/:player", (req, res) => {
  const player = req.params.player;
  try {
    https.get(
      `${apiUrl}/api/v1/people/${player}/stats?stats=yearByYear`,
      (response) => {
        response.setEncoding("utf8");
        let body = "";

        response
          .on("data", (chunk) => {
            body += chunk;
          })
          .on("end", () => {
            body = JSON.parse(body);
            if (body.error) {
              res.type("application/json").send(body);
              return;
            }

            res.type("application/json").send(Object.values(body.stats[0]));
          });
      }
    );
  } catch (e) {
    res.status(400).send(e);
  }
});

app.get("/api/nhl", async (req, res) => {
  try {
    const params = req.query;
    let first = params.first;
    let second = params.second;
    let third = params.third;
    let first_text = first;
    let second_text = second;
    let third_text = third;

    third_season = third.slice(0, 9).replace("/", "");
    third_text = third.replace(" ", " at ");

    let teams_stats = getNamePromise(`${apiUrl}/api/v1/teams/${first}/stats`);
    let response_name = getNamePromise(`${apiUrl}/api/v1/people/${second}`);
    let response_stats = getNamePromise(
      `${apiUrl}/api/v1/people/${second}/stats?stats=statsSingleSeason&season=${third_season}`
    );
    let response_stats_ranking = getNamePromise(
      `${apiUrl}/api/v1/people/${second}/stats?stats=regularSeasonStatRankings&season=${third_season}`
    );

    first_text = await teams_stats;
    const team_stat = first_text.stats;

    second_text = await response_name;
    second_text_ready = second_text.people[0].fullName;
    second_is_goalie = second_text.people[0].primaryPosition.code === "G";

    third_stats = await response_stats;
    let tmp = JSON.stringify(third_stats.stats[0].splits[0]) === undefined;
    third_stats = tmp
      ? "No data available for this period"
      : third_stats.stats[0].splits[0].stat;

    let third_stats_ranking = await response_stats_ranking;
    let tmp2 =
      JSON.stringify(third_stats_ranking.stats[0].splits[0]) === undefined;
    third_stats_ranking = tmp2
      ? "No data available for this period"
      : third_stats_ranking.stats[0].splits[0].stat;

    // check player type / used in views
    let dis = tmp ? "none" : "block";
    let data_available = tmp ? "block" : "none";
    let dis_g = "none";
    if (second_is_goalie) {
      dis = "none";
      dis_g = "block";
    }

    const img_src = `https://nhl.bamcontent.com/images/headshots/current/168x168/${second}.jpg`;
    // res.type('html').send("{}")
    res.type("html").send(`
      <h1 class="mt-4">${second_text_ready}</h1>
      <hr />
      <div style="padding: 1rem">
        <img class="img-thumbnail rounded" src="${img_src}" alt="Player photo unavailable"/>
        <h3>Stats from season ${third_text}</h3>
        <div style="display: ${dis}">
        <p>Goals: ${JSON.stringify(third_stats.goals)}</p>
        <p>Assists: ${JSON.stringify(third_stats.assists)}</p>
        <p>Hits: ${JSON.stringify(third_stats.hits)}</p>
        <p>Faceoffs: ${JSON.stringify(third_stats.faceOffPct)}%</p>
        <p>Net rating: ${JSON.stringify(third_stats.plusMinus)}</p>
        <p>Penalty minutes per game: ${(
          JSON.stringify(third_stats.pim) / JSON.stringify(third_stats.games)
        ).toPrecision(3)}</p>
          <p>Points per game: ${(
            JSON.stringify(third_stats.points) /
            JSON.stringify(third_stats.games)
          ).toPrecision(3)}</p>
          <p>Average time on ice: ${JSON.stringify(
            third_stats.timeOnIcePerGame
          )}</p>
        </div>
        <div style="display: ${data_available}">
        <p>${third_stats}</p>
        </div>
        <div style="display: ${dis_g}">
        <p>Save percentage: ${JSON.stringify(third_stats.savePercentage)}</p>
          <p>Games started: ${JSON.stringify(third_stats.gamesStarted)}</p>
          <p>Shutouts: ${JSON.stringify(third_stats.shutouts)}</p>
          <p>Average goals against: ${JSON.stringify(
            third_stats.goalAgainstAverage
          )}</p>
            <p>Save percentage 5v5: ${(
              JSON.stringify(third_stats.evenSaves) /
              JSON.stringify(third_stats.evenShots)
            ).toPrecision(3)}</p>
        </div>
          <hr />
        <div style="display: ${dis}">
          <h4>Season comparison in league</h4>
        <div style="display: ${data_available}">
          <p>${third_stats}</p>
          </div>
          <p>Goals: ${JSON.stringify(third_stats_ranking.rankGoals)}</p>
          <p>Assists: ${JSON.stringify(third_stats_ranking.rankAssists)}</p>
          <p>Shot percentage: ${JSON.stringify(
            third_stats_ranking.rankShotPct
          )}</p>
          <p>Points: ${JSON.stringify(third_stats_ranking.rankPoints)}</p>
          <p>Net rating: ${JSON.stringify(
            third_stats_ranking.rankPlusMinus
          )}</p>
          <p>Hits: ${JSON.stringify(third_stats_ranking.rankHits)}</p>
        </div>
        
        <div>
        <h4>${team_stat[0].splits[0].team.name} this season ${year}/${
      year + 1
    }</h4>
        <p>Games played: ${team_stat[0].splits[0].stat.gamesPlayed}</p>
        <li>Games won: ${team_stat[0].splits[0].stat.wins}</li>
        <li>Games lost: ${team_stat[0].splits[0].stat.losses}</li>
        <li>Games lost in overtime: ${team_stat[0].splits[0].stat.ot}</li>
        <li>Points percentage: ${team_stat[0].splits[0].stat.ptPctg}</li>
        <br/>
        <h5>Ranking</h5>
        <p>Points percentage: ${team_stat[1].splits[0].stat.ptPctg}</p>
        <p>Goals per game: ${team_stat[1].splits[0].stat.goalsPerGame}</p>
        <p>Goals against per game: ${
          team_stat[1].splits[0].stat.goalsAgainstPerGame
        }</p>
        <p>Shots per game: ${team_stat[1].splits[0].stat.shotsPerGame}</p>
        <p>Shots allowed: ${team_stat[1].splits[0].stat.shotsAllowed}</p>
        </div>
      </div>`);
  } catch (e) {
    res.status(400).send(e);
  }
});

app.listen(port, () => {
  console.log(`App is listening on ${port}`);
});
