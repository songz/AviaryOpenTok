window.init = function(apiKey, sessionId, token, aviaryKey){
  // Initialize API key, session, and token, generated from server side
  var videoStreamers = [];
  var canvas = document.getElementById("bigCanvas");

  // Create publisher and start streaming into the session
  var publisher = TB.initPublisher(apiKey, 'myPublisherDiv', {width:320, height:240});

  // Initialize session, set up event listeners, and connect
  var session = TB.initSession(sessionId);
  session.addEventListener('sessionConnected', sessionConnectedHandler);
  session.addEventListener('streamCreated', streamCreatedHandler);
  session.connect(apiKey, token);

  function sessionConnectedHandler(event) {
    // Keep track of video streams so we can take pictures later
    videoStreamers.push( publisher );

    session.publish(publisher);
    subscribeToStreams(event.streams);
  }

  function streamCreatedHandler(event) {
    // Subscribe to any new streams that are created
    subscribeToStreams(event.streams);
  }

  function subscribeToStreams(streams) {
    for (var i = 0; i < streams.length; i++) {
      // Make sure we don't subscribe to ourself
      if (streams[i].connection.connectionId == session.connection.connectionId) {
        return;
      }

      // Create the div to put the subscriber element in to
      var div = document.createElement('div');
      div.setAttribute('id', 'stream' + streams[i].streamId);
      $("#videos").append( div );

      // Subscribe to the stream
      videoStreamers.push( session.subscribe(streams[i], div.id, {width:320, height:240}) );
    }
  }

  // Initialize Aviary's Feather editor
  var featherEditor = new Aviary.Feather({
    apiKey: aviaryKey,
      apiVersion: 2,
      onSave: function(imageID, newURL) {
        featherEditor.close();
        $("#aviaryResult").attr("src", newURL);
        $("#overlay").slideDown('fast');
        return false;
      }
  });

  var totalWidth = 0;
  var maxHeight = 0;

  $("#takePicture").click( function(){
    $("#imageContainer").html("");
    totalWidth = 0;
    maxHeight = 0;

    // Populate array of images
    for( var i=0; i<videoStreamers.length; i++){
      if( videoStreamers[i] ){
        var data = videoStreamers[i].getImgData();
        if( data && data.length > 10 ){
          var img = new Image();
          img.src = "data:image/png;base64," + data;
          img.onload = function(){
            totalWidth += this.width;
            if( this.height > maxHeight ){
              maxHeight = this.height;
            }
            this.originalWidth = this.width;
            this.originalHeight = this.height;
            this.width = 320;
            this.height = 240;
          };
          $("#imageContainer").append( img );
        }
      }
    }
  });

  $("#makeImage").click(function(){
    canvas.width = totalWidth;
    canvas.height = maxHeight;
    var ctx = canvas.getContext('2d');
    var startX = 0;

    var images = $("#imageContainer img");
    for( var i=0; i<images.length; i++){
      ctx.drawImage( images[i], startX, 0 );
      startX += images[i].originalWidth;
    }

    var data = canvas.toDataURL("image/png");
    var resultImage$ = $("<img />", {id: "resultImage"});
    resultImage$.attr({src:data, height:240});
    window.resultImage = resultImage$;
    $("#imageContainer").html( resultImage$ );
    featherEditor.launch({ image: 'resultImage' });
  });

  $("#closeOverlay").click(function(){
    $("#overlay").slideUp('fast');
  });

}
