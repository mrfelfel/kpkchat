let mongo = require("mongoose");
mongo.Promise = require('bluebird');
mongo.connect('mongodb://localhost/koche-bot', function(err){
  if(err){
    console.error("error " + err);
    return;
  }
});

module.exports = mongo;

