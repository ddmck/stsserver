var express = require('express');
var prerender = require('prerender-node');
var exphbs = require('express-handlebars');
var app = express();
var hbs = exphbs.create({
  helpers: {
    assetUrl: function () { 
      return process.env.STS_ASSET_PATH;
    } 
  }
});
var env = process.env.NODE_ENV || 'development';

// var forceSsl = function (req, res, next) {
//   if (req.headers['x-forwarded-proto'] !== 'https') {
//       return res.redirect(['https://', req.get('Host'), req.url].join(''));
//   }
//   return next();
// };

console.log("ENV:  " + env)

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use(prerender.set('prerenderToken', 'NBDy0Xc1435JXDrCppLQ'));
// if (env === 'production') {
//   app.use(forceSsl);
// }
// This will ensure that all routing is handed over to AngularJS 
app.get('*', function(req, res){ 
  res.render('index', {layout: false});
});

app.listen(process.env.PORT || 8888); 
console.log("Go Prerender Go!");
console.log("Assets from: " + process.env.STS_ASSET_PATH);