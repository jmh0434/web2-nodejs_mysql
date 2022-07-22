var mysql = require("mysql");
var db = mysql.createConnection({
  // mysql을 연결하기 위한 객체
  host: "localhost",
  user: "root",
  password: "wjdalsgur1",
  database: "opentutorials",
});
db.connect();
module.exports = db;