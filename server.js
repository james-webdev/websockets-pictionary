//WEB/HTTP SERVER
const mongodb = require("mongodb");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const path = require("path");
const express = require("express");
const app = express();
const db = process.env.MONGODB_URL;
// const urlApp = "http://localhost:8080";
// const dbUrl = "mongodb://localhost:27017/websockets-pictionary";
const dbUrl =
  "mongodb+srv://James:websockets@cluster0.hmv3v.mongodb.net/websockets?retryWrites=true&w=majority";
const urlApp = "https://pictionary-websockets.herokuapp.com/";
app.use("/public", express.static(__dirname + "/public"));

app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: "shhh",
    store: new MongoStore({
      url: dbUrl,
    }),
  })
);

app.set("view engine", "pug");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get("/", (request, response, next) => {
  response.render("signup");
});

app.post("/signup", (request, response, next) => {
  request.body.name;
  request.body.email;
  request.body.password;
  mongodb.MongoClient.connect(
    dbUrl,
    {
      useUnifiedTopology: true,
    },
    (error, client) => {
      if (error) {
        console.log(error);
        response.redirect("/signup");
      } else {
        const db = client.db("websockets");
        db.collection("users", (error, collection) => {
          collection.insertOne(
            {
              name: request.body.name,
              email: request.body.email,
              password: request.body.password,
              points: 0,
            },
            (error, result) => {
              if (error) {
                response.redirect("/signup");
              }
            }
          );
        });
        response.redirect("/login");
      }
    }
  );
});

app.get("/login", (request, response, next) => {
  response.render("login");
});

app.post("/login", (request, response, next) => {
  request.body.name;
  request.body.email;
  request.body.password;
  mongodb.MongoClient.connect(
    dbUrl,
    {
      useUnifiedTopology: true,
    },
    (error, client) => {
      if (error) {
        response.redirect("/login");
      } else {
        const db = client.db("websockets");
        db.collection("users", (error, collection) => {
          collection.findOne(
            {
              email: request.body.email,
            },
            (error, result) => {
              // console.log(result);
              // console.log(request.body.password);
              // console.log(error);
              if (error) {
                response.redirect("/login");
              } else {
                if (request.body.password === result.password) {
                  request.session._id = result._id;
                  request.session.email = result.email;
                  request.session.name = result.name;
                  request.session.points = result.points;
                  response.redirect("/index");
                } else {
                  response.redirect("/login");
                }
              }
            }
          );
        });
      }
    }
  );
});

app.get("/index", (request, response, next) => {
  if (request.session.email) {
    response.render("index", {
      _id: request.session._id,
      email: request.session.email,
      name: request.session.name,
      points: request.session.points,
    });
  } else {
    response.redirect("/login");
  }
});

app.get("/signup", (request, response, next) => {
  response.render("signup");
});

app.all((error, request, response, next) => {
  response
    .status(404)
    .send(
      "<!DOCTYPE html><html><head><title>Erreur 404</title></head><body><h1>Erreur 404 : Page not Found</h1></body></html>"
    );
});

app.get("/words", (req, res, next) => {
  const pathname = path.join(__dirname, "/public/words.js");
  res.set({
    "Access-Control-Allow-Origin": urlApp,
  });
  res.sendFile(pathname);
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

const server = app.listen(port, () => {
  console.log("HTTP Server started on 8000.");
});

// WEB SOCKET SERVER
const socket = require("socket.io");
const io = socket(server);

io.sockets.on("connection", newConnection);

function newConnection(socket) {
  console.log("connected to WS server ID : " + socket.id);

  socket.on("I am here", (userName) => {
    console.log("I am here", userName);
  });

  socket.on("whoAreYou", (id) => {
    mongodb.MongoClient.connect(
      dbUrl,
      {
        useUnifiedTopology: true,
      },
      (error, client) => {
        if (error) {
          socket.emit("questionReply", {});
        } else {
          const db = client.db("websockets");
          db.collection("users", (error, collection) => {
            collection.findOne(
              {
                _id: mongodb.ObjectId(id),
              },
              {
                projection: {
                  _id: true,
                  name: true,
                  points: true,
                },
              },
              (error, user) => {
                if (error) {
                  socket.emit("questionReply", {});
                } else {
                  // console.log("USER :", user);
                  io.emit("questionReply", user);
                }
              }
            );
          });
        }
      }
    );
  });

  // ADD TEN POINTS
  socket.on("tenpoints", (responseID) => {
    // console.log(id);
    mongodb.MongoClient.connect(
      dbUrl,
      {
        useUnifiedTopology: true,
      },
      (error, client) => {
        if (error) {
          socket.emit("tenpoints", {});
        } else {
          const db = client.db("websockets");
          db.collection("users", (error, collection) => {
            collection.findOne(
              {
                _id: mongodb.ObjectId(responseID),
              },
              {
                projection: {
                  _id: true,
                  name: true,
                  points: true,
                },
              },
              (error, user) => {
                if (error) {
                  socket.emit("tenpoints", {});
                } else {
                  // console.log("added 10 points");
                  // console.log("this is your player", user);
                  const db = client.db("websockets");
                  db.collection("users", (error, collection) => {
                    collection.updateOne(
                      {
                        _id: mongodb.ObjectId(responseID),
                      },
                      {
                        $inc: { points: 10 },
                      },
                      (error, result) => {
                        if (error) {
                          response.redirect("/index");
                        } else {
                          // console.log("user arrives here", user);
                          socket.emit("pointsUpdate", user);
                        }
                      }
                    );
                  });
                }
              }
            );
          });
        }
      }
    );
  });

  socket.on("mouse", function (data) {
    // ioServer.sockets.emit("forAll", data);
    // console.log(data);
    socket.broadcast.emit("mouse", data);
  });

  socket.on("chat message", function (msg) {
    // console.log("message is" + msg);
    socket.broadcast.emit("chat message", msg);
    // io.sockets.emit("chat message", msg);
  });
}
