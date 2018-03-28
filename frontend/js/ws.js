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
var what;
$(document).on("click", ".get-btn", function() { // jQuery lazy loading

	// console.log("=> Front calling");
	var data = $(this).attr('data-id');
	what = data;
	// console.log("GET",data);
	socket.emit('get',data); // Send petition to server

});

$(document).on("click", ".filter-btn", function() { // jQuery lazy loading

	// console.log("=> Front calling");
	var data = $(this).attr('data-id');
	var type = $(this).attr('data-type');
	// console.log("GET",data);
	socket.emit('filter',data,type); // Send petition to server

});

socket.on("response", function(newResp){

  // console.log("SERVER RESPONSE",newResp);
  printAnswer(newResp,what);

});

//PRINT CALL ANSWER
function printAnswer(data,what){

	cleanRespBox(); // <-- Clean response box at the begininng

	var responseTemplate;

	for (var chunk in data) {
		// console.log(chunk + "\n" + JSON.stringify(data[chunk]) + "\n");

		if(what === "provinces"){
			// console.log("PROVINCIAS");
			responseTemplate = '<div class="col s8 title">'+data[chunk].id+' # <b>'+data[chunk].name+'</b></div><div class="col s4"><button data-id="'+data[chunk].id+'" data-type="beaches" class="right btn btn-secondary btn-start waves-effect waves-light filter-btn">Ver playas</button></div><div class="clearfix mbm"></div>';
		}else{
			// console.log("BEACHES");
			responseTemplate = '<p>'+data[chunk].id+' # <b>'+data[chunk].name+'</b></p>';
		}

		$('#response').append(responseTemplate);
	}

}

//API Call
// var urlCall = "https://opendata.aemet.es/opendata/api/"+searchItems+"?api_key";
// var urlCall = "https://opendata.aemet.es/opendata/api/valores/climatologicos/inventarioestaciones/todasestaciones/?api_key=";
// var urlCall = "https://opendata.aemet.es/opendata/api/prediccion/especifica/playa/1500401/?api_key=";

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

// REFRESH Tw List
function cleanRespBox() {
	//Refresh ul tweetList
	$('#response p').html("");
};