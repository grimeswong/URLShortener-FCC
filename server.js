'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');
var sha1 = require('sha1')
require('dotenv').config();
var cors = require('cors');
var app = express();
var AutoIncrement = require('mongoose-sequence')(mongoose);

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
var connectDB = mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> {
    console.log("Database is connected successfully!");
  })
  .catch(error => console.error(`Cannot connect to the database due to ${error}`));

  /**
    * Define Schema and setup Model
    **/

  var urlSchema = new mongoose.Schema({  // Create Schema
    _id: {type: String, required: true},
    url: {type: String, required: true},
    short_url: {type: Number},
  })
  urlSchema.plugin(AutoIncrement, {id:'shorturl_seq', inc_field: 'short_url'});  // This plugin must be implemented before to create model

  var URL = mongoose.model("URL", urlSchema); // Create Model

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});


// your first API endpoint...
app.route('/api/shorturl/new').post(function(req, res) {
  console.log(res.host)
  var trimURL = req.body.url.trim(); // trim the start and end white space or new lines
  var regex = /https?:\/\/(w{3}\.)?/g;  // replace the protocol and www prefix
  var sortedURL = trimURL.replace(regex, '');
  console.log(`sortedURL = ${JSON.stringify(sortedURL)}`);
  dns.lookup(sortedURL, function(err, address, family) { // need to take out the 'https://' or 'http://'
    console.error(`error = ${err}`);  // error = null
    console.log(`address = ${address}, family = ${family}`)
    if(err === null) {

      URL.find({url: trimURL}, function(err, data) { // Query DB whether the URL was saved previously
        if(err) {return console.error(err)}

        if (JSON.stringify(data)===JSON.stringify([])) {
          console.log('Couldn\'t find any URL relate to this, data will be saved !!!' );

          // store data in database with a hash ID
          var saveURL = new URL({
            _id: sha1(trimURL),
            url: trimURL
          })
          saveURL.save(function(err, saveData) {
            console.log("new URL has been saved in MongoDB!!!");
            console.log(`saveData = ${saveData}`);
            err!==null ? console.error(`error = ${err}`) :
            res.json({ // Response with a shorturl
              original_url: saveData.url,
              short_url: saveData.short_url
            })
          })

       } else { //
          console.log('This URL has a record that saved previously');
          console.log(data);  // Data would be an array of results
          res.json({ // Response with a shorturl of the first result
              original_url: data[0].url,
              short_url: data[0].short_url
          })
        }
      })

    } else {
      // Response with a invalid url
      res.json({error: "invalid URL"});
    }
  })

})

app.get('/api/shorturl/:urlnum', function(req, res) {
  console.log(typeof(req.params.urlnum));
  // Need to cast to Number before query
  URL.findOne({short_url: Number.parseInt(req.params.urlnum)}, function(err, result) {
    if(err) {console.error(err)};
    //a result return by query
    result !== null ? res.redirect(`${result.url}`) : console.log("This URL couldn't be found!!!") // no result return by query
  })
})


app.listen(port, function () {
  console.log(`Node.js listening ... on port: ${port}`);
});
