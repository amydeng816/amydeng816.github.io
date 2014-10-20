
var request = require('request');
request('http://www.google.com', function(error, response) {
  if (!error && response.statusCode == 200) {
    console.log(response.body);
  }
});



