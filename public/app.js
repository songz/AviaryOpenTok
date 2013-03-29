window.init = function(apiKey, sessionId, token, aviaryKey){
  // create publisher object
  var publisher = TB.initPublisher(apiKey, 'myPublisherDiv', {width:320, height:240});

  // create array to keep track of video streaming objects
  var videoStreamers = [publisher];
  var canvas = document.getElementById("bigCanvas");

  // Initialize session, set up event listeners, and connect
  var session = TB.initSession(sessionId);
  session.addEventListener('sessionConnected', sessionConnectedHandler);
  session.addEventListener('streamCreated', streamCreatedHandler);
  session.connect(apiKey, token);

  function sessionConnectedHandler(event) {
    // when session is connected, publish video to session and subscribe to video streams
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

      // Subscribe to the stream, push return object to videoStreamers array
      videoStreamers.push( session.subscribe(streams[i], div.id, {width:320, height:240}) );
    }
  }

  // Keep track of width/height of canvas object so stitch videos later
  var totalWidth = 0;
  var maxHeight = 0;

  $("#takePicture").click( function(){
    // reset canvas width/height to 0, empty previous images
    $("#imageContainer").html("");
    totalWidth = 0;
    maxHeight = 0;

    // Populate array of images
    for( var i=0; i<videoStreamers.length; i++){
      if( videoStreamers[i] ){
        var data = videoStreamers[i].getImgData();
        if( data && data.length > 10 ){
          // if data exists from video stream, create image element
          var img = new Image();
          img.src = "data:image/png;base64," + data;
          img.onload = function(){
            // when image loads, update canvas dimensions, then resize image
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

  $("#makeImage").click(function(){
    canvas.width = totalWidth;
    canvas.height = maxHeight;
    var ctx = canvas.getContext('2d');
    var startX = 0;

    // To stitch, draw images into canvas first horizontally
    var images = $("#imageContainer img");
    for( var i=0; i<images.length; i++){
      ctx.drawImage( images[i], startX, 0 );
      startX += images[i].originalWidth;
    }

    // pull imgData from canvas, then put it on resultImage tag
    var data = canvas.toDataURL("image/png");
    var resultImage$ = $("<img />", {id: "resultImage"});
    resultImage$.attr({src:data, height:240});
    window.resultImage = resultImage$;
    $("#imageContainer").html( resultImage$ );

    // launch featherEditor after image is ready
    featherEditor.launch({ image: 'resultImage' });
  });

  $("#closeOverlay").click(function(){
    $("#overlay").slideUp('fast');
  });

}
