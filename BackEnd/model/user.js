var db = require('./databaseConfig.js');
var config = require('../config.js');
var jwt = require('jsonwebtoken');

var userDB = {

	loginUser: function (email, password, callback) {

		var conn = db.getConnection();

		conn.connect(function (err) {
			if (err) {
				console.log(err);
				return callback(err, null);
			}
			else {
				console.log("Connected!");

				var sql = 'select * from users where email = ? and password=?';
				conn.query(sql, [email, password], function (err, result) {
					conn.end();

					if (err) {
						console.log("Err: " + err);
						return callback(err, null, null);

					} else {
						var token = "";

						if (result.length == 1) {
							token = jwt.sign({ id: result[0].id }, config.key, {
								expiresIn: 86400 //expires in 24 hrs
							});
							console.log("@@token " + token);
							return callback(null, token, result);
						} //if(res)
						else {
							console.log("email/password does not match");
							var err2 = new Error("Email/Password does not match.");
							err2.statusCode = 404;
							console.log(err2);
							return callback(err2, null, null);
						}
					}  //else
				});
			}
		});
	},

	updateUser: function (username, firstname, lastname, id, callback) {
		// Define validation regex patterns
		const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/; // Alphanumeric + underscore, 3-30 characters
		const nameRegex = /^[a-zA-Z\s]{2,30}$/;       // Alphabetic + spaces, 2-30 characters

		// Validate inputs
		if (!usernameRegex.test(username)) {
			return callback(new Error("Invalid username: Only alphanumeric characters and underscores are allowed (3-30 characters)."), null);
		}

		if (!nameRegex.test(firstname)) {
			return callback(new Error("Invalid first name: Only alphabetic characters and spaces are allowed (2-30 characters)."), null);
		}

		if (!nameRegex.test(lastname)) {
			return callback(new Error("Invalid last name: Only alphabetic characters and spaces are allowed (2-30 characters)."), null);
		}

		var conn = db.getConnection();
		conn.connect(function (err) {
			if (err) {
				console.log(err);
				return callback(err, null);
			} else {
				console.log("Connected!");

				var sql = "update users set username = ?,firstname = ?,lastname = ? where id = ?;";

				conn.query(sql, [username, firstname, lastname, id], function (err, result) {
					conn.end();

					if (err) {
						console.log(err);
						return callback(err, null);
					} else {
						console.log("No. of records updated successfully: " + result.affectedRows);
						return callback(null, result.affectedRows);
					}
				})
			}
		})
	},

	addUser: function (username, email, password, profile_pic_url, role, callback) {

		var conn = db.getConnection();

		conn.connect(function (err) {
			if (err) {
				console.log(err);
				return callback(err, null);
			} else {


				console.log("Connected!");
				var sql = "Insert into users(username,email,password,profile_pic_url,role) values(?,?,?,?,?)";
				conn.query(sql, [username, email, password, profile_pic_url, role], function (err, result) {
					conn.end();

					if (err) {
						console.log(err);
						return callback(err, null);
					} else {
						return callback(null, result);
					}
				});

			}
		});
	},
};


module.exports = userDB;