    // set up ======================================================================
    var express = require('express');
    var app = express(); 						// create our app w/ express
    var port = process.env.PORT || 8080; 				// set the port
    var bodyParser = require('body-parser');
    var methodOverride = require('method-override');



    app.use(function (req, res, next) {


        console.log(req.body)
        // Website you wish to allow to connect
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

        // Set to true if you need the website to include cookies in the requests sent
        // to the API (e.g. in case you use sessions)
        res.setHeader('Access-Control-Allow-Credentials', true);

        // Pass to next layer of middleware
        next();
    });
    app.use(bodyParser.urlencoded({'extended': 'true'})); // parse application/x-www-form-urlencoded
    app.use(bodyParser.json()); // parse application/json
    app.use(bodyParser.json({type: 'application/vnd.api+json'})); // parse application/vnd.api+json as json
    app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request

    require('./app/routes/todoListRoutes.js')(app);

   
    // routes ======================================================================

    // listen (start app with node server.js) ======================================
    app.listen(port);
    console.log("App listening on port " + port);


