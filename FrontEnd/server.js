const express = require('express');
const serveStatic = require('serve-static');
const morgan = require('morgan'); // Import Morgan for logging
const fs = require('fs');
const path = require('path');

var hostname = "localhost";
var port = 3001;

var app = express();

// Create a write stream (in append mode) for logging to a file
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'frontend-access.log'), { flags: 'a' });

// Use Morgan to log requests to both the console and file
app.use(morgan('combined', { stream: accessLogStream })); // Logs requests to file
app.use(morgan('dev')); // Logs requests to the console

// Middleware to log request details manually
app.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`);
    console.log(`Method: ${req.method}`);
    console.log(`Path: ${req.path}`);
    console.log(`Query ID: ${req.query.id || "N/A"}`);

    if (req.method !== "GET") {
        res.type('.html');
        var msg = "<html><body>This server only serves web pages with GET!</body></html>";
        res.end(msg);
    } else {
        next();
    }
});

// Serve static files from the "public" directory
app.use(serveStatic(__dirname + "/public"));

// Start the server
app.listen(port, hostname, function () {
    console.log(`Server hosted at http://${hostname}:${port}`);
});
