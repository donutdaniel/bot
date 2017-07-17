var mysql = require('mysql');
var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'bots'
});

connection.connect(function(err){
	if(err){
		console.log(err);
	}else{
		console.log('mysql connected');
	}
});

var sql = "CREATE TABLE users (pk_users INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255), password VARCHAR(255))";
connection.query(sql, function(err, result){
	if(err){
		console.log(err);
	}else{
		console.log('table created');
		console.log(result);
	}
})

sql = "CREATE TABLE stories (pk_stories INT AUTO_INCREMENT PRIMARY KEY, id VARCHAR(255), fk_users FOREIGN KEY REFERENCES users(pk_users))";
connection.query(sql, function(err, result){
	if(err){
		console.log(err);
	}else{
		console.log('table created');
		console.log(result);
	}
})