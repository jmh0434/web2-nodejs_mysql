var http = require("http");
var fs = require("fs");
var url = require("url");
var qs = require("querystring");
var template = require("./lib/template.js");
var path = require("path");
var sanitizeHtml = require("sanitize-html");
var mysql = require("mysql");
var db = mysql.createConnection({ // mysql을 연결하기 위한 객체
  host: "localhost",
  user: "root",
  password: "wjdalsgur1",
  database: "opentutorials",
});
db.connect();

var app = http.createServer(function (request, response) {
  var _url = request.url;
  var queryData = url.parse(_url, true).query;
  var pathname = url.parse(_url, true).pathname;
  if (pathname === "/") { // 차상위 루트라면
    if (queryData.id === undefined) { // queryData가 존재하지 않는다면, 즉 메인 홈페이지라면
      db.query(`SELECT * FROM topic`, function (error, topics) { // topic 테이블의 데이터를 읽어와서 화면에 출력
        var title = "Welcome";
        var description = "Hello, Node.js";
        var list = template.list(topics);
        var html = template.HTML(
          title,
          list,
          `<h2>${title}</h2>${description}`,
          `<a href="/create">create</a>`
        );
        response.writeHead(200);
        response.end(html);
      });
    } else { // 그렇지 않다면, 즉 어떠한 게시물을 클릭했을 때
      db.query(`SELECT * FROM topic`, function (error, topics) { // 우선 위에 전체 리스트를 띄워주고
        if (error) {
          throw error;
        }
        db.query( // 선택한 항목의 데이터를 출력한다
          `SELECT * FROM topic WHERE id=?`,
          [queryData.id],
          function (error2, topic) {
            if (error2) {
              throw error2;
            }
            var title = topic[0].title;
            var description = topic[0].description;
            var list = template.list(topics);
            var html = template.HTML(
              title,
              list,
              `<h2>${title}</h2>${description}`, // 입력, 삭제, 수정 폼
              ` <a href="/create">create</a>
                <a href="/update?id=${queryData.id}">update</a>
                <form action="delete_process" method="post">
                  <input type="hidden" name="id" value="${queryData.id}">
                  <input type="submit" value="delete">
                </form>`
            );
            response.writeHead(200);
            response.end(html);
          }
        );
      });
    }
  } else if (pathname === "/create") { // 만들기 버튼을 눌렀을 때
    db.query(`SELECT * FROM topic`, function (error, topics) { // 쿼리를 통해 읽어오고
      var title = "Create";
      var list = template.list(topics);
      var html = template.HTML(
        title,
        list,
        `
          <form action="/create_process" method="post">
            <p><input type="text" name="title" placeholder="title"></p>
            <p>
              <textarea name="description" placeholder="description"></textarea>
            </p>
            <p>
              <input type="submit">
            </p>
          </form>
          `,
        `<a href="/create">create</a>`
      );
      response.writeHead(200);
      response.end(html);
    });
  } else if (pathname === "/create_process") { // 생성 후 처리
    var body = "";
    request.on("data", function (data) { // 데이터를 요청
      body = body + data;
    }); 
    request.on("end", function () {
      var post = qs.parse(body);
      db.query( // INSERT 구문을 통해 데이터를 MySQL에 저장
        `
            INSERT INTO topic (title, description, created, author_id) 
              VALUES(?, ?, NOW(), ?)`,
        [post.title, post.description, 1],
        function (error, result) {
          if (error) {
            throw error;
          }
          response.writeHead(302, { Location: `/?id=${result.insertId}` });
          response.end();
        }
      );
    });
  } else if (pathname === "/update") { // 수정 버튼을 눌렀을 때
    db.query("SELECT * FROM topic", function (error, topics) {
      if (error) {
        throw error;
      }
      db.query(
        `SELECT * FROM topic WHERE id=?`,
        [queryData.id],
        function (error2, topic) {
          if (error2) {
            throw error2;
          }
          var list = template.list(topics);
          var html = template.HTML(
            topic[0].title,
            list, // 수정하고자 하는 항목의 제목과 내용을 우선 불러온 다음에 편집할 수 있도록 함
            `
            <form action="/update_process" method="post">
              <input type="hidden" name="id" value="${topic[0].id}">
              <p><input type="text" name="title" placeholder="title" value="${topic[0].title}"></p>
              <p>
                <textarea name="description" placeholder="description">${topic[0].description}</textarea>
              </p>
              <p>
                <input type="submit">
              </p>
            </form>
            `,
            `<a href="/create">create</a> <a href="/update?id=${topic[0].id}">update</a>`
          );
          response.writeHead(200);
          response.end(html);
        }
      );
    });
  } else if (pathname === "/update_process") { // 수정 작업 처리
    var body = "";
    request.on("data", function (data) {
      body = body + data;
    });
    request.on("end", function () {
      var post = qs.parse(body);
      db.query(
        `UPDATE topic SET title=?, description=?, author_id=1 WHERE id=?`, // UPDATE 구문을 통해 반영하고 MySQL에 저장
        [post.title, post.description, post.id],
        function (error, result) {
          if (error) {
            throw error;
          }
          response.writeHead(302, { Location: `/?id=${post.id}` });
          response.end();
        }
      );
    });
  } else if (pathname === "/delete_process") { // 삭제 처리
    var body = "";
    request.on("data", function (data) {
      body = body + data;
    });
    request.on("end", function () {
      var post = qs.parse(body);
      db.query(`DELETE FROM topic WHERE id = ?`, [post.id], function(error, result){ //DELETE 구문을 통해 삭제 후 MySQL에 반영
        if (error) {
          throw error;
        }
        response.writeHead(302, { Location: `/` });
        response.end();
        }
      );
    });
  } else {
    response.writeHead(404);
    response.end("Not found");
  }
});
app.listen(3000);
