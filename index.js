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
    Q = require('q'),
    _ = require('lodash');

// connect with the database
db.connect();

var Selfie = db.table('Selfie');
 
var MIN_DATE = moment('2015-08-09');

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
        
        if(event.since && event.since.length > 0) {
            // If the since query parameter is provided, set it
            since = moment(event.since);
        }
        
        // Retrieve all the selfies from the database
        return fetch(since);
    }).then(function(result) {
        // Send the result back to the client
        context.succeed(_.flatten(result));
    }).catch(function(err) {
        // Print the error if something went wrong
        console.error(err, err.stack);
        
        // Something went wrong
        context.fail(err);
    });
    
    function fetch(date) {
        date = date || moment();
        
        return fetchHelper(date);
    };
    
    function fetchHelper(date) {
        date = date || moment();
        
        var promises = [];
        
        for(var i=1; i<=50; i++) {
            promises.push(Selfie.find({subid: date.format('YYYY-MM-DD') + '_' + i}, 'SubDateIndex').select('name email date description image').exec());
        }
        
        return Q.all(promises)
            .then(function(data) {
                return _.flatten(data);
            })
            .then(function(result) {
                if(result.length < 50 && date.diff(MIN_DATE, 'days') > 0) {
                    date.subtract(1, 'day');
                    
                    return fetchHelper(date)
                        .then(function(data) {
                            return result.concat(data);
                        });
                }
                
                return result;
            });
    }
};