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
	// GOOGLE MAPS 
	queryMap.r = getRegion(country);
	queryMap.c = fixEScode($(this).attr('data-id'));
	queryMap.l = $(this).attr('data-location');
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
	checkMapState();

	/* console.log(type);
	if(type === "/spain/beaches"){
		type = "beaches";
	}*/

	// console.log(data);	
	// console.log(chunk + "\n" + JSON.stringify(data[chunk]) + "\n");

	for (var chunk in data) {

		// console.log(data[chunk].id,data[chunk].name)

		if(type === "provinces"){
			// console.log("PROVINCIAS");
			responseTemplate = '<div class="col s8 title">'+data[chunk].id+' # <b>'+data[chunk].name+'</b></div><div class="col s4"><button data-id="'+data[chunk].id+'" data-type="beaches" class="right btn btn-secondary btn-start waves-effect waves-light filter-btn">Ver playas</button></div><div class="clearfix mbm"></div>';
			// initMap(data[chunk].name); // <- INIT Google Maps
		}

		if(type === "beaches"){
			// console.log("B");
			// console.log("Consulta maps",data[chunk].id,data[chunk].name," : ");
			responseTemplate = '<div class="col s8 title">'+data[chunk].id+' # <b>'+data[chunk].name+'</b></div><div class="col s4"><button data-id="'+data[chunk].id+'" data-location="'+data[chunk].name+'" data-type="beach" class="right btn btn-secondary btn-start waves-effect waves-light weather-btn">Ver Clima</button></div><div class="clearfix mbm"></div>';
			// initMap(data[chunk].name,data[chunk].id,originQuery); // <- INIT Google Maps
		}

		if(type === "beach"){
			// console.log(data);
			var today = data[0].prediccion.dia[0];
			console.log(today);
			responseTemplate = "<b>"+queryMap.l+"</b> : "+today.tMaxima.valor1+" : "+today.estadoCielo.descripcion2;
			responseTemplate += "<br>- - - -<br>"+JSON.stringify(today);

			// console.log("gMap Q :",queryMap.l,queryMap.c,queryMap.r);			
			initMap(); // <- INIT Google Maps
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
	checkMapState();
};

// GOOGLE MAPS
var map;
var myLatLng;
var pos;
var gKey = "AIzaSyDJrPFg_yBfFe5TCJlT83nXswvfOz8e3HU";

var queryMap = {
	l : "", // Location name
	c : "", // Location zip code
	r: ""	// Region
};

var mapState = false;
function checkMapState(){
	if(mapState === true){
		$("#mapBox").toggle();
		mapState = false;
	}
};

function initMap() {

	// console.log("INIT MAP!");
	var queryCP = queryMap.c;
	var queryLoc = queryMap.l;
	var region = queryMap.r;

	var url;

	if(queryCP != ""){
		url = "https://maps.googleapis.com/maps/api/geocode/json?address="+queryCP+"+"+queryLoc+"&region="+region+"&key="+gKey;
	} else {
		url = "https://maps.googleapis.com/maps/api/geocode/json?address="+queryLoc+"&region="+region+"&key="+gKey;
	}

	// console.log(url);
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

function getRegion(country){
	if(country === "spain"){
		return "es";
	}
}

function fixEScode(c){

	var l = c.length;
	var n = l - 2;
	c = c.slice(0,n);
	/*console.log(l,n,c);*/
	return c;
}

function printMap(coordinates) {

	// console.log("PRINTING MAP!",coordinates);
	map = new

	google.maps.Map(document.getElementById('map'), {
	    //CENTERING MAP
	    center: coordinates,
	    zoom: 10
	});

	$("#mapBox").toggle(); // <- SHow map box
	mapState = true;

	var marker = new google.maps.Marker({
		position: coordinates,
		title:queryMap.l,
		visible: true
	});
	marker.setMap(map);
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
	
	// console.log("- - - - \n");

	if(resp.results[0] != undefined){
		var coord = resp.results[0].geometry.location;
		printMap(coord);
		/*
		// var country = resp.results[0].address_components[3].long_name; // -> Country position changes
		var country = resp.results[0].address_components // ARRAY;
		var cL = country.length;
		var check = false;

		for(var i = 0; i < cL; i++){


			if(country[i].short_name != "ES"){
				// console.log("NOPE");
				check === false;
				console.warn(resp.results[0].formatted_address);
			}else{
				// console.log("YEAH");
				check === true;
				console.log("=> "+country[i].short_name);
				console.log(resp.results[0].formatted_address);
				console.log(resp);
				break;
			}
		}
		*/

	}else{
		// console.error(resp);
		console.error(resp.status);
	}
}