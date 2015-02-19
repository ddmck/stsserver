var express = require('express');
var prerender = require('prerender-node');
var app = express();


app.use(prerender.set('prerenderToken', 'NBDy0Xc1435JXDrCppLQ')); 
app.use(express.static("public"));
app.use(app.router); 

// This will ensure that all routing is handed over to AngularJS 
app.get('*', function(req, res){ 
  res.sendfile('./public/index.html'); 
});

app.listen(8081); 
console.log("Go Prerender Go!");