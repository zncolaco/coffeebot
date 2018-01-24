function startup(db) {
  db.serialize(function() {
		db.run("CREATE TABLE if not exists karma (name TEXT PRIMARY KEY, score INTEGER)");
	});
}

function getKarma(db, name) {
  return new Promise((resolve, reject) => {
    db.get("SELECT score FROM karma WHERE name = ?", name, (err, row) => {
      if (err) resolve(0);
      if (row && row.score) resolve(row.score);
      resolve(0);
    });
  });
}

function setKarma(db, name, increaseBy) {
  return new Promise((resolve) => {
    
    getKarma(db, name).then((score) => {
      var newScore = score + increaseBy;
      return new Promise((resolve, reject) => {
        db.run("INSERT OR REPLACE INTO karma (name, score) VALUES (?,?)", [name, newScore], (err, row) => {
          if (err) reject(err);
          resolve(newScore);
        });
      });
    }).then((newScore) => {
      resolve(newScore);
    });
  });
}

function getLeaderboard(db, sortOrder) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT name, score FROM karma ORDER BY SCORE ${sortOrder} LIMIT 10`, (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
}

function nuclearBomb(db) {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM karma; VACUUM", (err, row) => {
      if (err) reject(err);
      resolve();
    });
  });
}

module.exports = {
  startup, getKarma, setKarma, getLeaderboard, nuclearBomb
};