var url = require("url");
var qs = require("querystring");
var template = require("./template.js");
var db = require("./db"); // mysql을 연결하기 위한 객체
var sanitizeHtml = require("sanitize-html");

exports.home = function (request, response) { // 메인 홈페이지를 담당하는 모듈
  db.query(`SELECT * FROM topic`, function (error, topics) {
    // topic 테이블의 데이터를 읽어와서 화면에 출력
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
}

exports.page = function (request, response) {
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    db.query(`SELECT * FROM topic`, function (error, topics) {
      // 우선 위에 전체 리스트를 띄워주고
      if (error) {
        throw error;
      }
      db.query(
        // 선택한 항목의 데이터를 출력한다
        `SELECT * FROM topic LEFT JOIN author ON topic.author_id = author.id WHERE topic.id=?`, // LEFT JOIN을 통한 조인
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
            `<h2>${sanitizeHtml(title)}</h2>${sanitizeHtml(description)}
               <p>by  ${sanitizeHtml(topic[0].name)} </p> 
               <p> ${topic[0].created} </p>`,
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

exports.create = function(request, response) {
    db.query(`SELECT * FROM topic`, function (error, topics) {
      // topic DB를 읽어오고
      db.query(`SELECT * FROM author`, function (error2, authors) {
        // author DB도 읽어온다
        var title = "Create";
        var list = template.list(topics);
        var html = template.HTML(
          // 글쓴이를 고를 수 있게 해줌
          sanitizeHtml(title),
          list,
          `
          <form action="/create_process" method="post">
            <p><input type="text" name="title" placeholder="title"></p>
            <p>
              <textarea name="description" placeholder="description"></textarea>
            </p>
             <p>
              ${template.authorSelect(authors)} 
            </p>
            <p>
              <input type = "submit">
            </p>
          </form>
          `,
          `<a href="/create">create</a>`
        );
        response.writeHead(200);
        response.end(html);
      });
    });
}

exports.create_process = function(request, response) {
    var body = "";
    request.on("data", function (data) {
      // 데이터를 요청
      body = body + data;
    });
    request.on("end", function () {
      var post = qs.parse(body);
      db.query(
        // INSERT 구문을 통해 데이터를 MySQL에 저장
        `
            INSERT INTO topic (title, description, created, author_id) 
              VALUES(?, ?, NOW(), ?)`,
        [post.title, post.description, post.author],
        function (error, result) {
          if (error) {
            throw error;
          }
          response.writeHead(302, { Location: `/?id=${result.insertId}` });
          response.end();
        }
      );
    });
}

exports.update = function(request, response) {
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    db.query(`SELECT * FROM topic`, function (error, topics) {
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
          db.query(
            // author 테이블을 조회하는 쿼리문 추가
            `SELECT * FROM author`,
            function (error3, authors) {
              if (error3) {
                throw error3;
              }
              var list = template.list(topics);
              var html = template.HTML(
                sanitizeHtml(topic[0].title),
                list, // 수정하고자 하는 항목의 제목과 내용을 우선 불러온 다음에 편집할 수 있도록 함
                `
            <form action="/update_process" method="post">
              <input type="hidden" name="id" value="${topic[0].id}">
              <p><input type="text" name="title" placeholder="title" value="${
                sanitizeHtml(topic[0].title)
              }"></p>
              <p>
                <textarea name="description" placeholder="description">${
                  sanitizeHtml(topic[0].description)
                }</textarea>
              </p>
              <p>
                ${template.authorSelect(authors)}
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
        }
      );
    });
}

exports.update_process = function(request, response) {
    var body = "";
    request.on("data", function (data) {
      body = body + data;
    });
    request.on("end", function () {
      var post = qs.parse(body);
      db.query(
        `UPDATE topic SET title=?, description=?, author_id= ? WHERE id=?`, // UPDATE 구문을 통해 반영하고 MySQL에 저장
        [post.title, post.description, post.author, post.id],
        function (error, result) {
          if (error) {
            throw error;
          }
          response.writeHead(302, { Location: `/?id=${post.id}` });
          response.end();
        }
      );
    });
}

exports.delete_process = function(request, response) {
    var body = "";
    request.on("data", function (data) {
      body = body + data;
    });
    request.on("end", function () {
      var post = qs.parse(body);
      db.query(
        `DELETE FROM topic WHERE id = ?`,
        [post.id],
        function (error, result) {
          //DELETE 구문을 통해 삭제 후 MySQL에 반영
          if (error) {
            throw error;
          }
          response.writeHead(302, { Location: `/` });
          response.end();
        }
      );
    });
}