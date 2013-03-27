// Required modules, Listed in the order of importance
var OTSDK = require('opentok'); // OpenTok API for live video streaming
var http = require('http');     // Listen to HTTP Requests
var fs = require('fs');         // Read files
var express = require('express');         // Read files
var ejs = require('ejs');       // Templating Engine

var app = express();
app.use(express.static(__dirname + '/public'));

// OpenTok Constants for creating Session and Token values
var OTKEY = process.env.TB_KEY;
var OTSECRET = process.env.TB_SECRET;
var AviaryKey = process.env.AVIARY_KEY;

// Setup when server first starts
var urlSessions = {}; // mapping url to OpenTok Sessions

// Initialize OpenTok Object
var OpenTok = new OTSDK.OpenTokSDK(OTKEY, OTSECRET);

// read view Template into a string
var htmlString = fs.readFileSync('./views/view.ejs', 'utf8'); 

// Write response after all data (session Id, token) is ready
function generateResponse( sessionId, responder ){
  var token = OpenTok.generateToken( {session_id: sessionId} );
  var data = {OpenTokKey:OTKEY, sessionId: sessionId, token:token, AviaryKey: AviaryKey};
  responder.writeHead(200);
  responder.end( ejs.render(htmlString, data) );
}

// Start Server
app.get("/", function( req, res ){
  res.writeHead(302, {
    'Location': Date.now()
    //add other headers here...
  });
  res.end();
});

app.get("/:room", function(req, res){
  if(urlSessions[ req.params.room ] == undefined){ // No OpenTok sessionId for url
    var clientIP = req.connection.remoteAddress;
    OpenTok.createSession(clientIP, function(sessionId){
      // sessionId received. Generate token and write response
      urlSessions[ req.params.room ] = sessionId;
      generateResponse( sessionId, res );
    });
  }else{
    // sessionId exists, use it to generate token and write response
    generateResponse( urlSessions[ req.params.room], res );
  }
  console.log( urlSessions );
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
