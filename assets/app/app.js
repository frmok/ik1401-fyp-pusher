// Make sure to include the `ui.router` module as a dependency
var app = angular.module('backendApp', [
    'ui.router',
    'ngSanitize',
    'nvd3ChartDirectives',
    'ui.bootstrap.datetimepicker',
  ])
  .run(['$rootScope', '$state', '$stateParams', '$http',
    function($rootScope, $state, $stateParams, $http) {
      $http.defaults.headers.common.UserToken = localStorage.getItem('token');
      $rootScope.$state = $state;
      $rootScope.$stateParams = $stateParams;
      $rootScope.updateLocationList = function() {
        $http.get('/location/index').then(function(res) {
          $rootScope.locations = res.data;
        });
      }
      $rootScope.updateLocationList();
    }
  ])
  .config(['$stateProvider', '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {
      $urlRouterProvider.otherwise('/location');
      $stateProvider.state("backend_location", {
        resolve: {
          locations: ['Location', '$stateParams', function(Location, $stateParams) {
            return Location.all();
          }]
        },
        templateUrl: "/partials/location.html",
        url: "/location",
        controller: ['$rootScope', '$scope', '$stateParams', 'locations', 'Location',
          function($rootScope, $scope, $stateParams, locations, Location) {
            $rootScope.currentAction = "Location Management";
            $scope.locations = locations.data;
            $scope.deleteLocation = function(index) {
              Location.delete($scope.locations[index])
                .then(function(res) {
                  $rootScope.updateLocationList();
                });
              $scope.locations.splice(index, 1);
            }
          }
        ]

      });

      $stateProvider.state("backend_location_detail", {
        resolve: {
          location: ['Location', '$stateParams', function(Location, $stateParams) {
            if ($stateParams.id) {
              return Location.get($stateParams.id);
            }
            return;
          }]
        },
        templateUrl: "/partials/location_detail.html",
        url: "/location/edit/{id}",
        controller: ['$rootScope', '$scope', '$stateParams', 'Location', 'location', 'Beacon',
          function($rootScope, $scope, $stateParams, Location, location, Beacon) {
            $scope.location = {};
            $scope.location.msgContent = '';
            $scope.newBeacon = {};
            if ($stateParams.id) {
              $scope.crud_action = $rootScope.currentAction = "Edit Location";
              $scope.location = location.data;
              $scope.newBeacon = {
                location_id: $scope.location.id
              };
            } else {
              $scope.location.msgType = 0;
              $scope.location.disabled = 0;
              $scope.crud_action = $rootScope.currentAction = "Add Location";
            }
            $scope.addBeacon = function() {
              $scope.msg_beacon = $scope.msg_beacon_error = '';
              Beacon
                .create($scope.newBeacon)
                .then(
                  function(res) {
                    console.log(res);
                    $scope.msg_beacon = "Successfully added";
                    $scope.location.beacons.push(res.data);
                    $scope.newBeacon = {
                      location_id: $scope.location.id
                    };
                  },
                  function() {
                    $scope.msg_beacon_error = "Error occurs";
                  });
            }
            $scope.editBeacon = function(index) {
              var beacon = $scope.location.beacons[index];
              $scope.msg_beacon = $scope.msg_beacon_error = '';
              Beacon
                .update(beacon)
                .then(
                  function(res) {
                    $scope.msg_beacon = "Successfully edited";
                  },
                  function() {
                    $scope.msg_beacon_error = "Error occurs";
                  });
            }
            $scope.deleteBeacon = function(index) {
              Beacon.delete($scope.location.beacons[index])
                .then(function(res) {
                  $scope.location.beacons.splice(index, 1);
                });
            }
            $scope.updateLocation = function() {
              if ($scope.location.id) {
                Location
                  .update($scope.location)
                  .then(
                    function(res) {
                      $scope.msg = "Successfully updated";
                      $rootScope.updateLocationList();
                    });
              } else {
                Location
                  .create($scope.location)
                  .then(
                    function(res) {
                      $scope.msg = "Successfully added";
                      $scope.location = res.data;
                      $scope.newBeacon = {
                        location_id: $scope.location.id
                      };
                      $scope.location.beacons = [];
                      $rootScope.updateLocationList();
                    });
              }
            }
          }
        ]
      });
      $stateProvider.state("backend_job_list", {
        resolve: {
          jobs: ['Job', '$stateParams', function(Job, $stateParams) {
            return Job.index();
          }]
        },
        templateUrl: "/partials/job_list.html",
        url: "/location/job/",
        controller: ['$rootScope', '$scope', '$stateParams', 'Job', 'jobs', '$filter',
          function($rootScope, $scope, $stateParams, Job, jobs, $filter) {
            $rootScope.currentAction = 'Job List';
            $scope.jobs = jobs.data;
            $scope.deleteJob = function(index) {
              Job.delete({
                  id: $scope.jobs[index]._id
                })
                .then(function(res) {
                  console.log(res);
                  $scope.jobs.splice(index, 1);
                  console.log("remaining jobs list", $scope.jobs);
                  // $rootScope.updateLocationList();
                })
                .catch(function(res) {
                  console.log(res);
                  $scope.jobs.splice(index, 1);
                  console.log("remaining jobs list", $scope.jobs);
                });
            }
          }
        ]
      });
      $stateProvider.state("backend_job_detail", {
        resolve: {},
        templateUrl: "/partials/job_detail.html",
        url: "/location/job/detail/{id}",
        resolve: {
          locations: ['Location', '$stateParams', function(Location, $stateParams) {
            return Location.all();
          }],
          job: ['Job', '$stateParams', function(Job, $stateParams) {
            if ($stateParams.id) {
              return Job.get($stateParams.id);
            }
            return;
          }],
          adRecords: ['AdRecord', '$stateParams', function(AdRecord, $stateParams) {
            if ($stateParams.id) {
              return AdRecord.byAdvertisement($stateParams.id);
            }
            return;
          }],
        },
        controller: ['$rootScope', '$scope', '$stateParams', 'Job', '$filter', 'locations', 'job', 'adRecords',
          function($rootScope, $scope, $stateParams, Job, $filter, locations, job, adRecords) {
            $rootScope.currentAction = 'Create new advertisement';
            $scope.crud_action = 'Create new advertisement';
            $scope.locations = locations.data;
            $scope.onTimeSet = function(newDate, oldDate) {
              $scope.startDate = $filter('date')(newDate, 'yyyy-MM-dd HH:mm:ss');
              $scope.endDate = $filter('date')(newDate, 'yyyy-MM-dd HH:mm:ss');
              $scope.job.startDate = new Date(newDate).getTime();
              $scope.job.endDate = new Date(newDate).getTime();
            }
            $scope.onTimeSet2 = function(newDate, oldDate) {
              $scope.endDate = $filter('date')(newDate, 'yyyy-MM-dd HH:mm:ss');
              $scope.job.endDate = new Date(newDate).getTime();
            }
            $scope.onTimeSet3 = function(newDate, oldDate) {
              $scope.eventStartDate = $filter('date')(newDate, 'yyyy-MM-dd HH:mm:ss');
              $scope.job.eventStartDate = new Date(newDate).getTime();
            }
            $scope.onTimeSet4 = function(newDate, oldDate) {
              $scope.eventEndDate = $filter('date')(newDate, 'yyyy-MM-dd HH:mm:ss');
              $scope.job.eventEndDate = new Date(newDate).getTime();
            }
            $scope.addJob = function() {
              Job.create($scope.job)
                .then(function(res) {
                  $scope.msg = "Successfully created";
                  $scope.job = {};
                  $scope.job.location_id = $scope.locations[0].id;
                  $scope.job.type = 1;
                  $scope.job.msgType = 1;
                  $scope.job.repeatInterval = 1;
                  $scope.startDate = $scope.endDate = "";
                  $scope.eventStartDate = $scope.eventEndDate = null;
                });
            };
            if ($stateParams.id) {
              $scope.adRecords = adRecords.data;
              $rootScope.currentAction = 'Advertisement';
              $scope.crud_action = 'Advertisement';
              $scope.job = job.data;
              $scope.job.location_id = job.data.data.location_id;
              $scope.startDate = moment.unix(job.data.data.startDate / 1000).format('YYYY-MM-DD HH:mm:ss');
              $scope.endDate = moment.unix(job.data.data.endDate / 1000).format('YYYY-MM-DD HH:mm:ss');
              $scope.eventStartDate = moment.unix(job.data.data.eventStartDate / 1000).format('YYYY-MM-DD HH:mm:ss');
              $scope.eventEndDate = moment.unix(job.data.data.eventEndDate / 1000).format('YYYY-MM-DD HH:mm:ss');
              if ($scope.startDate == $scope.endDate) {
                $scope.job.type = 0;
              } else {
                $scope.job.type = 1;
              }
              $scope.job.repeatInterval = job.data.data.repeatInterval;
              $scope.job.msgType = job.data.data.msgType;
              $scope.job.msgContent = job.data.data.msgContent;
              $scope.job.msgText = job.data.data.msgText;
            } else {
              $scope.job = {};
              $scope.job.msgType = 1;
              $scope.job.msgContent = '';
              $scope.job.location_id = $scope.locations[0].id;
              $scope.job.type = 1;
              $scope.job.repeatInterval = 1;
            }
          }
        ]
      });

      $stateProvider.state("backend_location_log", {
        resolve: {
          transitions: ['Transition', '$stateParams', function(Transition, $stateParams) {
            if ($stateParams.id) {
              return Transition.log($stateParams.id);
            }
            return;
          }],
          uniqueVisitor: ['Transition', '$stateParams', function(Transition, $stateParams) {
            if ($stateParams.id) {
              return Transition.uniqueVisitorToday($stateParams.id);
            }
            return;
          }],
          popularPlace: ['Transition', '$stateParams', function(Transition, $stateParams) {
            if ($stateParams.id) {
              return Transition.popularPlace($stateParams.id);
            }
            return;
          }],
        },
        templateUrl: "/partials/location_log.html",
        url: "/location/log/{id}",
        controller: ['$rootScope', '$scope', '$stateParams', 'transitions', '$filter', 'uniqueVisitor', 'popularPlace', '$filter',
          function($rootScope, $scope, $stateParams, transitions, $filter, uniqueVisitor, popularPlace, $filter) {
            $scope.locationID = $stateParams.id;
            $rootScope.currentAction = 'Transition Log';
            $scope.transitions = transitions.data;
            $scope.uniqueVisitor = uniqueVisitor.data.count;
            if(popularPlace.data.length > 0){
              $scope.popularPlace = popularPlace.data[0]._id.next_location;
            }else{
              $scope.popularPlace = "No Place";
            }
            $scope.onTimeSet = function(newDate, oldDate) {
              $scope.fromDate = $filter('date')(newDate, 'yyyy-MM-dd HH:mm:ss');
            }
            $scope.onTimeSet2 = function(newDate, oldDate) {
              $scope.toDate = $filter('date')(newDate, 'yyyy-MM-dd HH:mm:ss');
            }
          }
        ]
      });
      $stateProvider.state("backend_location_monitor", {
        resolve: {
          location: ['Location', '$stateParams', function(Location, $stateParams) {
            if ($stateParams.id) {
              return Location.get($stateParams.id);
            }
            return;
          }],
          transitions: ['Transition', '$stateParams', function(Transition, $stateParams) {
            if ($stateParams.id) {
              return Transition.atLocation($stateParams.id);
            }
            return;
          }],
          duration: ['Transition', '$stateParams', function(Transition, $stateParams) {
            if ($stateParams.id) {
              return Transition.duration($stateParams.id);
            }
            return;
          }],
        },
        templateUrl: "/partials/location_monitor.html",
        url: "/location/{id}",
        controller: ['$rootScope', '$scope', '$stateParams', 'Location', 'location', 'transitions', 'Transition', 'duration', '$filter',
          function($rootScope, $scope, $stateParams, Location, location, transitions, Transition, duration, $filter) {
            $scope.modal = {
              open: false,
              msgType: 1,
              msgContent: '',
              msgText: '',
              eventStartDate: null,
              eventEndDate: null
            };
            console.log(duration.data.duration);
            $scope.location = location.data;
            $scope.transitions = transitions.data || [];
            $scope.crud_action = $rootScope.currentAction = "Location Monitoring";
            //set event start date
            $scope.onTimeSet = function(newDate, oldDate) {
                $scope.eventStartDate = $filter('date')(newDate, 'yyyy-MM-dd HH:mm:ss');
                $scope.modal.eventStartDate = newDate.getTime();
              }
              //set event end date
            $scope.onTimeSet2 = function(newDate, oldDate) {
                $scope.eventEndDate = $filter('date')(newDate, 'yyyy-MM-dd HH:mm:ss');
                $scope.modal.eventEndDate = newDate.getTime();
              }
              //for sending question
            $scope.sendQuestion = function() {
                if ($scope.modal.msgText === "") {
                  alert('Please fill in the text')
                  return;
                }
                if ($scope.modal.msgType > 1) {
                  if ($scope.modal.msgContent === "") {
                    alert('Please fill in the content')
                    return;
                  }
                }
                Transition
                  .sendQuestion({
                    location_id: $scope.location.id,
                    msgContent: $scope.modal.msgContent,
                    msgType: parseInt($scope.modal.msgType),
                    msgText: $scope.modal.msgText,
                    eventStartDate: $scope.modal.eventStartDate,
                    eventEndDate: $scope.modal.eventEndDate
                  }).then(
                    function(res) {
                      $scope.modal.open = false;
                      $scope.modal.msgType = 1;
                      $scope.modal.msgContent = '';
                      $scope.modal.msgText = '';
                      $scope.eventStartDate = null;
                      $scope.eventEndDate = null;
                    })
              }
              //subscribe to the transition room
            if (!io.socket.alreadyListeningToTransition) {
              io.socket.alreadyListeningToTransition = true;
              io.socket.get('/transition/subscribeToTransition', function(resData) {
                console.log(resData);
              });
            } else {
              io.socket.removeAllListeners("transition_created");
              io.socket.removeAllListeners("transition_updated");
            }
            //subscribe to transition_created event
            io.socket.on('transition_created', function(msg) {
              if (msg.transition.location_id === $scope.location.id) {
                io.socket.alreadyListeningToTransitionCreate = true;
                console.log(msg.transition);
                msg.transition.createdAt = moment(msg.transition.createdAt, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
                //add the new transition
                $scope.transitions.push(msg.transition);
                console.log($scope.transitions);
                //add total people
                $scope.location.people++;
                $scope.$apply();
              }
            });
            //subscribe to transition_updated event
            io.socket.on('transition_updated', function(msg) {
              io.socket.alreadyListeningToTransitionUpdate = true;
              if (msg.transition.location_id === $scope.location.id) {
                for (var i = 0; i < $scope.transitions.length; i++) {
                  if ($scope.transitions[i].id == msg.transition.id) {
                    $scope.transitions.splice(i, 1);
                    $scope.location.people--;
                    $scope.$apply();
                  }
                }
              }
            });
          }
        ]
      });


      $stateProvider.state("backend_transition_stat", {
        resolve: {},
        templateUrl: "/partials/stat.html",
        url: "/location/stat/{id}",
        controller: ['$rootScope', '$scope', '$stateParams', 'Transition',
          function($rootScope, $scope, $stateParams, Transition) {
            $rootScope.currentAction = 'Statistics';
            console.log(Transition);
            $scope.xAxisTickFormatFunction = function() {
              return function(d) {
                return d3.time.format('%Y-%m-%d')(new Date(d));
              }
            }
            Transition.statPeopleCount($stateParams.id).then(function(res) {
              $scope.best_selling_item = [res.data];
            });
            Transition.statDuration($stateParams.id).then(function(res) {
              $scope.profit = [res.data];
            });
          }
        ]
      });
    }
  ]);

app.factory('Location', ['$http', function($http) {
  var factory = {};
  factory.all = function() {
    return $http.get('/location/index/');
  };
  factory.get = function(id) {
    return $http.get('/location/detail/' + id);
  };
  factory.create = function(location) {
    return $http.post('/location/create', location);
  };
  factory.update = function(location) {
    return $http.post('/location/update', location);
  };
  factory.delete = function(id) {
    return $http.post('/location/delete/', id);
  };
  return factory;
}]);

app.factory('Transition', ['$http', function($http) {
  var factory = {};
  factory.atLocation = function(id) {
    return $http.get('/transition/atLocation/' + id);
  };
  factory.log = function(id) {
    return $http.get('/transition/log/' + id);
  };
  factory.sendQuestion = function(data) {
    return $http.post('/transition/sendQuestion/', data);
  };
  factory.duration = function(id) {
    return $http.get('/transition/duration/' + id);
  }
  factory.statDuration = function(id) {
    return $http.get('/transition/statDuration?id=' + id);
  }
  factory.statPeopleCount = function(id) {
    return $http.get('/transition/statPeopleCount?id=' + id);
  }
  factory.popularPlace = function(id) {
    return $http.get('/transition/popularPlace?id=' + id);
  }
  factory.uniqueVisitorToday = function(id) {
    return $http.get('/transition/uniqueVisitorToday?id=' + id);
  }
  return factory;
}]);

app.factory('Beacon', ['$http', function($http) {
  var factory = {};
  factory.create = function(beacon) {
    return $http.post('/beacon/create/', beacon);
  };
  factory.update = function(beacon) {
    return $http.post('/beacon/update/', beacon);
  };
  factory.delete = function(id) {
    return $http.post('/beacon/delete/', id);
  };
  return factory;
}]);

app.factory('Job', ['$http', function($http) {
  var factory = {};
  factory.index = function() {
    return $http.get('/agenda/index');
  };
  factory.get = function(id) {
    return $http.get('/agenda/detail/' + id);
  };
  factory.create = function(job) {
    return $http.post('/agenda/create/', job);
  };
  factory.delete = function(id) {
    console.log(id);
    return $http.post('/agenda/delete/', id);
  };
  return factory;
}]);

app.factory('AdRecord', ['$http', function($http) {
  var factory = {};
  factory.byAdvertisement = function(id) {
    return $http.get('/record/byAdvertisement/' + id);
  };
  factory.create = function(job) {
    return $http.post('/record/create/', job);
  };
  return factory;
}]);

app.filter('capitalizeFirst',
  function() {
    return function(input, scope) {
      var text = input.substring(0, 1).toUpperCase() + input.substring(1).toLowerCase();
      return text;
    }
  });

app.filter('fromDate',
  function() {
    return function(transitions, fromDate) {
      var filtered = [];
      angular.forEach(transitions, function(transition) {
        if (fromDate !== undefined && fromDate != "") {
          if (moment(transition.timestamp).add('8', 'hours').isAfter(moment(fromDate))) {
            filtered.push(transition);
          }
        } else {
          filtered.push(transition);
        }
      });
      return filtered;
    };
  });

app.filter('toDate',
  function() {
    return function(transitions, toDate) {
      var filtered = [];
      angular.forEach(transitions, function(transition) {
        if (toDate !== undefined && toDate != "") {
          if (moment(transition.timestamp).add('8', 'hours').isBefore(moment(toDate))) {
            filtered.push(transition);
          }
        } else {
          filtered.push(transition);
        }
      });
      return filtered;
    };
  });
app.filter('timestampToTime',
  function() {
    return function(input, scope) {
      var time = moment.unix(input / 1000).format("YYYY-MM-DD HH:mm:ss");
      return time;
    }
  }
);
app.directive('localTime', ['$interval', 'dateFilter', function($interval, dateFilter) {
  return {
    scope: {
      current: '=current',
    },
    link: function(scope, element, attrs) {
      element.text(moment(scope.current, 'YYYY-MM-DD HH:mm:ss').add('8', 'hours').format('YYYY-MM-DD HH:mm:ss'));
    }
  }
}]);
app.directive('relativeTime', ['$interval', 'dateFilter', function($interval, dateFilter) {
  return {
    scope: {
      current: '=current',
    },
    link: function(scope, element, attrs) {
      function updateTime() {
        element.text(moment(scope.current, 'YYYY-MM-DD HH:mm:ss').add('8', 'hours').fromNow());
      }
      timeoutId = $interval(function() {
        updateTime();
      }, 1000);
      updateTime();
    }
  }
}]);
app.controller('mainController', ['$rootScope', '$scope', '$http',
  function($rootScope, $scope, $http) {
    io.socket.on('disconnect', function() {
      alert('Disconnect to server. Please refresh the page.');
    });
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      $scope.loading = true;
      $scope.finish = false;
    });
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
      $scope.loading = false;
      $scope.finish = true;
    });
  }
]);