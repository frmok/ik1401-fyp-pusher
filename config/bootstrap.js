/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.bootstrap.html
 */
var MongoClient = require('mongodb').MongoClient;
var _agendaURL = 'mongodb://localhost:27017/agenda-example';
var Agenda = require('agenda');
var agenda = new Agenda({
  db: {
    address: 'localhost:27017/agenda-example'
  }
});

function graceful() {
  agenda.stop(function() {
    console.log("The server shuts down gracefully.");
    process.exit(0);
  });
}

process.on('SIGTERM', graceful);
process.on('SIGINT', graceful);
module.exports.bootstrap = function(cb) {
  MongoClient.connect(_agendaURL, function(err, db) {
    var collection = db.collection('agendaJobs');
    collection.update({}, {
      $set: {
        lockedAt: null
      }
    }, {
      w: 1,
      multi: true
    }, function(err, result) {
      console.log(result);
      _continueBoostrap();
    });
  });

  function _continueBoostrap() {
    agenda.jobs({}, function(err, jobs) {
      // Check the job list
      //console.log(jobs);
      for (i = 0; i < jobs.length; i++) {
        agenda.define(jobs[i].attrs.name, function(job, done) {
          var currentDate = new Date().getTime();
          var msg = job.attrs.data.msg;
          var startDate = job.attrs.data.startDate;
          var endDate = job.attrs.data.endDate;
          var repeatInterval = job.attrs.data.repeatInterval;
          var location_id = job.attrs.data.location_id;
          if (currentDate >= startDate && currentDate <= endDate || currentDate >= startDate && startDate == endDate) {
            console.log(new Date() + ' ' + msg);
            Transition
              .find({
                location_id: location_id,
                next_location: null
              })
              .exec(function(err, transitions) {
                var identifiers = [];
                for (i = 0; i < transitions.length; i++) {
                  identifiers.push(transitions[i].identifier);
                }
                Push.sendQuestion('4', identifiers);
              });
          }
          if (currentDate < endDate) {
            job.schedule(new Date(new Date().getTime() + repeatInterval * 60 * 1000));
          }
          job.save(function(err) {
            done();
          });
        });
      }
      agenda.start();
      cb();
    });
  }
};