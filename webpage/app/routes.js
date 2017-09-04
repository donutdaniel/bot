var parser = require('../../util/parser.js');
var buildApp = require('../../util/buildApp.js');
var circularJSON = require('circular-json')
var mysql = require('mysql');
// mysql setup
var dbconfig = require('../config/database.js');
var connection = mysql.createConnection(dbconfig.connection);
connection.connect(function(err){
	if(err){
		console.log('mysql error');
	}else
{		console.log('mysql connected');
	}
});
connection.query('USE ' + dbconfig.database);

module.exports = function(app, passport){
	// Landing page
	app.get('/', function(req, res){
		if(req.isAuthenticated()){
			res.redirect('/profile');
		}else{
			res.render('index', {
				message: 'Hello! Welcome to bot builder',
			});
		}
	});

	// Signup
	app.get('/signup', function(req, res){
		res.render('signup', {messages: req.flash('signupMessage')});
	});
	app.post('/signup', function(req, res, next){
		req.sanitizeBody('username').trim();
		req.checkBody('username', 'username required').notEmpty();
		req.checkBody('username', 'username cannot contain spaces').matches(/^\S*$/);
		req.sanitizeBody('password').trim();
		req.checkBody('password', 'password required').notEmpty()
		req.checkBody('password', 'password cannot contain spaces').matches(/^\S*$/);
		req.checkBody('password', 'password length must be between 8 and 30').len(8, 30);
		req.checkBody('confirm_password', 'passwords do not match').matches(req.body.password);
		var username = req.body.username;
		var password = req.body.password;
		var confirm_password = req.body.confirm_password;
		req.getValidationResult().then(function(res_val){ // validation check
					if(res_val.isEmpty()){ // attempt add
						passport.authenticate('local-signup', function(err, user, info){
					if(err){
						return next(err);
					}
					if(!user){
						return res.render('signup', {
							username: req.body.username,
							password: req.body.password,
							confirm_password: req.body.confirm_password,
							messages: info.messages
						});
					}
					req.logIn(user, function(err){
						if(err){
							return next(err);
						}
						return res.redirect('/profile');
					});
				})(req, res, next);
			}else{ // error 
				var res_val_arr = res_val.array();
				var msg_arr = [];
				for (var i = 0; i < res_val_arr.length; i++){
					msg_arr.push(res_val_arr[i].msg);
				}
				res.render('signup', {
					username: username,
					password: password, 
					confirm_password: confirm_password, 
					messages: msg_arr
				});
			}
		});
	});

	// Login
	app.get('/login', function(req, res){
		res.render('login', {messages: req.flash('loginMessage')});
	});
	app.post('/login', function(req, res, next){
		passport.authenticate('local-login', function(err, user, info){
			if(err){
				return next(err);
			}
			if(!user){
				return res.render('login', {
					username: req.body.username,
					password: req.body.password,
					messages: info.messages,
				});
			}
			req.logIn(user, function(err){
				if(err){
					return next(err);
				}
				return res.redirect('/profile');
			});
		})(req, res, next);
	});

	// Logout
	app.get('/logout', function(req, res){
		req.logout();
		res.redirect('/');
	});


	// Profile
	app.get('/profile', isLoggedIn, function(req, res){
		connection.query('SELECT * FROM stories WHERE fk_user =' + mysql.escape(req.user.pk_user), function(err_get, res_get){
			var stories = [];
			if(err_get){
				console.log('retrieve error: ' + err_get.code);
				req.flash(err_get);
			}else{
				if(res_get.length){
					stories = res_get;
				}
			}
			res.render('profile', {
				user: req.user.username,
				stories: stories,
				create_messages: req.flash('create_messages')
			});
		});
	});

	// Specific story page
	app.get('/:id', isLoggedIn, function(req, res){
		connection.query('SELECT * FROM stories WHERE id =' + mysql.escape(req.params.id) + 'AND fk_user = ' + mysql.escape(req.user.pk_user), function(err_get, res_get){
			if(err_get){
				console.log('retrieve error: ' + err_get.code);
			}else{
				console.log('successful retrieval');
				if(res_get.length){
					var story_ = parser.safeParse('stories/' + res_get[0].id + '.txt');
					res.render('manage', {
						name: res_get[0].name,
						id: res_get[0].id,
						story: story_
					});
				}else{
					res.redirect('/profile');
				}
			}
		});
	});

	// Story requests
	app.post('/create', isLoggedIn, function(req, res){
		req.sanitizeBody('name').trim();
		req.checkBody('name', 'name required').notEmpty();
		var name = req.body.name;
		var description = req.body.description
		req.getValidationResult().then(function(res_val){
			if(res_val.isEmpty()){
				// create story, NLP unit
				var appData = new Object();
				appData.name = name;
				appData.description = description;
				appData.culture = 'en-us';
				buildApp.request(new story(name, description, undefined, '1.0'), '/luis/api/v2.0/apps/', 'POST', function(story_, data_){
					story_.id = JSON.parse(data_);
					connection.query('INSERT into stories (name, id, fk_user) VALUES (' + mysql.escape(name) + ', ' + mysql.escape(story_.id) + ', ' + mysql.escape(req.user.pk_user) + ')', function(err_add, res_add){
						if(err_add){
							console.log('insert error: ' + err_add.code);
						}else{
							console.log('successful insert');
							res.redirect('/' + story_.id);
						}
					});
					story_.save();
				}, appData);
			}else{
				var res_val_arr = res_val.array();
				var msg_arr = [];
				for (var i = 0; i < res_val_arr.length; i++){
					msg_arr.push(res_val_arr[i].msg);
				}
				req.flash('create_messages', msg_arr);
				res.redirect('/profile');
			}
		});
	});

	// save story
	app.post('/:id/save', isLoggedIn, function(req, res){

	});

	// Default
	app.get('*',function(req, res){
	  res.send('Error 404: Not Found');
	});
}

// helper functions
function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect('/');
}