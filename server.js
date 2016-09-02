<<<<<<< HEAD
/*
Name: Lauren Miller
Course: CS496: Mobile/Cloud Software Development
Assignment: Final Assignment -- BookLog API
Date: 8/11/2016
*/

/*
Example record for bookLogBooks:

{
  "author": "example_author",
  "dateRead": "1470947821098",
  "email": "example_email",
  "genre": "fantasy",
  "picture": "http://img1.joyreactor.com/pics/post/1000-frames-maze-gif-1265833.gif",
  "rating": "4.0",
  "title": "example_title"
}

Example record for bookLogUsers:

{
	"email": "266228007"
	"pass:"-1322970774"
}

*/

//setting up modules, files, ports, etc.
var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var AWS = require('aws-sdk');
var awsKey = require('./AWS_key');
var db = new AWS.DynamoDB.DocumentClient({region: awsKey.region, accessKeyId: awsKey.accessKeyId, secretAccessKey: awsKey.secretAccessKey});

var port = process.env.PORT || 5000;

app.all('*', function(req, res, next) {//if JSON accepted
	if (req.accepts(['json', 'application/json']) || req.accepts(['json', 'application/json'])) {
		next();
	}
	else {//if JSON not accepted, error
		res.status(400).send({"error":"must accept JSON"});
	}   
});

app.get('/$', function(req, res) {
		res.status(200).send({"routes":["/users?email={email}&pass={password}","/books?email={email}&title={title}"]});
});


//User Routes

app.post('/users*', function (req, res) {//creates a new user with the given email and password hash. If the user already exists, update nothing - for paths like /users?email={email}&pass={password}

	var newUser = {
		TableName: "bookLogUsers",
		Item: {
			email: req.query.email,
			pass: req.query.pass
		},
		ConditionExpression: "attribute_not_exists(email)"//the email should not already be recorded
	};

	db.put(newUser, function(err, data) {
		if(err) {//if dynamoDB returns an error
			console.log(err);
			res.status(304).send();//user already exists
		}
		else {//if no error is returned 
			res.status(201).send();//the user has been added	
		}
	});

});

app.get('/users*', function (req, res) {//returns if there is a user with the given email and password hash - for paths like /users?email={email}&pass={password}

	var theUser = {
		TableName : "bookLogUsers",
		FilterExpression: "email = :theEmail and pass = :thePass",
		ExpressionAttributeValues: {
			":theEmail":req.query.email,
			":thePass":req.query.pass
		}
	};
	
	db.scan(theUser, function(err, data) {
		if (err) {//if dynamoDB returns an error
			console.log(err);
			res.status(500).send();//internal server error
		}
		else if(!data.Items[0]) {//if no owners with the given email are found	
			res.status(404).send();//not found
		}
		else {//if the given book owner exists
			res.status(200).send();
		}
	});
	
});

app.delete('/users*', function (req, res) {//deletes the given user and all associated books - for paths like /users?email={email}
	
	var deleteUser = {
		TableName:"bookLogUsers",
		Key:{
				"email": req.query.email
			}
	};
	
	db.delete(deleteUser, function(err, data) {//deleting the user from the users table
		if(err) {
			res.status(500).send();//internal error - user not deleted
		}
		else {//scanning for items in the book table with given email, then looping through and deleting one by one
			var theBook = {
				TableName : "bookLogBooks",
				ProjectionExpression:"title",
				FilterExpression:"email = :theEmail",
				ExpressionAttributeValues: {
					":theEmail":req.query.email
				}
			};
			
			db.scan(theBook, function(err, data) {
				if (err) {
					console.log(err);
					res.status(500).send();//internal error
				}
				else {
					var isError = false;
					
					for(i = 0; i < data.Count; i++) {
						
						var deleteOwner = {
							TableName:"bookLogBooks",
							Key:{
									"email": req.query.email,
									"title": data.Items[i].title
								}
						};
						
						db.delete(deleteOwner, function(err, data) {
							if(err) {
								isError = true;//tracking if error deleting books
							}
						});
					}
					
					if (!isError) {
						res.status(200).send();//user deleted
					}
					else {
						res.status(304).send();//books not deleted correctly
					}	
				}
			});

		}
	});
		
});



//Books Routes

app.get('/books*', function (req, res) {//returns all books for a given user - for paths like /books?email={email}

	var theBook = {
		TableName : "bookLogBooks",
		ProjectionExpression:"title, author, rating, picture, genre, dateRead",
		FilterExpression:"email = :theEmail",
		ExpressionAttributeValues: {
			":theEmail":req.query.email
		}
		
	};
	
	db.scan(theBook, function(err, data) {
		if (err) {
			console.log(err);
			res.status(500).send();//internal error
		}
		else if(!data.Items[0]) {
			res.status(404).send();//no owners with the given email are found	
		}
		else {//if the given book owner exists
		
			res.send({"booksOwned":data.Items});
		}
	});
});

app.put('/books*', function (req, res) {//returns all books for a given user - for paths like /books?email={email}&title={title}
	
	if(req.query.author != null || req.query.genre != null || req.query.picture != null || req.query.dateRead != null || req.query.rating != null) {//ensuring that some values are to be set
		var updatedBook = {
			TableName: "bookLogBooks",
			Key:{
				"email": req.query.email,
				"title": req.query.title
			},
			UpdateExpression: "set dateRead = :newDate",
			ExpressionAttributeValues:{
				":newDate":req.query.dateRead,
			}
		};
		
		if(req.query.author != null) {
			console.log(req.query.author);
			updatedBook.UpdateExpression += ", author = :newAuthor";
			console.log(updatedBook.UpdateExpression);
			updatedBook.ExpressionAttributeValues[":newAuthor"] = req.query.author;
		}
		
		if(req.query.genre != null) {
			updatedBook.UpdateExpression += ", genre = :newGenre";
			updatedBook.ExpressionAttributeValues[":newGenre"] = req.query.genre;
		}
		
		if(req.query.picture != null) {
			updatedBook.UpdateExpression += ", picture = :newPicture";
			updatedBook.ExpressionAttributeValues[":newPicture"] = req.query.picture;
		}
		
		if(req.query.rating != null) {
			updatedBook.UpdateExpression += ", rating = :newRating";
			updatedBook.ExpressionAttributeValues[":newRating"] = req.query.rating;
		}
		
		db.update(updatedBook, function(err, data) {//updating the book with the new avg
			if (err) {
				console.log(err);
				res.status(500).send();//internal error
			} else {
				res.status(201).send();//book updated
			}
		});
	}
	else {
		res.status(304).send();//nothing to be updated, fine
	}
	
	
});

app.post('/books*', function (req, res) {//returns all books for a given user - for paths like /books?email={email}&title={title} - DUPE TO PUT

	var newBook = {
		TableName: "bookLogBooks",
		Item: {
			email: req.query.email,
			title: req.query.title,
			author: req.query.author,
			genre: req.query.genre,
			picture: req.query.picture,
			dateRead: req.query.dateRead,
			rating: req.query.rating
		},
	};

	db.put(newBook, function(err, data) {
		if(err) {
			console.log(err);
			res.status(500).send();//internal error
		}
		else {
			res.status(201).send();//book recorded
		}
	});
});

app.delete('/books*', function (req, res) {//deletes the given user and all associated books - for paths like /users?email={email}&title={title}
	
	var deleteBook = {
		TableName:"bookLogBooks",
		Key:{
				"email": req.query.email,
				"title": req.query.title
			}
	};
	
	db.delete(deleteBook, function(err, data) {//deleting the user from the users table
	
	
	
		if(err) {
			console.log(err);
			res.status(500).send();//internal error - user not deleted
		}
		else{
			res.status(200).send();//book deleted
		}
	});
		
});


app.all('*', function (req, res) {
  res.status(400);//bad call
});



//creating the server
app.listen(port, function () {
	console.log('server.js server/router for bookLog running');
=======
/*
Name: Lauren Miller
Course: CS496: Mobile/Cloud Software Development
Assignment: Final Assignment -- BookLog API
Date: 8/11/2016
*/

/*
Example record for bookLogBooks:

{
  "author": "example_author",
  "dateRead": "1470947821098",
  "email": "example_email",
  "genre": "fantasy",
  "picture": "http://img1.joyreactor.com/pics/post/1000-frames-maze-gif-1265833.gif",
  "rating": "4.0",
  "title": "example_title"
}

Example record for bookLogUsers:

{
	"email": "266228007"
	"pass:"-1322970774"
}

*/

//setting up modules, files, ports, etc.
var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var AWS = require('aws-sdk');
var db = new AWS.DynamoDB.DocumentClient({region: "us-west-2", accessKeyId: "AKIAI23TEKUL5NWX2VPQ", secretAccessKey: "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",});

var port = process.env.PORT || 5000;

app.all('*', function(req, res, next) {//if JSON accepted
	if (req.accepts(['json', 'application/json']) || req.accepts(['json', 'application/json'])) {
		next();
	}
	else {//if JSON not accepted, error
		res.status(400).send({"error":"must accept JSON"});
	}   
});

app.get('/$', function(req, res) {
		res.status(200).send({"routes":["/users?email={email}&pass={password}","/books?email={email}&title={title}"]});
});


//User Routes

app.post('/users*', function (req, res) {//creates a new user with the given email and password hash. If the user already exists, update nothing - for paths like /users?email={email}&pass={password}

	var newUser = {
		TableName: "bookLogUsers",
		Item: {
			email: req.query.email,
			pass: req.query.pass
		},
		ConditionExpression: "attribute_not_exists(email)"//the email should not already be recorded
	};

	db.put(newUser, function(err, data) {
		if(err) {//if dynamoDB returns an error
			console.log(err);
			res.status(304).send();//user already exists
		}
		else {//if no error is returned 
			res.status(201).send();//the user has been added	
		}
	});

});

app.get('/users*', function (req, res) {//returns if there is a user with the given email and password hash - for paths like /users?email={email}&pass={password}

	var theUser = {
		TableName : "bookLogUsers",
		FilterExpression: "email = :theEmail and pass = :thePass",
		ExpressionAttributeValues: {
			":theEmail":req.query.email,
			":thePass":req.query.pass
		}
	};
	
	db.scan(theUser, function(err, data) {
		if (err) {//if dynamoDB returns an error
			console.log(err);
			res.status(500).send();//internal server error
		}
		else if(!data.Items[0]) {//if no owners with the given email are found	
			res.status(404).send();//not found
		}
		else {//if the given book owner exists
			res.status(200).send();
		}
	});
	
});

app.delete('/users*', function (req, res) {//deletes the given user and all associated books - for paths like /users?email={email}
	
	var deleteUser = {
		TableName:"bookLogUsers",
		Key:{
				"email": req.query.email
			}
	};
	
	db.delete(deleteUser, function(err, data) {//deleting the user from the users table
		if(err) {
			res.status(500).send();//internal error - user not deleted
		}
		else {//scanning for items in the book table with given email, then looping through and deleting one by one
			var theBook = {
				TableName : "bookLogBooks",
				ProjectionExpression:"title",
				FilterExpression:"email = :theEmail",
				ExpressionAttributeValues: {
					":theEmail":req.query.email
				}
			};
			
			db.scan(theBook, function(err, data) {
				if (err) {
					console.log(err);
					res.status(500).send();//internal error
				}
				else {
					var isError = false;
					
					for(i = 0; i < data.Count; i++) {
						
						var deleteOwner = {
							TableName:"bookLogBooks",
							Key:{
									"email": req.query.email,
									"title": data.Items[i].title
								}
						};
						
						db.delete(deleteOwner, function(err, data) {
							if(err) {
								isError = true;//tracking if error deleting books
							}
						});
					}
					
					if (!isError) {
						res.status(200).send();//user deleted
					}
					else {
						res.status(304).send();//books not deleted correctly
					}	
				}
			});

		}
	});
		
});



//Books Routes

app.get('/books*', function (req, res) {//returns all books for a given user - for paths like /books?email={email}

	var theBook = {
		TableName : "bookLogBooks",
		ProjectionExpression:"title, author, rating, picture, genre, dateRead",
		FilterExpression:"email = :theEmail",
		ExpressionAttributeValues: {
			":theEmail":req.query.email
		}
		
	};
	
	db.scan(theBook, function(err, data) {
		if (err) {
			console.log(err);
			res.status(500).send();//internal error
		}
		else if(!data.Items[0]) {
			res.status(404).send();//no owners with the given email are found	
		}
		else {//if the given book owner exists
		
			res.send({"booksOwned":data.Items});
		}
	});
});

app.put('/books*', function (req, res) {//returns all books for a given user - for paths like /books?email={email}&title={title}
	
	if(req.query.author != null || req.query.genre != null || req.query.picture != null || req.query.dateRead != null || req.query.rating != null) {//ensuring that some values are to be set
		var updatedBook = {
			TableName: "bookLogBooks",
			Key:{
				"email": req.query.email,
				"title": req.query.title
			},
			UpdateExpression: "set dateRead = :newDate",
			ExpressionAttributeValues:{
				":newDate":req.query.dateRead,
			}
		};
		
		if(req.query.author != null) {
			console.log(req.query.author);
			updatedBook.UpdateExpression += ", author = :newAuthor";
			console.log(updatedBook.UpdateExpression);
			updatedBook.ExpressionAttributeValues[":newAuthor"] = req.query.author;
		}
		
		if(req.query.genre != null) {
			updatedBook.UpdateExpression += ", genre = :newGenre";
			updatedBook.ExpressionAttributeValues[":newGenre"] = req.query.genre;
		}
		
		if(req.query.picture != null) {
			updatedBook.UpdateExpression += ", picture = :newPicture";
			updatedBook.ExpressionAttributeValues[":newPicture"] = req.query.picture;
		}
		
		if(req.query.rating != null) {
			updatedBook.UpdateExpression += ", rating = :newRating";
			updatedBook.ExpressionAttributeValues[":newRating"] = req.query.rating;
		}
		
		db.update(updatedBook, function(err, data) {//updating the book with the new avg
			if (err) {
				console.log(err);
				res.status(500).send();//internal error
			} else {
				res.status(201).send();//book updated
			}
		});
	}
	else {
		res.status(304).send();//nothing to be updated, fine
	}
	
	
});

app.post('/books*', function (req, res) {//returns all books for a given user - for paths like /books?email={email}&title={title} - DUPE TO PUT

	var newBook = {
		TableName: "bookLogBooks",
		Item: {
			email: req.query.email,
			title: req.query.title,
			author: req.query.author,
			genre: req.query.genre,
			picture: req.query.picture,
			dateRead: req.query.dateRead,
			rating: req.query.rating
		},
	};

	db.put(newBook, function(err, data) {
		if(err) {
			console.log(err);
			res.status(500).send();//internal error
		}
		else {
			res.status(201).send();//book recorded
		}
	});
});

app.delete('/books*', function (req, res) {//deletes the given user and all associated books - for paths like /users?email={email}&title={title}
	
	var deleteBook = {
		TableName:"bookLogBooks",
		Key:{
				"email": req.query.email,
				"title": req.query.title
			}
	};
	
	db.delete(deleteBook, function(err, data) {//deleting the user from the users table
	
	
	
		if(err) {
			console.log(err);
			res.status(500).send();//internal error - user not deleted
		}
		else{
			res.status(200).send();//book deleted
		}
	});
		
});


app.all('*', function (req, res) {
  res.status(400);//bad call
});



//creating the server
app.listen(port, function () {
	console.log('server.js server/router for bookLog running');
>>>>>>> 5bd9f8b4cf0bae172894285b63d020a7041bd1ae
});