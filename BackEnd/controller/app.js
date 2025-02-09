const express = require('express');
const bodyParser = require('body-parser');
const serveStatic = require('serve-static');
const morgan = require('morgan'); // Request logging
const winston = require('winston'); // Security logging
const rateLimit = require('express-rate-limit'); // Prevent brute force attacks
const TelegramBot = require('node-telegram-bot-api'); // Telegram bot for alerts
const fs = require('fs');
const path = require('path');
var user = require('../model/user.js');
var listing = require('../model/listing');
var offers = require('../model/offer');
var likes = require('../model/likes');
var images = require('../model/images');
var verifyToken = require('../auth/verifyToken.js');

var multer = require('multer');
var cors = require('cors');

var app = express();

// Set up Telegram bot for real-time alerts
const TELEGRAM_BOT_TOKEN = "7445394857:AAHEkGObb72SWXvOnztEOfaNKewBlriVgyY"; // Replace with your bot token
const TELEGRAM_CHAT_ID = "1156183055"; // Replace with your chat ID
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

function sendTelegramAlert(message) {
    bot.sendMessage(TELEGRAM_CHAT_ID, `🚨 Security Alert:\n${message}`)
        .catch(err => console.error("Telegram Bot Error:", err));
}

// Create a Winston logger to store security-related events
const securityLogger = winston.createLogger({
    level: 'warn',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'security-monitor.log' }), // Logs security issues
        new winston.transports.Console({ format: winston.format.simple() }) // Console logs
    ]
});

// Create a write stream for HTTP request logging (Morgan)
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'backend-access.log'), { flags: 'a' });

// Use Morgan to log all HTTP requests to file and console
app.use(morgan('combined', { stream: accessLogStream })); // Logs to file
app.use(morgan('dev')); // Logs to console

// Rate-Limiting to Prevent Brute Force Attacks
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit to 5 failed login attempts per IP
    handler: (req, res) => {
        const alertMessage = `🚨 Possible Brute Force Attack from IP: ${req.ip}`;
        securityLogger.warn(alertMessage);
        sendTelegramAlert(alertMessage);
        res.status(429).json({ error: "Too many login attempts. Try again later." });
    }
});

// Apply Rate Limiter to Login Route
app.use('/user/login', apiLimiter);

// Middleware to Log Suspicious Activity
app.use((req, res, next) => {
    if (req.url.includes('/admin') || req.url.includes('/config')) {
        const alertMessage = `🚨 Suspicious Access Attempt: ${req.url} from IP: ${req.ip}`;
        securityLogger.warn(alertMessage);
        sendTelegramAlert(alertMessage);
    }
    next();
});

// Middleware for Parsing JSON Requests
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Serve Static Files
app.use(serveStatic(__dirname + "/../public"));

// User Login API with Telegram Bot Alert
app.post('/user/login', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;

    user.loginUser(email, password, function (err, token, result) {
        if (err) {
            const alertMessage = `❌ Failed login attempt for ${email} from IP: ${req.ip}`;
            securityLogger.warn(alertMessage);
            sendTelegramAlert(alertMessage);
            res.status(500).send(err.statusCode);
        } else {
            res.status(201);
            res.setHeader('Content-Type', 'application/json');
            delete result[0]['password']; // Remove password before sending response
            const alertMessage = ` Successful login: ${email} from IP: ${req.ip}`;
            securityLogger.info(alertMessage);
            sendTelegramAlert(alertMessage);
            res.json({ success: true, UserData: JSON.stringify(result), token: token });
        }
    });
});


app.post('/user', function (req, res) {//Create User
	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;
	var profile_pic_url = req.body.profile_pic_url
	var role = req.body.role

	user.addUser(username, email, password, profile_pic_url, role, function (err, result) {
		if (err) {
			res.status(500);
			res.send(err);
		} else {
			res.status(201);
			res.setHeader('Content-Type', 'application/json');
			res.send(result);
		}
	});
});

app.post('/user/logout', function (req, res) {//Logout
	console.log("..logging out.");
	res.clearCookie('session-id'); //clears the cookie in the response
	res.setHeader('Content-Type', 'application/json');
	res.json({ success: true, status: 'Log out successful!' });

});


app.put('/user/update/', verifyToken, function (req, res) {//Update user info
	var id = req.id
	var username = req.body.username;
	var firstname = req.body.firstname;
	var lastname = req.body.lastname;
	user.updateUser(username, firstname, lastname, id, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(200);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true })
		}
	});
});

//Listing APIs
app.post('/listing/', verifyToken, function (req, res) {//Add Listing
	var title = req.body.title;
	var category = req.body.category;
	var description = req.body.description;
	var price = req.body.price;
	var fk_poster_id = req.id;
	listing.addListing(title, category, description, price, fk_poster_id, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false });
		} else {
			res.status(201);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true,id:result.insertId })
		}
	});
});


app.get('/user/listing', verifyToken, function (req, res) {//Get all Listings of the User
	var userid = req.id;
	listing.getUserListings(userid, function (err, result) {
		if (err) {
			res.status(500);
			console.log(err)
			res.json({ success: false });
		} else {
			res.status(200);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true, result: result });
		}
	});
});

app.get('/listing/:id', function (req, res) {//View a listing
	var id = req.params.id
	listing.getListing(id, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(200);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true, result: result })
		}
	});
});

app.get('/search/:query', verifyToken, function (req, res) {//View all other user's listing that matches the search
	var query = req.params.query;
	var userid = req.id;
	listing.getOtherUsersListings(query, userid, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(200);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true, result: result })
		}
	});
});

app.put('/listing/update/', function (req, res) {//View a listing
	var title = req.body.title;
	var category = req.body.category;
	var description = req.body.description;
	var price = req.body.price;
	var id = req.body.id;
	listing.updateListing(title, category, description, price, id, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(200);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true })
		}
	});
});

app.delete('/listing/delete/', function (req, res) {//View a listing
	var id = req.body.id;

	listing.deleteListing(id, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(200);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true })
		}
	});
});

//Offers API
app.post('/offer/', verifyToken, function (req, res) {//View a listing
	var offer = req.body.offer;
	var fk_listing_id = req.body.fk_listing_id;
	var fk_offeror_id = req.id;
	var status = "pending";
	offers.addOffer(offer, fk_listing_id, fk_offeror_id, status, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(201);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true })
		}
	});
});

app.get('/offer/', verifyToken, function (req, res) {//View all offers
	var userid = req.id
	offers.getOffers(userid, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(201);
			res.setHeader('Content-Type', 'application/json');
			console.log(result)
			res.json({ success: true, result: result })
		}
	});
});

app.post('/offer/decision/', function (req, res) {//View all offers
	var status = req.body.status;
	var offerid = req.body.offerid;
	offers.AcceptOrRejectOffer(status, offerid, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(201);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true })
		}
	});
});

app.get('/offer/status/', verifyToken, function (req, res) {//View all offers
	var userid = req.id
	offers.getOfferStatus(userid, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(201);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true, result: result })
		}
	});
});

//Likes API
app.post('/likes/', verifyToken, function (req, res) {//View all offers
	var userid = req.id
	var listingid = req.body.listingid;
	likes.insertLike(userid, listingid, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(201);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true })
		}
	});
});

app.get('/likeorunlike/:listingid/', verifyToken, function (req, res) {//Like or Unlike
	var userid = req.id
	var listingid = req.params.listingid;
	likes.checklike(userid, listingid, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(200);
			if (result.length == 0) {
				likes.insertLike(userid, listingid, function (err, result) {
					if (err) {
						res.status(500);
						res.json({ success: false })
					} else {
						res.status(201);
						res.setHeader('Content-Type', 'application/json');
						res.json({ success: true, action: "liked" })
					}
				});
			} else {
				likes.deleteLike(userid, listingid, function (err, result) {
					if (err) {
						res.status(500);
						res.json({ success: false })
					} else {
						res.status(200);
						res.json({ success: true, action: "unliked" })
					}
				});
			}
		}
	});
});

app.get('/likes/:listingid/', function (req, res) {//View all offers
	var listingid = req.params.listingid;
	likes.getLike(listingid, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(200);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true, amount: result.length })
		}
	});
});

//Images API

let storage = multer.diskStorage({
	destination: function (req, file, callback) {

		callback(null, __dirname + "/../public")
	},
	filename: function (req, file, cb) {
		req.filename = file.originalname.replace(path.extname(file.originalname), '') + '-' + Date.now() + path.extname(file.originalname);
		cb(null, req.filename);
		
	}
});

let upload = multer({
	storage: storage, limits: { fileSize: 5 * 1024 * 1024 }
});//limits check if he file size is equal to or below 5mb


app.post('/images/:fk_product_id/', upload.single('myfile'), function (req, res) {
	var fk_product_id = req.params.fk_product_id;
	var name = req.filename;
	images.uploadImage(name,fk_product_id, function (err, result) {
		if (err) {
			res.status(500);
			res.json({success:false});
		} else {
			res.status(201);
			res.json({success:true});
		}
	});
});
module.exports = app;