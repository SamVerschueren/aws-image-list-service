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
 
var MIN_DATE = moment('2015-08-14').startOf('day'),
    ITEMS_PER_PAGE = 50;

/**
 * Main entrypoint of the service.
 * 
 * @param {object}  event       The data regarding the event.
 * @param {object}  context     The AWS Lambda execution context.
 */
exports.handler = function(event, context) {
    // Log the event for debugging purposes
    console.log(event);
    
    var since;
    
    Q.fcall(function() {
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
        return fetchHelper(date);
    };
    
    function fetchHelper(date, numberOfItems) {
        var start = (moment(date) || moment()).startOf('day');
        
        return Q.fcall(function() {
                var query;
            
                if(since) {
                    query = Selfie.find({id: start.format('YYYY-MM-DD'), date: {$lt: since.format()}}, 'DateIndex');
                }
                else {
                    query = Selfie.find({id: start.format('YYYY-MM-DD')});
                }
            
                return query.select('name email date description image').sort(-1).limit(numberOfItems || ITEMS_PER_PAGE).exec()
            })
            .then(function(result) {
                if(result.length === 0) {
                    start.subtract(1, 'day');
                }
                else {
                    since = moment(result[result.length-1].date);
                }
                
                if(result.length < ITEMS_PER_PAGE && start.diff(MIN_DATE, 'days') >= 0) {
                    return fetchHelper(start, ITEMS_PER_PAGE-result.length)
                        .then(function(data) {
                            return result.concat(data);
                        });
                }
                
                return result;
            });
    }
};