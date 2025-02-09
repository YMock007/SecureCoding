

var db = require('./databaseConfig.js');

var listingDB = {
    addListing: function (title, category, description, price, fk_poster_id, callback) {
        console.log(description);
        var conn = db.getConnection();

        conn.connect(function (err) {
            if (err) {
                console.log(err);
                return callback(err, null);
            }
            else {
                var sql = 'insert into listings(title,category,description,price,fk_poster_id) values(?,?,?,?,?)';
                conn.query(sql, [title, category, description, price, fk_poster_id], function (err, result) {
                    conn.end();
                    if (err) {
                        console.log("Err: " + err);
                        return callback(err, null);
                    } else {
                        return callback(null, result)
                    }
                })

            }
        })
    },
    getUserListings: function (userid, callback) {
        var conn = db.getConnection();
        conn.connect(function (err) {
            if (err) {
                console.log(err);
                return callback(err, null);
            } else {
                var sql = `select l.title,l.category,l.price,l.id,i.name from listings l,images i where l.id = i.fk_product_id and fk_poster_id = ?`;
                conn.query(sql, [userid], function (err, result) {
                    conn.end()
                    if (err) {
                        console.log(err);
                        return callback(err, null);
                    } else {
                        return callback(null, result)
                    }
                });
            }

        })
    },
    //----------------------------------------------------------------
    //                  Original Code
    //----------------------------------------------------------------
    // getListing: function (id, callback) {
    //     var conn = db.getConnection();
    //     conn.connect(function (err) {
    //         if (err) {
    //             console.log(err);
    //             return callback(err, null);
    //         } else {
    //             var sql = "select l.title,l.category,l.description,l.price,u.username,l.fk_poster_id,i.name from listings l,users u,images i where l.id = ? and l.id = i.fk_product_id and l.fk_poster_id = u.id";
    //             conn.query(sql, [id], function (err, result) {
    //                 conn.end()
    //                 if (err) {
    //                     console.log(err);
    //                     return callback(err, null);
    //                 } else {
    //                     return callback(null, result)
    //                 }
    //             });
    //         }

    //     })
    // },

    //--------------------------------------------------------------------------
    // Fixed Code
    //--------------------------------------------------------------------------
    getListing: function (id, userId, callback) {
        var conn = db.getConnection();
        conn.connect(function (err) {
            if (err) {
                console.log(err);
                return callback(err, null);
            } else {
                // Retrieve listing details along with the poster's ID
                var sql = "select l.title,l.category,l.description,l.price,u.username,l.fk_poster_id,i.name from listings l,users u,images i where l.id = ? and l.id = i.fk_product_id and l.fk_poster_id = u.id";            conn.query(sql, [id], function (err, result) {
                    conn.end();
                    if (err) {
                        console.log(err);
                        return callback(err, null);
                    } else {
                        if (result.length === 0) {
                            return callback(null, { error: "Listing not found" });
                        }

                        let isOwner = result[0].fk_poster_id === userId;

                        return callback(null, { result, isOwner });
                    }
                });
            }
        });
    },
    //--------------------------------------------------------------------------
    // Fixed Code
    //--------------------------------------------------------------------------
    getOtherUsersListings: function (query, userid, callback) {
        var conn = db.getConnection();
        conn.connect(function (err) {
            if (err) {
                console.log(err);
                return callback(err, null);
            } else {
                // Validate input: Ensure query is alphanumeric and allows spaces only
                if (!/^[a-zA-Z0-9 ]*$/.test(query)) {
                    return callback({ error: "Invalid search query" }, null);
                }
    
                // Use parameterized query to prevent SQL injection
                var sql = "SELECT l.title, l.category, l.price, l.id, i.name FROM listings l " +
                          "JOIN images i ON l.id = i.fk_product_id " +
                          "WHERE l.fk_poster_id != ? AND l.title LIKE ?";
    
                // Safely append wildcards for LIKE search
                let safeQuery = `%${query}%`;
    
                conn.query(sql, [userid, safeQuery], function (err, result) {
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
        //--------------------------------------------------------------------------
    // Original Code
    //--------------------------------------------------------------------------
    // getOtherUsersListings: function (query, userid, callback) {
    //     var conn = db.getConnection();
    //     conn.connect(function (err) {
    //         if (err) {
    //             console.log(err);
    //             return callback(err, null);
    //         } else {
    //             var sql = "select l.title,l.category,l.price,l.id,i.name from listings l,images i where l.id = i.fk_product_id and l.fk_poster_id != ? and l.title like '%" + query + "%'";
    //             conn.query(sql, [userid], function (err, result) {
    //                 conn.end()
    //                 if (err) {
    //                     console.log(err);
    //                     return callback(err, null);
    //                 } else {
    //                     return callback(null, result)
    //                 }
    //             });
    //         }

    //     })
    // },
    //--------------------------------------------------------------------------
    // Original Code
    //--------------------------------------------------------------------------
    // updateListing: function (title, category, description, price, id, callback) {
    //     var conn = db.getConnection();
    //     conn.connect(function (err) {
    //         if (err) {
    //             console.log(err);
    //             return callback(err, null);
    //         } else {
    //             var sql = "update listings set title = ?,category = ?,description = ?,price = ? where id = ?";
    //             conn.query(sql, [title, category, description, price, id], function (err, result) {
    //                 conn.end()
    //                 if (err) {
    //                     console.log(err);
    //                     return callback(err, null);
    //                 } else {
    //                     return callback(null, result)
    //                 }
    //             });
    //         }

    //     })
    // },
    
    //--------------------------------------------------------------------------
    // Fixed Code
    //--------------------------------------------------------------------------
    updateListing: function (title, category, description, price, id,userId, callback) {
        var conn = db.getConnection();
        conn.connect(function (err) {
            if (err) {
                console.log(err);
                return callback(err, null);
            } else {
                // First, check if the listing belongs to the authenticated user
                var checkOwnershipSql = "SELECT fk_poster_id FROM listings WHERE id = ?";
                conn.query(checkOwnershipSql, [id], function (err, results) {
                    if (err) {
                        conn.end();

                        return callback(err, null);
                    }
                    console.log(results)
                    // If listing not found or user is not the owner, return an unauthorized error
                    if (results.length === 0 || results[0].fk_poster_id !== userId) {
                        conn.end();
                        return callback({ error: "Unauthorized action" }, null);
                    }

                    // Proceed with the update if ownership is verified
                    var updateSql = "UPDATE listings SET title = ?, category = ?, description = ?, price = ? WHERE id = ? AND fk_poster_id = ?";
                    conn.query(updateSql, [title, category, description, price, id, userId], function (err, result) {
                        conn.end();
                        if (err) {
                            console.log(err);
                            return callback(err, null);
                        } else {
                            return callback(null, result);
                        }
                    });
                });
            }
        });
    },
    //------------------------------------------------
    //          Original 
    //------------------------------------------------
    // deleteListing: function (id, callback) {
    //     var conn = db.getConnection();
    //     conn.connect(function (err) {
    //         if (err) {
    //             console.log(err);
    //             return callback(err, null);
    //         } else {
    //             var sql = `delete from listings where id=${id}`;
    //             conn.query(sql, [], function (err, result) {
    //                 conn.end()
    //                 if (err) {
    //                     console.log(err);
    //                     return callback(err, null);
    //                 } else {
    //                     return callback(null, result)
    //                 }
    //             });
    //         }

    //     })
    // },

    //--------------------------------------------------------------------------
    // Fixed Code
    //--------------------------------------------------------------------------
    deleteListing: function (userId, id, callback) {
        var conn = db.getConnection();
        conn.connect(function (err) {
            if (err) {
                console.log(err);
                return callback(err, null);
            } else {
                // First, check if the user is the owner of the listing
                var checkOwnershipSql = "SELECT fk_poster_id FROM listings WHERE id = ?";
                conn.query(checkOwnershipSql, [id], function (err, results) {
                    if (err) {
                        conn.end();
                        console.log(err);
                        return callback(err, null);
                    }
    
                    // If listing not found or user is not the owner, return an unauthorized error
                    if (results.length === 0 || results[0].fk_poster_id !== userId) {
                        conn.end();
                        return callback({ error: "Unauthorized action" }, null);
                    }
    
                    // Proceed with deletion if ownership is verified
                    var deleteSql = "DELETE FROM listings WHERE id = ? AND fk_poster_id = ?";
                    conn.query(deleteSql, [id, userId], function (err, result) {
                        conn.end();
                        if (err) {
                            console.log(err);
                            return callback(err, null);
                        } else {
                            return callback(null, result);
                        }
                    });
                });
            }
        });
    },
    
}

module.exports = listingDB;