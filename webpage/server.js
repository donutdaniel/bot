require('dotenv-extended').load();
var express = require('express');
var app = express();
var router = express.Router();

// custom js
var sqltools = require('../util/sqltools.js');

// mysql setup
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

// express setup
var path = __dirname + '/';

app.get('/', function(req, res){
	res.sendFile(path + 'index.html');
});

// middleware for extracting story
// var getStory = function(req, res, next){
// 	next();
// }
// app.use(getStory);

app.get('/:user/', function(req, res){
	var user = req.params.user;
	if(user === 'favicon.ico'){
		return;
	}
	connection.query('SELECT * FROM users WHERE username =' + mysql.escape(user), function(err, result, fields){
		if(err){
			console.log(err);
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

app.get('/:user/:id', function(req, res){
	var user = req.params.user;
	var id = req.params.id;
	console.log(req.params);
	if(id === 'favicon.ico'){
		return;
	}
	connection.query("SELECT * FROM stories WHERE id =" + mysql.escape(id) + " AND fk_user =" + mysql.escape(user), function(err, result, fields){
		if(err){
			console.log(err);
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