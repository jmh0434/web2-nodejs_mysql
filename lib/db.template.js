var mysql = require("mysql");
var db = mysql.createConnection({
  // mysql을 연결하기 위한 객체
  host: "",
  user: "",
  password: "",
  database: "",
});
db.connect();
module.exports = db;
