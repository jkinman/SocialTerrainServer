

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
  res.sendfile(__dirname + '/public/orientation.html');
});

app.get('/a', function (req, res) {
  res.sendfile(__dirname + '/app/index.html');
});

app.get('/remote', function (req, res) {
  res.sendfile(__dirname + '/public/orientation.html');
});

app.get('/r', function (req, res) {
  res.sendfile(__dirname + '/public/orientation.html');
});
let userDefinedTwitterSearch;
app.get('/app', function (req, res) {
  res.sendfile(__dirname + '/app/index.html');
  userDefinedTwitterSearch = req.query.ts;
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
app.use(express.static(path.join(__dirname, 'app')));
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

let connections = [];

io.on('connection', function (socket) {
  console.log('a user connected - ' + socket.id);
  // console.log(socket)
  connections = [socket.id];
  var clients = io.sockets.clients();

  // for (var idKey in clients.connected) {
  //   if( idKey !== socket.id){
  //     console.log( 'idKey:'+idKey+ "   socket.id:"+socket.id)
  //     clients.connected[idKey].disconnect();
  //   }
  // }
  
  // socket.emit('news', { hello: 'world' });
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

    socket.on( 'orientation', function(orientation) {
      io.emit( 'orientation', orientation);
    });

    socket.on( 'remoteMessage', function(data) {
      io.emit( 'remoteMessage', data);
    });

    socket.on( 'screenrotation', function(orientation) {
      io.emit( 'screenrotation', orientation);
    });

    var params = {
      screen_name: 'CPyvr',
      q: 'creative pulse #CPyvr OR #creativepulse from:CPyvr to:CPyvr @CPyvr since:2012-01-01',
      count: 20,
      include_entities: true,
    };

    // q=%23CPyvr%20OR%20%23creativepulse%20to%3ACPyvr%20%40CPyvr
    // q=#CPyvr OR #creativepulse to:CPyvr @CPyvr
    // client.get('statuses/user_timeline', params, (error, tweets, response)=>{

      client.get('/search/tweets', params, (error, tweets, response)=>{
        if(!error && Array.isArray(tweets) && tweets.length){
          tweets.map((t)=> console.log(t.text ))
          io.emit('twitter', JSON.stringify(tweets));
        }
        else if( ! tweets.length ) {
          client.get('statuses/user_timeline', params, (error, tweets, response)=>{
            if(!error && Array.isArray(tweets) && tweets.length){
              tweets.map((t)=> console.log(t.text ))
              io.emit('twitter', JSON.stringify(tweets)); 
            }
          })
        }
      })
  
  });

// twitter setup
var twitterStream;
var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

  var stream = client.stream('statuses/filter', {track: 'CPyvr'});
  stream.on('data', function(event) {
    console.log(event.text);
    io.emit('twitter', JSON.stringify(event));
 });

  stream.on('error', function(error) {
    console.log( error );
    // throw error;
  });

server.listen(app.get('port'));


module.exports = app;
