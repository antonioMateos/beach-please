//'use strict';
var express = require('express'),
	app     = express(),
	path    = require('path'),
	http	= require('http').Server(app),
  io = require("socket.io")(http), // app or http
	bodyParser = require('body-parser'),
  request = require('request'), // AJAX CORS
  //(methodOverride = require("method-override");

console.log('- - - - Iniciando entorno');
// CORS --> Cabeceras correctas
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
// Parsers --> Poder mandar y recibir JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//app.use(methodOverride());

console.log('- - - - Middlewares cargados...');

console.log('- - - - FRONT ROUTES');
app.use(express.static(__dirname + '/'));

app.get('/', function (request, response, next) {
	response.sendFile(path.join(__dirname+'/index.html'));
});

console.log('- - - - END FRONT ROUTES');

// AEMT SERVICE CONFIG
aemt_config = require('./aemt_config') // <-- CONFIG file
// <-- TO DO > Environment variables

//SOCKET IO
console.log('- - - - SOCKET IO');

io.on('connection', function(socket){

  //START CONNECTION
  var msg = 'Server ON';
  socket.emit('connect',msg);

  //URL SEARCH from front
  socket.on('start',function(data){

    console.log("CALLING AEMET",data);

    var apiKey = aemt_config.service.apiKey;
    // "https://opendata.aemet.es/opendata/api/prediccion/especifica/playa/1500401/?api_key=";
    var url = data; 

    var options = {
      method: 'GET',
      "rejectUnauthorized": false,
      url: data,
      qs: { 'api_key': apiKey },
      headers: 
       { 'cache-control': 'no-cache' }
    };

    request(options, function (error, response, body) {
      //if (error) throw new Error(error);
      if(error) {
        console.log("e",error);
        var e = "ERROR";
        socket.emit("response",e);
      };
      //console.log("r",response);
      //console.log("b",body);
      getRealData(JSON.parse(body)); // With AEMET API we need a second ajax call because its response gives you the correct url to get the DATA
    });

    function getRealData(data) {

      var options = {
        method: 'GET',
        "rejectUnauthorized": false,
        url: data.datos,
        headers: 
         { 'cache-control': 'no-cache' }
      };

      request(options, function (error, response, body) {
        //if (error) throw new Error(error);
        if(error) {
          console.log("e",error);
        };
        //console.log("r",response);
        //console.log("b",body);
        socket.emit("response",JSON.parse(body));
      });
       
      }

  });

  //STOP STREAMING
  /*
  socket.on('stop',function(){
    console.log("- - - - STOP Streaming - - - -");
  });
*/
  
  // STANDARD SOCKETS
  /*
  socket.on('new-message', function(data) {
    //messages.push(data);
    console.log(data.text);
    io.sockets.emit('messages', messages);
  });
  */

});
//END SOCKET IO

// STARTING SERVER
http.listen(process.env.PORT || 3000, function () {
  console.log('- START SERVER - - - - - -\n');
  console.log('Server Listening on http://localhost:' + (process.env.PORT || 3000))
});