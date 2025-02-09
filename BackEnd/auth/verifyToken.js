

var jwt = require('jsonwebtoken');
var config = require('../config');

function verifyToken(req, res, next){

    var token = req.headers['authorization'];

    if(!token || !token.includes('Bearer')){ 
    
       res.status(403);
       return res.send({auth:'false', message:'Not authorized!'});
    }else{
       token=token.split('Bearer ')[1]; 
       jwt.verify(token, config.key, function (err, decoded) {
        if (err || decoded.exp < Date.now() / 1000) {
            return res.status(403).json({ auth: false, message: 'Token expired or invalid!' });
        }
        req.id = decoded.id;
        next();
    });
    }
}

module.exports = verifyToken;