

require('dotenv').config();
require('newrelic');

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const routes = require('./routes/index');
const users = require('./routes/user');

const app = express();

const Twitter = require('twitter');

const env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.get('/remote', function (req, res) {
  res.sendfile(__dirname + '/public/orientation.html');
});

// view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));


// app.use('/', routes);
app.use('/users', users);
  
/// catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use((err, req, res, next) => {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
            title: 'error'
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {},
        title: 'error'
    });
});

// start server
app.set('port', process.env.PORT || 3000);

// setup sockets 
var server = require('http').Server(app);
var io = require('socket.io')(server);

io.on('connection', function (socket) {
  console.log('a user connected');

  socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
      console.log(data.text);
    });
    socket.on('disconnect', function(){
      console.log('user disconnected');
    });

    socket.on('chat message', function(msg){
      console.log('message: ' + msg);      
      io.emit('chat message', msg);
    });
  });

// twitter setup
var twitterStream;
var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  });

  var stream = client.stream('statuses/filter', {track: 'vancouver'});
  stream.on('data', function(event) {
    console.log(event.text);
    var dataPacket = {profile: event.user.profile_image_url, 
        text: event.text, 
        desc: event.user.description, 
        handle: event.user.screen_name };
    io.emit('twitter', JSON.stringify(dataPacket));
 });
   
  stream.on('error', function(error) {
    throw error;
  });

server.listen(app.get('port'));


module.exports = app;
