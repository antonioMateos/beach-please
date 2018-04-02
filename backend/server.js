//'use strict';
var express = require('express'),
	app     = express(),
	path    = require('path'),
	http	= require('http').Server(app),
  io = require("socket.io")(http, {origins: '*:*'}), // app or http
	bodyParser = require('body-parser'),
  cors = require('cors'),
  request = require('request') // AJAX CORS

// console.log('- - - - Iniciando entorno');

// CORS --> Cabeceras correctas
//Access-Control-Allow-Origin
app.use(function(req,res,next){
    res.header('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Credentials",true);
    res.header("Access-Control-Allow-Methods","POST,GET,OPTIONS");
    next();
});

app.use(cors());

// Parsers --> Poder mandar y recibir JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(methodOverride());
// console.log('- - - - Middlewares cargados...');

console.log('- - - - FRONT ROUTES');
app.use(express.static(__dirname + '/public'));

app.get('/', function (request, response, next) {
	response.sendFile(path.join(__dirname+'/index.html'));
});

// console.log('- - - - END FRONT ROUTES');

// AEMT SERVICE CONFIG
aemt_config = require('./aemt_config') // <-- CONFIG file
// <-- TO DO > Environment variables

// FIREBASE SERVICE CONFIG 
var firebase = require('firebase'); // Initialize Firebase
var fib_config = require('./fib_config') // <-- CONFIG file
firebase.initializeApp(fib_config); // Create Firebase instance
var dbFib = firebase.database(); // Get a reference to the database service
// <-- TO DO > Environment variables

// SOCKET IO
io.on('connection', function(socket){

  //START CONNECTION
  socket.emit('connect'); // SHOW IN CLIENT SIDE

  // GLOBAL VAR FOR REPSONSES
  var response;

  // GET GLOBAL DATA
  socket.on('get', function(data) {

    // console.log("GET",data);
    var what = data;
    var ref = dbFib.ref(what); // REF FOR FIREBASE FETCH DATA

    ref.on("value", function(snapshot) {
        // console.log(snapshot.val());
        response = snapshot.val();
        io.sockets.emit('response', response);
      }, function (errorObject) {
        // console.log("The read failed: " + errorObject.code);
        response = "The read failed: " + errorObject.code;
        io.sockets.emit('response', response);
      });

  });

  // GET FILTERED DATA
  socket.on('filter', function(data,type) {

    console.log('Filter',data,type);
    var what = '/spain/'+type;
    var ref = dbFib.ref(what); // REF FOR FIREBASE FETCH DATA
    var filteredResponse = [];

    ref.orderByChild("province_id").on("value", function(snapshot) {

          response = snapshot.val();

          snapshot.forEach(function(child) {
            var chunk = child.key;
            var pid = response[chunk].province_id; // NOT WORKING cauz algunas borran el 0!
            
            if(pid.toString().length === 1){
              //console.log("YEAH",pid);
              pid = "0"+pid
            }
            
            if(pid === data.toString()){
              // console.log(data+" : "+pid,response[chunk].name);
              filteredResponse.push(response[chunk]);
            } else {
              // NOPE!
            }
          });

          io.sockets.emit('response', filteredResponse);

      }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
        response = "The read failed: " + errorObject.code;
        io.sockets.emit('response', response);
      });

  });

  // GET WEATHER
  socket.on('get-weather', function(data) {

    var dataID = data;
    var apiKey = aemt_config.service.apiKey;
    var url = "https://opendata.aemet.es/opendata/api/prediccion/especifica/playa/"+dataID+"/?api_key="+apiKey;
    
    // console.log(url);

    var options = {
      method: 'GET',
      "rejectUnauthorized": false,
      url: url,
      qs: { 'api_key': apiKey },
      headers: 
       { 'cache-control': 'no-cache' }
    };

    request(options, function (error, response, body) {
      //if (error) throw new Error(error);
      if(error) {
        console.log("e",error);
        var e = "ERROR";
        socket.emit("error",error);
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
          socket.emit("error",error);
        };
        // console.log("r",response);
        // console.log("b",body);
        socket.emit("response",JSON.parse(body));
      });
       
    }

  });

});

/*
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
  socket.on('stop',function(){
    console.log("- - - - STOP Streaming - - - -");
  });
  

});*/
//END SOCKET IO

// STARTING SERVER
http.listen(process.env.PORT || 3000, function () {
  console.log('- START SERVER - - - - - -\n');
  console.log('Server Listening on http://localhost:' + (process.env.PORT || 3000))
});
