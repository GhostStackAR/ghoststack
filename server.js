const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "ghoststack-secret",
  resave: false,
  saveUninitialized: true
}));

const PASSWORD = "stackstable";

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

app.post("/login", (req, res) => {
  if (req.body.password === PASSWORD) {
    req.session.auth = true;
    res.redirect("/ar");
  } else {
    res.send("Access denied");
  }
});

app.get("/ar", (req, res) => {
  if (!req.session.auth) return res.redirect("/");
  res.sendFile(path.join(__dirname, "public/ar.html"));
});

app.use(express.static("public"));

app.listen(3000, () =>
  console.log("GhostStack running at http://localhost:3000")
);
