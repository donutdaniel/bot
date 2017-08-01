var LocalStrategy = require('passport-local').Strategy;
var mysql = require('mysql');
module.exports = function(passport, connection){
	passport.serializeUser(function(user, done){
		done(null, user.username);
	});
	passport.deserializeUser(function(username, done){
		connection.query('SELECT * FROM users where username =' + mysql.escape(username), function(err, rows){
			done(err, rows[0]);
		});
	});
	passport.use('local-signup', new LocalStrategy({
		usernameField: 'username',
		passwordField: 'password',
		passReqToCallback: true
	},
	function(req, username, password, done){
		connection.query('SELECT * FROM users where username =' + mysql.escape(username))
	}));
};