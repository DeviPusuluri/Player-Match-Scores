const express = require("express");
const path = require("path");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
let db = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("server running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertPlayerDetailObjectToDbObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
// API 1

app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT * FROM player_details;`;
  const playersArray = await db.all(getPlayerQuery);

  response.send(
    playersArray.map((i) => convertPlayerDetailObjectToDbObject(i))
  );
});

// API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT * FROM player_details 
    WHERE player_id=${playerId};`;
  const getPlayer = await db.get(getPlayerQuery);
  response.send(convertPlayerDetailObjectToDbObject(getPlayer));
});

// API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateDetailsOfPlayer = `
    UPDATE player_details
    SET  player_name='${playerName}'
    WHERE player_id=${playerId};`;
  await db.run(updateDetailsOfPlayer);
  response.send("Player Details Updated");
});

const convertMatchDetailObjectToDbObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
// API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    SELECT * FROM match_details
    WHERE match_id=${matchId};`;
  const getMatchDetails = await db.get(getMatchDetailsQuery);
  response.send(convertMatchDetailObjectToDbObject(getMatchDetails));
});

// API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const { matchId, match, year } = request.body;
  const getAllMatchesQuery = `
    SELECT * FROM player_match_score NATURAL JOIN match_details
    WHERE player_id=${playerId};`;
  const getAllMatches = await db.all(getAllMatchesQuery);
  response.send(
    getAllMatches.map((i) => convertMatchDetailObjectToDbObject(i))
  );
});

// API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getAllPlayersMQuery = `
    SELECT * FROM player_details NATURAL JOIN player_match_score 
    WHERE match_id=${matchId};`;
  const getAllPlayersM = await db.all(getAllPlayersMQuery);
  response.send(
    getAllPlayersM.map((i) => convertPlayerDetailObjectToDbObject(i))
  );
});

const convertPlayerMatchScoreObjectToDbObject = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

// API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatisticsQuery = `
    SELECT 
    player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_details NATURAL JOIN player_match_score
    WHERE player_id=${playerId}; `;
  const getStatistics = await db.get(getStatisticsQuery);
  response.send(getStatistics);
});

module.exports = app;
