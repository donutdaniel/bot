var path = require('path');
var express = require('express');
var app = express();
var pug = require('pug');
var passport = require('passport');
var flash = require('connect-flash');
// middleware
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var session = require('express-session');

// configuration ==================================================
// passport
require('./config/passport.js')(passport);
// express setup and middleware
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(__dirname + '/views'));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(expressValidator());
app.use(session({
	secret: 'thisisthesecret',
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// routes =========================================================
require('./app/routes.js')(app, passport);

// launch =========================================================
app.listen(port = process.env.port_web || process.env.PORT_WEB || 3000, function(){
  console.log('WEB: %s listening to http://[%s]:%s', app.name, this.address().address, this.address().port); 
});
