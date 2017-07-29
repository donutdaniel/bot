require('dotenv-extended').load();
var path = require('path');
var pug = require('pug');
var express = require('express');
var app = express();
var router = express.Router();
// middleware
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
// mysql databasing setup
var mysql = require('mysql');
var connection = mysql.createConnection({
	host: process.env.SQL_HOST,
	user: process.env.SQL_USER,
	password: process.env.SQL_PASS,
	database: process.env.SQL_DB
});
connection.connect(function(err){
	if(err){
		console.log('mysql error');
	}else{
		console.log('mysql connected');
	}
});
// custom js
var sqltools = require('../util/sqltools.js');

// express setup and middleware
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(expressValidator());

// Landing Page
app.get('/', function(req, res){
	res.render('index', {
		title: 'Welcome!',
		message: 'Hello!',
	});
});

// Create new user
app.get('/signup', function(req, res){
	res.render('signup', {results: []});
});
app.post('/signup', function(req, res){
	req.checkBody('username', 'username required').notEmpty();
	req.checkBody('username', 'username cannot contain spaces').matches(/^\S*$/);
	req.sanitizeBody('username').escape();
	req.sanitizeBody('username').trim();
	req.checkBody('password', 'password required').notEmpty()
	req.checkBody('password', 'password cannot contain spaces').matches(/^\S*$/);
	req.checkBody('password', 'password length must be between 8 and 30').len(8, 30);
	req.checkBody('confirm_password', 'passwords do not match').matches(req.body.password);
	req.sanitizeBody('password').escape();
	req.sanitizeBody('password').trim();
	var username = req.body.username;
	var password = req.body.password;
	var confirm_password = req.body.confirm_password;
	// validation check
	req.getValidationResult().then(function(res_val){
		if(!res_val.isEmpty()){ // error
			res.render('signup', {
				username: username,
				password: password, 
				confirm_password: confirm_password, 
				results: res_val.array()
			});
			return;
		}else{ // attempt add
			var sql_insert = 'INSERT INTO users (username, password) VALUES (' + mysql.escape(username) + ', ' + mysql.escape(password) + ')';
			connection.query(sql_insert, function(err_add, res_add){
				if(err_add){
					console.log('user insertion error: ' + err_add.code);
					var msg = err_add.code;
					if(err_add.code === 'ER_DUP_ENTRY'){
						msg = 'username taken'
					}
					res.render('signup', {
						username: username,
						password: password,
						confirm_password: confirm_password,
						results: [{msg: msg}]
					});
				}else{
					console.log('successfully inserted: ' + username);
					res.render('signup', {
						results: [{msg: 'success! user created'}]
					});
				}
			});
		}
	});
});

// User Account Page
app.get('/:user/', function(req, res){
	var user = req.params.user;
	if(user === 'favicon.ico'){
		return;
	}
	connection.query('SELECT * FROM users WHERE username =' + mysql.escape(user), function(err, result, fields){
		if(err){
			console.log('retrieve error: ' + err.code);
			res.send('error retrieving data');
		}else{
			console.log('successful query');
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

app.listen(port = process.env.port_web || process.env.PORT_WEB || 3000, function(){
  console.log('WEB: %s listening to http://[%s]:%s', app.name, this.address().address, this.address().port); 
});