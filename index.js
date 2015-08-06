'use strict';

/**
 * This microservice retrieves all the selfies from the database.
 * 
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  4 Aug. 2015
 */

// module dependencies
var db = require('dynongo'),
    Q = require('q');

// connect with the database
db.connect();

var Selfie = db.table('Selfie');
 
/**
 * Main entrypoint of the service.
 * 
 * @param {object}  event       The data regarding the event.
 * @param {object}  context     The AWS Lambda execution context.
 */
exports.handler = function(event, context) {    
    Q.fcall(function() {
        // Retrieve all the selfies from the database
        return Selfie.query({active: 1}).sort(1).exec();
    }).then(function(result) {
        // Send the result back to the client
        context.succeed(result);
    }).catch(function(err) {
        // Print the error if something went wrong
        console.error(err, err.stack);
        
        // Something went wrong
        context.fail(err);
    });
};