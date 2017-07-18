var mysql = require('mysql');

// adds a new user-password pair into the 'users' table
function addUser(connection, username, password){
	var sql_insert = 'INSERT INTO users (username, password) VALUES (' + mysql.escape(username) + ', ' + mysql.escape(password) + ')';
	connection.query(sql_insert, function(err, result){
		if(err){
			console.log(err);
		}else{
			console.log('successfully inserted: ' + username);
		}
	});
}

// adds a new story id and foreign key user into the 'stories' table
function addStory(connection, id, fk_user){
	var sql_insert = 'INSERT INTO stories (id, fk_user) VALUES (' + mysql.escape(id) + ', ' + mysql.escape(fk_user) + ')';
	connection.query(sql_insert, function(err, result){
		if(err){
			console.log(err);
		}else{
			console.log('successfully inserted: ' + username);
		}
	});

}

exports.addUser = addUser;
exports.addStory = addStory;