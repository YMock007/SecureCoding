var db = require('./databaseConfig.js');
var config = require('../config.js');
var jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
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


	//----------------------------------------------------------
	// Fixed codes for login
	//----------------------------------------------------------
	// loginUser: function (email, password, callback) {
	// 	const conn = db.getConnection();

	// 	conn.connect(function (err) {
	// 		if (err) {
	// 			console.log(err);
	// 			return callback(err, null, null);
	// 		}

	// 		console.log("Connected!");

	// 		// Get the user by email
	// 		const sql = 'SELECT * FROM users WHERE email = ?';
	// 		conn.query(sql, [email], async function (err, result) {
	// 			conn.end();

	// 			if (err) {
	// 				console.log("Err: " + err);
	// 				return callback(err, null, null);
	// 			}

	// 			if (result.length === 1) {
	// 				const user = result[0];

	// 				try {
	// 					// Compare hashed password with the input password
	// 					const passwordMatch = await bcrypt.compare(password, user.password);

	// 					if (passwordMatch) {
	// 						// Generate JWT token
	// 						const token = jwt.sign({ id: user.id }, config.key, { expiresIn: 86400 });
	// 						console.log("@@token " + token);
	// 						return callback(null, token, user);
	// 					} else {
	// 						console.log("Email/Password does not match");
	// 						const err2 = new Error("Email/Password does not match.");
	// 						err2.statusCode = 401;
	// 						return callback(err2, null, null);
	// 					}
	// 				} catch (compareErr) {
	// 					console.log("Error comparing password:", compareErr);
	// 					return callback(compareErr, null, null);
	// 				}
	// 			} else {
	// 				console.log("User not found");
	// 				const err2 = new Error("Email/Password does not match.");
	// 				err2.statusCode = 401;
	// 				return callback(err2, null, null);
	// 			}
	// 		});
	// 	});
	// },

	updateUser: function (username, firstname, lastname, id, callback) {

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
		const conn = db.getConnection();

		conn.connect(async function (err) {
			if (err) {
				console.log(err);
				return callback(err, null);
			} else {
				console.log("Connected!");

				// Hash the password before inserting
				try {
					const saltRounds = 10; // Adjust as needed
					const hashedPassword = await bcrypt.hash(password, saltRounds);

					const sql = "INSERT INTO users(username, email, password, profile_pic_url, role) VALUES (?, ?, ?, ?, ?)";
					conn.query(sql, [username, email, hashedPassword, profile_pic_url, role], function (err, result) {
						conn.end();

						if (err) {
							console.log(err);
							return callback(err, null);
						} else {
							return callback(null, result);
						}
					});

				} catch (hashErr) {
					console.log("Error hashing password:", hashErr);
					return callback(hashErr, null);
				}
			}
		});
	}

};


module.exports = userDB;