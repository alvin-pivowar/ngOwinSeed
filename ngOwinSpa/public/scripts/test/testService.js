(function () {
    "use strict";
    var serviceName = "testService";

    angular
        .module("TestLib")
        .factory(serviceName,
            ["$http", "$rootScope", "Lamb",
            function ($http, $rootScope, Lamb) {
                var bus = new Lamb(serviceName, $rootScope.$new(true));
                var lambCount = 0;

                return {
                    getGreeting: function() {
                        return $http.get("/api/test/greeting");
                    },
                    incrementLambCount: function() {
                        bus.publish("test.lambCount", ++lambCount);
                    },
                    postEcho: function (message) {
                        return $http.post("/api/test/echo", message);
                    }
                }
            }]
        );
})();