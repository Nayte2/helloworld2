var HTTP_PORT = process.env.PORT || 8080;
var express = require("express");
var app = express();
// setup a 'root route' to listen on the default url path
app.get("/", (req, res) => {
    const linkToAbout = '<a href="/about">About</a>';
res.send(`<h2>Nathan Tsang - 132715228 <h2> ${linkToAbout}`);
});
// setup a route to listen on the '/about' url path
app.get("/about", (req, res) => {
res.json({course: "WEB322", section: "NGG", task: "In-class Assignment 1"});
});
// setup http server to listen on HTTP_PORT
app.listen(HTTP_PORT);



