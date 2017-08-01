module.exports = function(app, passport){
	// Landing page
	app.get('/', function(req, res){
		res.render('index', {
			message: 'Hello! Welcome to bot builder',
		});
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
			if(!res_val.isEmpty()){ // error
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
			}else{ // attempt add
				passport.authenticate('local-signup', {
					successRedirect: '/profile',
					failureRedirect: '/signup',
					failureFlash: true
				})(req, res, next);
			}
		});
	});
/*	app.post('/signup', function(req, res){
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
			if(!res_val.isEmpty()){ // error
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
			}else{ // attempt add
				var sql_insert = 'INSERT INTO users (username, password) VALUES (' + mysql.escape(username) + ', ' + mysql.escape(hash(password)) + ')';
				connection.query(sql_insert, function(err_add, res_add){
					if(err_add){
						console.log('user insertion error: ' + err_add.code);
						var msg = [err_add.code];
						if(err_add.code === 'ER_DUP_ENTRY'){
							msg = ['username taken']
						}
						res.render('signup', {
							username: username,
							password: password,
							confirm_password: confirm_password,
							messages: msg
						});
					}else{
						console.log('successfully inserted: ' + username);
						res.render('signup', {
							messages: ['success! user created']
						});
					}
				});
			}
		});
	});*/

	// Login
	app.get('/login', function(req, res){
		res.render('login', {messages: req.flash('loginMessage')});
	});
	app.post('/login', function(req, res, next){
		passport.authenticate('local-login', {
			successRedirect: '/profile',
			failureRedirect: '/login',
			failureFlash: true
		})(req, res, next);
	});
/*	app.post('/login', function(req, res){
		req.sanitizeBody('username').trim();
		req.sanitizeBody('password').trim();
		var username = req.body.username;
		var password = req.body.password;
		req.getValidationResult().then(function(res_val){ // validation check
			if(!res_val.isEmpty()){ // error
				var res_val_arr = res_val.array();
				var msg_arr = [];
				for (var i = 0; i < res_val_arr.length; i++){
					msg_arr.push(res_val_arr[i].msg);
				}
				res.render('login', {
					username: username,
					password: password, 
					messages: msg_arr
				});
			}else{ // attempt add
				var sql_select = 'SELECT * FROM users WHERE username =' + mysql.escape(username) + ' AND password=' + mysql.escape(hash(password));
				connection.query(sql_select, function(err_get, res_get){
					if(err_get){
						console.log('user retrieval error: ' + err_get.code);
						var msg = [err_get.code];
						res.render('login', {
							username: username,
							password: password,
							confirm_password: confirm_password,
							messages: msg
						});
					}else{
						console.log('successful retrieval: ' + username);
						if(res_get.length === 0){
							res.render('login', {
								username: username,
								password: password,
								messages: ['incorrect information']
							});
						}else{
							res.redirect('/' + username);
						}
					}
				});
			}
		});
	});*/

	// Logout
	app.get('/logout', function(req, res){
		req.logout();
		res.redirect('/');
	});


	// Profile
	app.get('/profile', isLoggedIn, function(req, res){
		res.render('profile', {
			user: req.user.username
		});
	});

	// User Account Page
	app.get('/:user', function(req, res){
		var user = req.params.user;
		if(user === 'favicon.ico'){
			return;
		}
		connection.query('SELECT * FROM users WHERE username =' + mysql.escape(user), function(err, result, fields){
			if(err){
				console.log('retrieve error: ' + err.code);
				res.send('error retrieving data');
			}else{
				console.log('successful retrieval');
				if(result.length === 0){
					res.send('user not found');
				}else{
					res.send(result);
				}
			}
		});
	});

	// Specific Model Page
	app.get('/:user/:id', function(req, res){
		var user = req.params.user;
		var id = req.params.id;
		console.log(req.params);
		if(id === 'favicon.ico'){
			return;
		}
		connection.query("SELECT * FROM stories WHERE id =" + mysql.escape(id) + " AND fk_user =" + mysql.escape(user), function(err, result, fields){
			if(err){
				console.log('retrieve error: ' + err.code);
				res.send('error retrieving data');
			}else{
				console.log('successful query');
				if(result.length === 0){
					res.send('story not found');
				}else{
					res.send(result);
				}
			}
		});
	});

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