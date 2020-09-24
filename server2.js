/**
 * HTTP Server
 */
const path = require("path");
const express = require("express");
const mongodb = require("mongodb");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);

const app = express();

app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: "shhh",
    store: new MongoStore({
      url: "mongodb://localhost:27017/websockets-pictionary",
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
    "mongodb://localhost:27017/websockets-pictionary",
    {
      useUnifiedTopology: true,
    },
    (error, client) => {
      if (error) {
        response.redirect("/signup");
      } else {
        const db = client.db("websockets-pictionary");
        db.collection("users", (error, collection) => {
          collection.insertOne(
            {
              name: request.body.name,
              email: request.body.email,
              password: request.body.password,
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
    "mongodb://localhost:27017/websockets-pictionary",
    {
      useUnifiedTopology: true,
    },
    (error, client) => {
      if (error) {
        response.redirect("/login");
      } else {
        const db = client.db("websockets-pictionary");
        db.collection("users", (error, collection) => {
          collection.findOne(
            {
              email: request.body.email,
            },
            (error, result) => {
              console.log(result);
              console.log(request.body.password);
              // console.log(error);
              if (error) {
                response.redirect("/login");
              } else {
                if (request.body.password === result.password) {
                  request.session._id = result._id;
                  request.session.email = result.email;
                  request.session.name = result.name;
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
      "<!DOCTYPE html><html><head><title>Erreur 404</title></head><body><h1>Erreur 404 : Page non trouvée</h1></body></html>"
    );
});

const server = app.listen(8080, () => {
  console.log("HTTP Server started on 8080.");
});

/**
 * Partie WebSocket
 */
const IOServer = require("socket.io");

const ioServer = new IOServer(server);

ioServer.on("connection", (socket) => {
  console.log("Connection WebSocket OK");

  socket.on("whoAreYou", (id) => {
    mongodb.MongoClient.connect(
      "mongodb://localhost:27017/websockets-pictionary",
      {
        useUnifiedTopology: true,
      },
      (error, client) => {
        if (error) {
          // Utilisateur non identifié
          socket.emit("questionReply", {});
        } else {
          const db = client.db("websockets-pictionary");
          db.collection("users", (error, collection) => {
            collection.findOne(
              {
                _id: mongodb.ObjectId(id),
              },
              {
                projection: {
                  _id: true,
                  name: true,
                },
              },
              (error, user) => {
                if (error) {
                  // Utilisateur non identifié
                  socket.emit("questionReply", {});
                } else {
                  // Utilisateur identifié
                  console.log("USER :", user);
                  socket.broadcast.emit("questionReply", user);
                }
              }
            );
          });
        }
      }
    );
  });
});
