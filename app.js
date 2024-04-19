const express = require('express');
var bodyParser=require("body-parser");
const app = express();
const PORT = 3000;
const {body, validationResult} = require('express-validator');

//create connection to MySQL
const mysql = require('mysql')
const database = mysql.createConnection({
  host: 'group-71-cosc-4353.c902yu2q8xbp.us-east-2.rds.amazonaws.com',
  user: 'admin',
  password: 'cosc4353',
  database: 'Group_71_COSC_4353'
})

database.connect(function(err)
{
	if(err) throw err;
	console.log("Database connection successful!");
});

app.set('view engine','ejs');

//tell app where to find static content
app.use(express.static('public'));
app.use(express.static('assets'));
app.use(express.static('src'));

//middleware for login page
app.use(bodyParser.urlencoded({extended:true}));

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/public/homepage.html");
});

app.post('/login.html',
		body('email').isEmail().withMessage('Invalid email'), 
		body('password').isLength({min:8}).withMessage('Invalid password. Must be at least 8 characters'),
		function (req, res) {
    const errors = validationResult(req);

	if(!errors.isEmpty())
	{
		return res.status(400).json(
		{
			success: false,
			errors:errors.array()
		});
	}

	var email = req.body.email;
	var password = req.body.password;
	var query = "SELECT Username, Password FROM UserCredentials WHERE Username=" + email + " AND Password=" + password;

	database.query(query, function(err, result)
	{
		if(err) throw err;

		if(result[0].Username == "" || result[0].Password == "")
		{
			console.log("not found");
			res.redirect('/login.html');
		}

		console.log("successfully found record");
	});

	//Will send to database when set up. For now, checks if data is in valid formats.
});

app.post('/registration.html',
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 8 }).withMessage('Invalid password. Must be at least 8 characters'),
    function (req, res) {
    const errors = validationResult(req);
  if(!errors.isEmpty())
  {
        return res.status(400).json(
        {
            success: false,
            errors:errors.array()
        });
    }


	var username = req.body.email;
    var password = req.body.password;
    var query = "INSERT INTO UserCredentials (Username, Password) VALUES ('" + username + "', MD5('" + password + "'))";

    database.query(query, function(err, result)
    {
        if(err) throw err;
        console.log("Values added to user credentials table successfully");
    });

	res.redirect('/login.html');
	
});


app.post('/profile_management.html',
        body('firstName').isLength({min:1, max:50}).withMessage('Invalid first name'),
		body('lastName').isLength({min:1, max:50}).withMessage('Invalid last name'),
		body('address1').isLength({min:1, max:100}).withMessage('Invalid address 1'),
		body('address2').isLength({min:0, max:100}).withMessage('Invalid address 2'),
		body('city').isLength({min:1, max:100}).withMessage('Invalid city'),
        body('zipcode').isNumeric().isLength({min:5, max:9}).withMessage('Invalid password. Must be at least 8 characters'),
        function (req, res) {
    const errors = validationResult(req);

    if(!errors.isEmpty())
    {
        return res.status(400).json(
        {
            success: false,
            errors:errors.array()
        });
    }

});

app.post('/fuel_quote_form.html',
    body('gallonsRequested').isNumeric().withMessage('Gallons requested must be a number'),
    body('address').notEmpty().withMessage('Address is required'),
    body('deliveryDate').isISO8601().toDate(),
    function (req, res) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { gallonsRequested, address, deliveryDate } = req.body;

        // Calculate total due based on gallons requested (assuming $1.25 per gallon)
        const pricePerGallon = 1.25;
        const totalDue = parseFloat(gallonsRequested) * pricePerGallon;

        // Format delivery date in MySQL compatible format (YYYY-MM-DD)
        const formattedDeliveryDate = deliveryDate.toISOString().split('T')[0];

        // Insert fuel quote data into the database
        const query = "INSERT INTO FuelQuotes (gallonsRequested, address, deliveryDate, totalDue) VALUES (?, ?, ?, ?)";
        const values = [gallonsRequested, address, formattedDeliveryDate, totalDue];

        database.query(query, values, function (err, result) {
            if (err) {
                console.error("Error inserting fuel quote data:", err);
                return res.status(500).json({
                    success: false,
                    message: 'Error inserting fuel quote data'
                });
            }
            console.log("Fuel quote data added successfully");
            // Send response with fuel quote data
            return res.status(200).json({
                success: true,
                message: 'Fuel quote submitted successfully',
                data: {
                    gallonsRequested: gallonsRequested,
                    address: address,
                    deliveryDate: formattedDeliveryDate,
                    totalDue: totalDue
                }
            });
        });
    });




app.listen(3000, function () {
  console.log("Server is running on localhost3000");
});
