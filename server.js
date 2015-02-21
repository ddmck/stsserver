var express = require('express');
var prerender = require('prerender-node');
var exphbs = require('express-handlebars');
var app = express();
var hbs = exphbs.create({
  helpers: {
    assetUrl: function () { 
      return process.env.FMF_ASSET_PATH;
    } 
  }
});

function requireHTTPS(req, res, next) {
  if (!req.secure) {
      //FYI this should work for local development as well
      return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
}



app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use(prerender.set('prerenderToken', 'NBDy0Xc1435JXDrCppLQ')); 
app.use(requireHTTPS);
// This will ensure that all routing is handed over to AngularJS 
app.get('*', function(req, res){ 
  res.render('index', {layout: false});
});

app.listen(process.env.PORT || 8081); 
console.log("Go Prerender Go!");
console.log(process.env.FMF_ASSET_PATH);