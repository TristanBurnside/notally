var express = require('express');
var _ = require('underscore');
var env = require('node-env-file');
var app = express();
var config = require('./lib/config');

if (config.loadenv) {
	//Load any undefined ENV variables from a specified file.
	env(__dirname + '/.env');
}

var notes = require('./lib/notes');
var words = require('./lib/words');

app.set('view engine', 'ejs');
app.set('view options', { layout: false });

app.set('title', 'Notally');

app.use('/public', express.static('public'));

app.use(express.bodyParser());

app.use(app.router);

app.get('/', function (req, res) {
  res.render('index', { notetext: null });
});

app.post('/notes/', function (req, res) {
  notes.add(req.body.notetext, function(err, result){
	  console.log("result is:" + result);
	  console.log("error is:" + err);
	  if (err) {
		  res.status(500).send(err);
	  } else {
		  //res.render('result', { words: result, notetext: req.body.notetext });
		  res.redirect('/notes/' + result);
	  }
  });  
});

app.get('/notes/', function(req,res) {
	console.log("get notes");
		if (req.query.keyword) {
			notes.getForKeyword(req.query.keyword, function(err, result){
				  console.log("result is:" + result);
				  console.log("error is:" + err);
				  if (err) {
					  res.status(500).send(err);
				  } else {
					  res.redirect('/notes/' + result);
				  }
			  });
		} else {
			notes.getRandom(function(err, result){
				  console.log("result is:" + result);
				  console.log("error is:" + err);
				  if (err) {
					  res.status(500).send(err);
				  } else {
					  res.redirect('/notes/' + result);
				  }
			  });
		}
});

app.get('/notes/:noteID', function(req, res) {	
	console.log("get note");
	if (req.params.noteID) {
	notes.get(req.params.noteID, function(err,result){
		if (err) {
			res.status(500).send(err);
		} else {
			var note = result.note;
			var keywords = result.keywords;
			if (keywords.length < 4) {
				for (var i = keywords.length; i<4; i++) {
					keywords[i] = {data:{keyword:''}};
				}
			}
			
			res.render('browse', {note:note, keywords:keywords});	
		}
	});
	} else {
		res.redirect('/notes/');
	}
});

app.listen(process.env.PORT || config.port);
console.log("Listening on port: " + (process.env.PORT || config.port));
