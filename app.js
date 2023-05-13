const express = require("express");
const app = express();

const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDBtoobject = (dbobject) => {
  return {
    playerId: dbobject.playerId,
    playerName: dbobject.playerName,
  };
};

app.get("/players/", async (request, response) => {
  const getplayerQuery = `
        select player_id as playerId,
        player_name as playerName
        from player_details;
        `;
  const player = await db.all(getplayerQuery);
  response.send(player);
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQueryByid = `
    select player_id as playerId,
    player_name as playerName
    from player_details
    where player_id = ${playerId};
    `;
  const players = await db.get(getPlayerQueryByid);
  response.send(players);
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const districtDetails = request.body;
  const { playerName } = districtDetails;
  const updatedplayerQuery = `
        update player_details
        set 
        player_name='${playerName}'
    `;
  await db.run(updatedplayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getmatchQueryByid = `
    select match_id as matchId,match,year
    from match_details
    where match_id = ${matchId};
    `;
  const match = await db.get(getmatchQueryByid);
  response.send(match);
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const listofmatchquery = `
        select match_id as matchId,match,year
        from player_match_score natural join match_details
        where player_id=${playerId};
    `;
  const match = await db.all(listofmatchquery);
  response.send(match);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const listofplayersquery = `
        select 
        player_match_score.player_id as playerId,
        player_name as playerName
        from player_details inner join player_match_score
        on player_details.player_id = player_match_score.player_id
        where match_id=${matchId};
    `;
  const match = await db.all(listofplayersquery);
  console.log(match);
  response.send(match);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerNameQuery = `
    SELECT player_name
        FROM player_details
    WHERE player_id=${playerId};`;
  const getPlayerNameResponse = await db.get(getPlayerNameQuery);
  const getPlayerStatisticsQuery = `
    SELECT 
        player_id,
        sum(score) AS totalScore,
        sum(fours) AS totalFours,
        sum(sixes) AS totalSixes
    FROM 
        player_match_score
    WHERE 
        player_id=${playerId};`;

  const getPlayerStatisticsResponse = await db.get(getPlayerStatisticsQuery);
  response.send(
    playerStatsObject(
      getPlayerNameResponse.player_name,
      getPlayerStatisticsResponse
    )
  );
});

module.exports = app;
