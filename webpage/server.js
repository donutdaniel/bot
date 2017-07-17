require('dotenv-extended').load();
var express = require('express');
var app = express();
var router = express.Router();
var mysql = require('mysql');
// mysql setup
var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'password',
	database: 'bots'
});

connection.connect(function(err){
	if(err){
		console.log(err);
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
	connection.query('SELECT * FROM users WHERE user =' + mysql.escape(user), function(req, res){
		if(err){
			console.log(err);
		}else{
			console.log('successful query');
			console.log(result);
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
	connection.query("SELECT * FROM stories WHERE user =" + mysql.escape(user) + " AND id =" + mysql.escape(id), function(err, result, fields){
		if(err){
			console.log(err);
		}else{
			console.log('successful query');
			console.log(result);
		}
	});
});

app.get('*',function(req, res){
  res.send('Error 404: Not Found');
});

app.listen(port = process.env.port_web || process.env.PORT_WEB || 3000, function(){
  console.log('WEB: %s listening to http://[%s]:%s', app.name, this.address().address, this.address().port); 
});

// var sql_insert = "INSERT INTO sampleTable (id, name) VALUES (" + mysql.escape(req.params.id) + ", " + mysql.escape(name) + ")";
// connection.query(sql_insert, function(err, result){
// 	if(err){
// 		console.log(err);
// 	}else{
// 		console.log('inserted: ' + id);
// 	}
// });