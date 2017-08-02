var LocalStrategy = require('passport-local').Strategy;
var mysql = require('mysql');
var sqltools = require('../../util/sqltools.js');
var hash = require('../../util/hash.js');
var dbconfig = require('./database.js');
// mysql setup
var connection = mysql.createConnection(dbconfig.connection);
connection.connect(function(err){
	if(err){
		console.log('mysql error');
	}else
{		console.log('mysql connected');
	}
});
connection.query('USE ' + dbconfig.database);

module.exports = function(passport){
	// serialize
	passport.serializeUser(function(user, done){
		done(null, user.pk_user);
	});

	// deserialize
	passport.deserializeUser(function(id, done){
		connection.query('SELECT * FROM users WHERE pk_user =' + mysql.escape(id), function(err, res){
			done(err, res[0]);
		});
	});

	// signup strategy
	passport.use('local-signup', new LocalStrategy({
		usernameField: 'username',
		passwordField: 'password',
		passReqToCallback: true
	},
	function(req, username, password, done){
		var sql_insert = 'INSERT INTO users (username, password) VALUES (' + mysql.escape(username) + ', ' + mysql.escape(hash(password)) + ')';
		connection.query(sql_insert, function(err_add, res_add){
			if(err_add){
				console.log('user insertion error: ' + err_add.code);
				if(err_add.code === 'ER_DUP_ENTRY'){
					return done(null, false, req.flash('signupMessage', 'username taken'));
				}else{
					return done(err_add);
				}
			}else{
				console.log('successfully inserted: ' + username);
				var newUser = new Object();
				newUser.pk_user = res_add.insertId;
				newUser.username = username;
				newUser.password = password;
				return done(null, newUser);
			}
		});
	}));

	//login strategy
	passport.use('local-login', new LocalStrategy({
		usernameField: 'username',
		passwordField: 'password',
		passReqToCallback: true
	},
	function(req, username, password, done){
		var sql_select = 'SELECT * FROM users WHERE username =' + mysql.escape(username) + ' AND password=' + mysql.escape(hash(password));
		connection.query(sql_select, function(err_get, res_get){
			if(err_get){
				console.log('user retrieval error: ' + err_get.code);
				return done(err_get);
			}else{
				console.log('successful retrieval: ' + username);
				if(res_get.length){
					console.log(res_get[0]);
					return done(null, res_get[0]);
				}else{
					return done(null, false, req.flash('loginMessage', 'incorrect information'));
				}
			}
		});
	}));
};