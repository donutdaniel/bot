require('dotenv-extended').load();
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
var path = __dirname + '/';
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(expressValidator());

// Landing Page
app.get('/', function(req, res){
	res.sendFile(path + 'views/index.html');
});

// Create new user
app.get('/signup', function(req, res){
	res.sendFile(path + 'views/signup.html');
});
app.post('/signup', function(req, res){
	var username = req.body.username;
	var password = req.body.password;
	connection.query('INSERT INTO users (username, password) VALUES (' + mysql.escape(username) + ', ' + mysql.escape(password) + ')', function(err, result){
		if(err){
			console.log('insertion error: ' + err.code);
		}else{
			console.log('successful user insert');
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