//WEB/HTTP SERVER
const mongodb = require("mongodb");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const path = require("path");
const express = require("express");
const app = express();
const MongoClient = require("mongodb").MongoClient;
const username = "James";
const password = "websockets-pictionary";
const hosts =
  "iad2-c13-0.mongo.objectrocket.com:53577,iad2-c13-2.mongo.objectrocket.com:53577,iad2-c13-1.mongo.objectrocket.com:53577";
const database = "websockets-pictionary";
const options =
  "?replicaSet=5df3e347a4384bf8968b430ec021a64f?retryWrites=false";
const connectionString =
  "mongodb://" +
  username +
  ":" +
  password +
  "@" +
  hosts +
  "/" +
  database +
  options;

app.use("/public", express.static(__dirname + "/public"));

app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: "shhh",
    store: new MongoStore({
      url: connectionString,
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

// MongoClient.connect(connectionString, function (err, db) {
//   if (db) {
//     db.close();
//   }
//   if (err) {
//     console.log("Error: ", err);
//   } else {
//     console.log("Connected!");
//     process.exit();
//   }
// });

app.post("/signup", (request, response, next) => {
  request.body.name;
  request.body.email;
  request.body.password;
  MongoClient.connect(
    connectionString,
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
  MongoClient.connect(
    connectionString,
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

app.get("/words", (req, res, next) => {
  const pathname = path.join(__dirname, "/public/words.js");
  res.set({
    "Access-Control-Allow-Origin": "http://127.0.0.1:8000",
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

  socket.on("whoAreYou", (id) => {
    MongoClient.connect(
      connectionString,
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

  socket.on("mouse", function (data) {
    // ioServer.sockets.emit("forAll", data);
    // console.log(data);
    socket.broadcast.emit("mouse", data);
  });

  socket.on("chat message", function (msg) {
    console.log("message is" + msg);
    socket.broadcast.emit("chat message", msg);
    // io.sockets.emit("chat message", msg);
  });
}
