// var socket = io();
var connectionOptions =  {
            "force new connection" : true,
            "reconnectionAttempts": "Infinity", //avoid having user reconnect manually in order to prevent dead clients after a server restart
            "timeout" : 10000, //before connect_error and connect_timeout are emitted.
            "transports" : ["websocket"]
        };

var socket = io('http://localhost:3000', connectionOptions);

// CONNECTED
socket.on("connect", function(){

  console.log(":: SOCKETS ON ::");

});

// TO DO --> Add key press font intro on search!!!
var type;
var country;
$(document).on("click", ".get-btn", function() { // jQuery lazy loading

	// console.log("=> Front calling");
	var data = $(this).attr('data-id');
	type = data;
	country = $('#country-select :selected').val(); 
	// console.log(type,country);
	data = "/"+country+"/"+data;
	// console.log("GET",data);
	socket.emit('get',data); // Send petition to server

});

$(document).on("click", ".filter-btn", function() { // jQuery lazy loading

	// console.log("=> Front calling");
	var data = $(this).attr('data-id');
	type = $(this).attr('data-type');
	// console.log("GET",data,type);
	socket.emit('filter',data,type); // Send petition to server

});

$(document).on("click", ".weather-btn", function() { // jQuery lazy loading

	// console.log("=> Front calling");
	var data = $(this).attr('data-id');
	type = $(this).attr('data-type');
	// console.log("GET",data);
	socket.emit('get-weather',data); // Send petition to server

});

socket.on("response", function(newResp){

  console.log("SERVER RESPONSE",newResp);
  printAnswer(newResp,type);

});

socket.on("error", function(e){

  console.log("ERROR :: ",e);
  // TO DO => UI for errors

});

var responseTemplate;
//PRINT CALL ANSWER
function printAnswer(data,type){

	cleanRespBox(); // <-- Clean response box at the begininng
	// initMap(); // <- INIT Google Maps

	// console.log(type);
	if(type === "/spain/beaches"){
		type = "beaches";
	}

	// console.log(data);	
	// console.log(chunk + "\n" + JSON.stringify(data[chunk]) + "\n");

	for (var chunk in data) {

		// console.log(data[chunk].id,data[chunk].name)

		if(type === "provinces"){
			// console.log("PROVINCIAS");
			responseTemplate = '<div class="col s8 title">'+data[chunk].id+' # <b>'+data[chunk].name+'</b></div><div class="col s4"><button data-id="'+data[chunk].id+'" data-type="beaches" class="right btn btn-secondary btn-start waves-effect waves-light filter-btn">Ver playas</button></div><div class="clearfix mbm"></div>';
			initMap(data[chunk].name); // <- INIT Google Maps
		}

		if(type === "beaches"){
			// console.log("B");
			// console.log("Consulta maps",data[chunk].id,data[chunk].name," : ");
			responseTemplate = '<div class="col s8 title">'+data[chunk].id+' # <b>'+data[chunk].name+'</b></div><div class="col s4"><button data-id="'+data[chunk].id+'" data-type="beach" class="right btn btn-secondary btn-start waves-effect waves-light weather-btn">Ver Clima</button></div><div class="clearfix mbm"></div>';
			var originQuery = 'Consulta maps '+data[chunk].id+' '+data[chunk].name+' : ';
			initMap(data[chunk].name,data[chunk].id,originQuery); // <- INIT Google Maps
		}

		if(type === "beach"){
			// console.log(data);
			var today = data[0].prediccion.dia[0];
			console.log(today);
			responseTemplate = "<b>"+data[0].nombre+"</b> : "+today.tMaxima.valor1+" : "+today.estadoCielo.descripcion2;
			responseTemplate += "<br>- - - -<br>"+JSON.stringify(today);
			// responseTemplate = '<div class="col s8 title">'+data[chunk].id+' # <b>'+data[chunk].name+'</b></div><div class="col s4"><button data-id="'+data[chunk].id+'" data-type="beach" class="right btn btn-secondary btn-start waves-effect waves-light weather-btn">AJAX Call</button></div><div class="clearfix mbm"></div>';
		}

		$('#response').append(responseTemplate);

	}

}

$('#stop-btn').click(function(){
	$('#search').val("");
	socket.emit('stop');
	$('main').removeClass('searching'); // CHANGE STYLE TO START STREAMING
	responseMsg("stop");
});

// STATS Fn
var nt = 0; // Number of answers received
function stats() {
	$('.stats').show(); // show STATS
	nt += 1;
	$('.stats p span').text(nt);
}

// RESPONSE MSGs
function responseMsg(response) {

	// Toast Config
	var resp;
	var className = "response-msg";

	var msg = {
		empty: "Please, write a url!!!",
		stop: "Receiving stopped!",
		start: "Call started!"
	};

	if(response=="empty") {
		resp = msg.empty;
		className += " error";
	}

	if(response=="stop") {
		resp = msg.stop;
		className += " stop";
	}

	if(response=="start") {
		resp = msg.start;
		className += " success";
	}

	// Materialize.toast(message, displayLength, className, completeCallback);
	var toastContent = "<span>"+resp+"</span>";
	var time = 4000;
	Materialize.toast(toastContent, time, className); // 4000 is the duration of the toast

}

$(document).on("click", ".clear-btn", function() { // jQuery lazy loading

	cleanRespBox();

});

// REFRESH Tw List
function cleanRespBox() {
	//Refresh ul tweetList
	$('#response').html("");
};

// GOOGLE MAPS
var map;
var myLatLng;
var pos;
var gKey = "AIzaSyDJrPFg_yBfFe5TCJlT83nXswvfOz8e3HU";

function initMap(queryLoc,queryID,originQ) {

	var queryID = queryID || "";
	var originQ = originQ || "";

	console.log("INIT MAPS!");

	// var url = "https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key="+gKey;
	if(queryID != ""){
		var url = "https://maps.googleapis.com/maps/api/geocode/json?address="+queryID+"+"+queryLoc+",+"+country+"CA&key="+gKey;
		console.log(originQ);
	} else {
		var url = "https://maps.googleapis.com/maps/api/geocode/json?address="+queryLoc+"+"+country+"CA&key="+gKey;
	}

	callingAjax(url,printAjax);

	/* MY LAT AND MY LONG
	if ("geolocation" in navigator) {
		// SOLO POSICION 
  		navigator.geolocation.getCurrentPosition(success, error);
  		//CALLBACKS EXITO Y ERRORES
		function success(user) {
			pos = user.coords;
			// console.warn(pos)
			// myLatLng = {lat: 34.0399935, lng: -118.256498}
			myLatLng = {lat: pos.latitude, lng: pos.longitude}
			printMap(myLatLng)
		}

		function error(error) {
			//console.warn("Error code:",error.message)
		}
	}
	
	google.maps.Map(document.getElementById('map'), {
	    //CENTERING MAP
	    center: myLatLng,
	    zoom: 10
	});
	END MY LAT AND MY LONG */

};

function printMap(coordinates) {
	console.log("PRINTING MAP!");
	map = new
	google.maps.Map(document.getElementById('map'), {
	    //CENTERING MAP
	    center: coordinates,
	    zoom: 10
	});
};

function callingAjax(url,callback) {

    var xmlHttp = new XMLHttpRequest();

    xmlHttp.onreadystatechange = function() {

        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {

            //console.info(JSON.parse(xmlHttp.responseText));
            var dataInfo = JSON.parse(xmlHttp.responseText);
            callback(dataInfo);

        } else if (xmlHttp.readyState === 4 && xmlHttp.status === 404) {

            console.error("ERROR! 404");
            console.warn(JSON.parse(xmlHttp.responseText));

        }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
};

function printAjax(resp){
	console.log("- - - - \n");
	if(resp.results[0] != undefined){
		console.log(resp.results[0].formatted_address);
		console.log(resp);
	}else{
		// console.error(resp);
		console.error(resp.status);
	}
}