#Book Log API
This REST-based web API allows users to record books they have read. The API  uses Node.js and Express on the back-end, stores records in a DynamoDB database, and is deployed using Amazon Web Service’s Elastic Beanstalk.

#Functionality
Users can create, validate, and delete user accounts, which comprise an email and password. Users with accounts can then record or update records of the books they’ve read: the titles, authors, genres (out of a limited set of genres), ratings (out of 5 stars), and the the dates the books were read. 

#Limitations

This API was designed for use with the Book Log Android app, with the assumption that input validation would be handled in the app and that required parameters are included in requests to the API. Likewise, all formatting is done by the mobile app, so that all values input are saved and returned as strings, with the mobile app converting values to and from integers or float values, for example, as needed.

This API was developed under the assumption that developers of the app would have only a certain, limited use for the API. When not required by the app as-is, no messages are sent in response to requests to the API. Rather, status codes are used to provide information as to the status of requests. 

#Usage

All parameters are input as key-value pairs, as query parameters.

All responses other than one for a successful GET books request, which returns JSON, are limited to response codes alone.

<strong>GET users </strong><br>

The GET users call determines if there is a record of a user with the given email and password in the bookLogUsers table.

Path:<i> /users <br></i>
Required Query Parameters: <br>
<i>• email<br>
• pass <br></i>
Responses:<br>
<i>• 200	  The given email and password combination exists.<br>
• 404 	The given email and password combination does not exist.<br>
• 500 	There was an error processing the request.<br></i>

<strong>POST users </strong><br>

The POST users request records the given email and password in the bookLogUsers table if no record with the given email already exists.

Path:<i> /users<br></i>
Required Query Parameters: <br>
<i>• email<br>
• pass <br></i>
Responses:<br>
<i>• 201	  The given email and password have been recorded.<br>
• 304   There already exists a record with the given email. This has not been altered.<br></i>

<strong>DELETE users</strong><br>

The DELETE users call deletes the user with the given email from the bookLogUsers table and deletes all books associated with that email from the bookLogBooks table.

Path:<i> /users <br></i>
Required Query Parameters: <br>
<i>• email<br></i>
Responses:<br>
<i>• 200 	The user record in bookLogUsers and all associated book records in bookLogBooks have been deleted.<br>
• 304	The user record in bookLogUsers has been deleted, but there was an error deleting one or more book records from bookLogBooks.<br>
• 500	There was an error deleting the user record from bookLogUsers, and no book records have been deleted from bookLogBooks.<br></i>

<strong>GET books</strong><br>

The GET books call determines if there are books associated with a given email in the bookLogBooks table, and returns a JSON object containing the records for these books if they exist.

Path:<i> /books <br></i>
Required Query Parameters: <br>
<i>• email<br></i>
Responses:<br>
<i>• 200   There are book records associated with the given email, and their records are returned.<br>
• 404   There are no book records associated with the given email.<br>
• 500	  There was an error processing the request.<br></i>

<strong>POST books</strong><br>

The POST books call creates a record of a book with the given title and user email in the bookLogBooks table.

Path:<i> /books <br></i>
Required Query Parameters: <br>
<i>• email<br>
• title<br></i>
Optional Query Parameters:<br>
<i>• author<br>
• genre<br>
• picture<br>
• dateRead<br>
• rating<br></i>
Responses:<br>
<i>• 201   The book record has been created.<br>
• 500 	There was an error processing the request. There likely exists a record of the book already.<br></i>

<strong>PUT books</strong><br>

The PUT books call updates the record of the book with the given title and user email in the bookLogBooks table with all optional query parameters input.

Path:<i> /books <br></i>
Required Query Parameters: <br>
<i>• email<br>
• title<br></i>
Optional Query Parameters:<br>
<i>• author<br>
• genre<br>
• picture<br>
• dateRead<br>
• rating<br></i>
Responses:<br>
<i>• 201   The book record was successfully updated.<br>
• 304	  The book record not updated, as none of the optional parameters were input.<br>
• 500   There was an error processing the request. <br></i>

<strong>DELETE books</strong><br>

The DELETE books call deletes the record of the book with the given title and user email from the bookLogBooks table. 

Path:<i> /books <br></i>
Required Query Parameters: <br>
<i>• email<br>
• title<br></i>
Responses:<br>
<i>• 200 	The book record in with the given title and user email has been deleted from bookLogBooks.<br>
• 500   There was an error deleting the book record.<br></i>

