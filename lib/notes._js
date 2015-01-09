var neo4j = require('neo4j');
var underscore = require('underscore');
var db = new neo4j.GraphDatabase('http://localhost:7474');
var sl = require('streamline');

var createNoteQuery 	= ["CREATE (n:Note {note:{noteToCreate}})",
                           "RETURN  n"].join('\n');
var getNoteQuery 		= ["MATCH (n:Note)-->(k:Keyword)",
                 		   "WHERE id(n) = {noteID}",
                 		   "RETURN n,collect(k)"].join('\n'); 
var getAllNotesQuery 	= ["MATCH (n:Note)",
                 		   "RETURN n"].join('\n'); 
var getNotesForKeywordQuery 		= ["MATCH (n:Note)-->(k:Keyword)",
                 		   "WHERE k.keyword = {keyword}",
                 		   "RETURN n"].join('\n'); 
var findKeywordQuery	= ["MATCH (n:Keyword{keyword:{keywordToRetrieve}})",
                           "RETURN n"].join('\n');
var createKeywordQuery 	= ["CREATE (k:Keyword {keyword:{keywordToCreate}})",
                           "RETURN  k"].join('\n');
var linkKeywordQuery 	= ["MATCH (note), (keyword)",
                           "WHERE id(note) = {noteID} AND id(keyword) = {keywordID}",
                           "CREATE (note)-[:HAS_KEYWORD]->(keyword)"].join('\n');

function add(text, _){
	
	//Create and save new note node
	var params = { noteToCreate : text};
	var results = db.query(createNoteQuery, params, _);
	var note = results.map(function (result) {
	    return result.n;
	  }).pop();
	note = note.save(_);
	//console.log(text);
	// Find all words in note
	
	var textWords = text.replace(/['!"#$%&\\'()\*+,\-\.\/:;<=>?@\[\\\]\^_`{|}~']/g,"");
	
	var words = textWords.split(' ');
	//console.log(words);
	//Filter out words from exclude list
	var keywords = underscore.filter(words, function(word) {
		return !underscore.contains(excludedWords,word.toUpperCase());
	});
	
	//console.log(keywords);
	
	var nodes = [];
	
	//Get nodes for keywords
	for (var i = 0; i < keywords.length; i++) {
		var params = { keywordToRetrieve:keywords[i] };
		var results = db.query(findKeywordQuery,params, _);
		//console.log("find results " + results);
		var keywordNodes = results.map(function (result) {
			    return result.n;
			  });
		//console.log(keywordNodes);
		var keywordNode = keywordNodes.pop();
		if (!keywordNode) {
			params = { keywordToCreate:keywords[i] };
			results = db.query(createKeywordQuery, params, _);
			//console.log("Create results " + results);
			keywordNode = results.map(function (result) {
			    return result.k;
			  }).pop();
			//console.log("Keyword node created " + keywordNode.data.keyword);
		} else {
			//console.log("Keyword node found " + keywordNode.data.keyword);
		}
		nodes.push(keywordNode);
	}
	
	//Link keyword nodes with note node
	for (var i = 0; i < nodes.length; i++) {
		var params = {
				noteID : note.id,
				keywordID : nodes[i].id
		};
		db.query(linkKeywordQuery, params, _);
	}
	
	//Return the id of the note node to start discovery from
	return note.id;
}

function get(noteID, _) {
	var params = { noteID : Number(noteID) };
	var results = db.query(getNoteQuery, params, _).pop();
	
	var note = results.n;
	var keywords = results['collect(k)'];
	
	return {
		note : note,
		keywords : keywords
	};
}

function getRandom(_) {
	var params = {};
	var results = db.query(getAllNotesQuery, params, _);
	var result = underscore.sample(results);
	var noteID = result.n.id;
	
	return noteID;
}

function getForKeyword(keyword,_) {
	var params = { keyword : keyword };
	var results = db.query(getNotesForKeywordQuery, params, _);
	var result = underscore.sample(results);
	var noteID = result.n.id;	
	
	return noteID;
}

exports.add = add;
exports.get = get;
exports.getRandom = getRandom;
exports.getForKeyword = getForKeyword;
var excludedWords = [
"A",
"ABLE",
"ABLY",
"AD",
"ADD",
"ADDS",
"ADO",
"ADOS",
"ADS",
"AE",
"AGO",
"AH",
"AHA",
"ALL",
"ALLS",
"AM",
"AN",
"AND",
"ANDS",
"ANY",
"ARE",
"AS",
"AT",
"AY",
"B",
"BE",
"BY",
"BYE",
"BYES",
"C",
"CAME",
"CAN",
"CH",
"CIAO",
"D",
"DA",
"DAS",
"DE",
"DI",
"DID",
"DO",
"DONE",
"DOWN",
"E",
"EACH",
"EE",
"EF",
"EH",
"EL",
"EN",
"ER",
"EVER",
"F",
"FA",
"FAR",
"FEW",
"FIND",
"FINE",
"FOR",
"FULL",
"FY",
"G",
"GAVE",
"GIVE",
"GO",
"GOOD",
"H",
"HA",
"HAD",
"HAH",
"HAHA",
"HARD",
"HAVE",
"HE",
"HEH",
"HEHS",
"HER",
"HERS",
"HES",
"HEY",
"HI",
"HIGH",
"HIM",
"HIS",
"HM",
"HMM",
"HO",
"HOPE",
"HOS",
"HUH",
"I",
"IF",
"IFFY",
"IN",
"IS",
"IT",
"ITS",
"J",
"JUST",
"K",
"L",
"LA",
"LESS",
"LET",
"LETS",
"LO",
"LOTS",
"M",
"MAKE",
"MANY",
"ME",
"MINE",
"MUCH",
"N",
"NA",
"NAH",
"NO",
"NONE",
"NOO",
"NOR",
"NOT",
"NOW",
"O",
"OF",
"OFF",
"OFFS",
"OFT",
"OH",
"OKAY",
"ON",
"ONLY",
"OOH",
"OOHS",
"OR",
"OUR",
"OURS",
"OUT",
"P",
"PER",
"PLUS",
"PUT",
"PUTS",
"Q",
"R",
"RAN",
"RE",
"S",
"SAID",
"SAY",
"SAYS",
"SEE",
"SEEM",
"SEEN",
"SHE",
"SO",
"SOME",
"SOON",
"SUCH",
"T",
"TA",
"TE",
"TELL",
"THAN",
"THAT",
"THE",
"THEE",
"THEM",
"THEN",
"THEY",
"TIS",
"TO",
"TOO",
"TWAS",
"U",
"UH",
"UN",
"UP",
"UR",
"US",
"USE",
"USES",
"UT",
"V",
"VERY",
"W",
"WAS",
"WE",
"WHAT",
"WHEN",
"WITH",
"WO",
"WOW",
"WOWS",
"X",
"XI",
"XU",
"Y",
"YA",
"YAH",
"YAHS",
"YAY",
"YAYS",
"YE",
"YEH",
"YEP",
"YES",
"YET",
"YO",
"YOU",
"YU",
"Z",
"ZO"
];