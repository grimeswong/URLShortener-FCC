'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');
require('dotenv').config();


var cors = require('cors');

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> {
    console.log("Database is connected successfully!");
  })
  .catch(error => console.error(`Cannot connect to the database due to ${error}`));

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
  console.log(req.body.url)
  var regex = /https?:\/\/|( |w{3}\.)/g;  // replace the protocol and www prefix
  var sortedURL = req.body.url.replace(regex, '').trim(); // trim the start and end white space
  console.log(sortedURL);
  console.log(typeof(sortedURL));
  dns.lookup(sortedURL, function(err, address, family) { // need to take out the 'https://' or 'http://'
    console.log(`error = ${err}`);  // error = null
    console.log(`address = ${address}, family = ${family}`)
    if(err === null) {
      // Response with a shorturl
      //store data in database with a hash ID
      // res.json({original_url: req.body.url})
    } else {
      // Response with a invalid url
      res.json({error: "invalid URL"});
    }
  })

});


app.listen(port, function () {
  console.log(`Node.js listening ... on port: ${port}`);
});
