'use strict';

/**
 * This microservice retrieves all the selfies from the database.
 * 
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  4 Aug. 2015
 */

// module dependencies
var db = require('dynongo'),
    moment = require('moment'),
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
    // Log the event for debugging purposes
    console.log(event);
    
    Q.fcall(function() {
        var since;
        
        if(event.since) {
            // If the since query parameter is provided, set it
            since = moment(event.since);
        }
        
        // Retrieve all the selfies from the database
        return fetch(since);
    }).then(function(result) {
        // Send the result back to the client
        context.succeed(result);
    }).catch(function(err) {
        // Print the error if something went wrong
        console.error(err, err.stack);
        
        // Something went wrong
        context.fail(err);
    });
    
    function fetch(date) {
        date = date || moment();
        
        var promises = [];
        
        for(var i=0; i<1; i++) {
            promises = promises.concat(fetchForHour(date.format('YYYY-MM-DD') + '_' + date.format('HH')));
            
            date.subtract(1, 'hour');
        }
        
        return Q.all(promises);
    };
    
    function fetchForHour(hour) {
        var result = [];
        
        for(var i=1; i<=20; i++) {
            console.log({subid: hour + '_' + i});
            
            // Iterate over all the possible values
            result.push(Selfie.find({subid: hour + '_' + i}, 'SubDateIndex').select('name email description image').exec());
        }
        
        // Return the list of promises
        return result;
    }
};