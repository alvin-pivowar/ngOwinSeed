(function() {
    "use strict";
    var controllerName = "messagingTestCtrl";
    angular
        .module("TestLib")
        .controller(controllerName,
            ["$scope", "Lamb", "testService",
            function($scope, lamb, testService) {
                var vm = this;
                vm.apiMessage = null;
                vm.greeting = null;
                vm.lambCount = 0;
                vm.postData = {};

                vm.testLamb = testLamb;
                vm.testWebApi = testWebApi;

                init();

                function init() {
                    var bus = new lamb(controllerName, $scope);
                    bus.subscribe("test.lambCount", function(data) {
                        vm.lambCount = data;
                    });

                    testService.getGreeting().then(function(results) {
                        vm.greeting = results.data;
                    });
                }

                function testLamb() {
                    testService.incrementLambCount();
                }

                function testWebApi() {
                    testService.postEcho(vm.apiMessage).then(function(results) {
                        var echo = results.data;
                        vm.postData.id = echo.id;
                        vm.postData.message = echo.message;
                        vm.postData.timestamp = echo.timestamp;
                    });
                }
            }
            ]
        );
})();