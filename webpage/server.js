require('dotenv-extended').load();
var express = require('express');
var app = express();
var router = express.Router();

var path = __dirname + '/';

app.get('/', function(req, res){
	res.sendFile(path + 'index.html');
});

// middleware for extracting story
var getStory = function(req, res, next){
	next();
}
app.use(getStory);

app.get('/:id', function(req, res){
	res.send('your id is: ' + req.params.id);
});

app.get('*',function(req, res){
  res.send('Error 404: Not Found');
});

app.listen(port = process.env.port_web || process.env.PORT_WEB || 3000, function(){
  console.log('WEB: %s listening to http://[%s]:%s', app.name, this.address().address, this.address().port); 
});