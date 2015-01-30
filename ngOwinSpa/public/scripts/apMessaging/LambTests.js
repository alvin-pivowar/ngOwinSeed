describe("Lamb Tests", function () {
    "use strict";

    beforeEach(module("apMessagingLib"));

    // Get the Lamb class (once).
    var _lamb = null;
    beforeEach(angular.mock.inject(function (Lamb) {
        if (!_lamb) {
            _lamb = Lamb;
        }
    }));

    // Set up the publishers and subscribers
    var studioBus;
    var moeBus;
    var moeScope;
    var larryBus;
    var curlyBus;
    beforeEach(angular.mock.inject(function ($rootScope) {
        studioBus = new _lamb("Studio", $rootScope.$new(true));
        moeScope = $rootScope.$new(true);
        moeBus = new _lamb("Moe", moeScope);
        larryBus = new _lamb("Larry", $rootScope.$new(true));
        curlyBus = new _lamb("Curly", $rootScope.$new(true));
    }));


    it("constructor test", angular.mock.inject(function ($rootScope) {
        var lamb = new _lamb("constructor test", $rootScope.$new(true));
        var isValidId = lamb.clientId.match(/constructor test:[0-9]+/);
        expect(isValidId).toBeTruthy();
    }));

    it("dispose test", function () {
        var moeSubscriptionCount = 0;
        moeBus.subscribe("stooge", function (data) {
            ++moeSubscriptionCount;
        });

        studioBus.publish("stooge", {});
        expect(moeSubscriptionCount).toBe(1);

        moeBus.dispose();
        expect(moeBus.clientId).toBeNull();
        studioBus.publish("stooge", {});
        expect(moeSubscriptionCount).toBe(1);
    });

    it("multiple part message test", function () {
        var moeMessage = null;
        moeBus.subscribe("stooge.moe", function (data, message) {
            expect(data === message.data).toBeTruthy();
            moeMessage = message;
        });

        studioBus.publish("stooge.moe", "You're fired!");

        expect(moeMessage).not.toBeNull();
        expect(moeMessage.data).toBe("You're fired!");

        var match = moeMessage.publisherId.match(/(Studio):[0-9]+/);
        var publisher = match[1];
        expect(publisher).toBe("Studio");

        expect(moeMessage.publisherTopic).toBe("stooge.moe");
        expect(moeMessage.topicMatches.length).toBe(2);
        expect(moeMessage.topicMatches[0]).toBe("stooge");
        expect(moeMessage.topicMatches[1]).toBe("moe");

        expect(moeMessage.getSubtopic(0)).toBe("stooge");
        expect(moeMessage.getSubtopic(1)).toBe("moe");

        expect(moeMessage.getSubtopic(2)).toBeUndefined();
        expect(moeMessage.getSubtopic(2, 12)).toBe(12);
    });

    it("multiple subscribers test", function () {
        var moeSubscriptionCount = 0;
        moeBus.subscribe("stooge.moe", function (data) {
            ++moeSubscriptionCount;
        });
        var larrySubscriptionCount = 0;
        larryBus.subscribe("stooge.larry", function (data) {
            ++larrySubscriptionCount;
        });
        var curlySubscriptionCount = 0;
        curlyBus.subscribe("stooge.curly", function (data) {
            ++curlySubscriptionCount;
        });

        var random = [1, 2, 1, 3, 3, 3, 2, 2, 3, 1];
        var topics = ["", "stooge.moe", "stooge.larry", "stooge.curly"];
        for (var i = 0; i < random.length; ++i) {
            studioBus.publish(topics[random[i]], {});
        }

        expect(moeSubscriptionCount).toBe(3);
        expect(larrySubscriptionCount).toBe(3);
        expect(curlySubscriptionCount).toBe(4);
    });

    it("no match test", function () {
        var moeSubscriptionCount = 0;
        moeBus.subscribe("stooge.moe", function (data) {
            ++moeSubscriptionCount;
        });

        studioBus.publish("stooge.moe.info", {});
        expect(moeSubscriptionCount).toBe(0);
    });

    it("padding pattern test", function () {
        var moeSubscriptionCount = 0;
        var moeMessage;
        moeBus.subscribe("*", function (data, message) {
            ++moeSubscriptionCount;
            moeMessage = message;
        });

        studioBus.publish("stooge.moe", {});
        expect(moeSubscriptionCount).toBe(1);
        expect(moeMessage.topicMatches.length).toBe(2);
        expect(moeMessage.getSubtopic(1)).toBe("moe");
    });

    it("scope destroy test", function () {
        var moeSubscriptionCount = 0;
        moeBus.subscribe("stooge", function (data) {
            ++moeSubscriptionCount;
        });

        studioBus.publish("stooge", {});
        expect(moeSubscriptionCount).toBe(1);

        moeScope.$destroy();
        expect(moeBus.clientId).toBeNull();
        studioBus.publish("stooge", {});
        expect(moeSubscriptionCount).toBe(1);
    });

    it("single part message test", function () {
        var moeMessage = null;
        moeBus.subscribe("stooge", function (data, message) {
            expect(data === message.data).toBeTruthy();
            moeMessage = message;
        });

        // Test
        studioBus.publish("stooge", "You're fired!");

        expect(moeMessage).not.toBeNull();
        expect(moeMessage.data).toBe("You're fired!");

        var match = moeMessage.publisherId.match(/(Studio):[0-9]+/);
        var publisher = match[1];
        expect(publisher).toBe("Studio");

        expect(moeMessage.publisherTopic).toBe("stooge");
        expect(moeMessage.topicMatches.length).toBe(1);
        expect(moeMessage.topicMatches[0]).toBe("stooge");
    });

    it("subscribe test", function () {
        var moeSubscriptionCount1 = 0;
        var moeSubscriptionCount2 = 0;
        var moeSubscriptionCount3 = 0;
        moeBus.subscribe("stooge.moe", function (data) {
            ++moeSubscriptionCount1;
        });
        moeBus.subscribe("stooge.howard.moe", function (data) {
            ++moeSubscriptionCount2;
        });
        moeBus.subscribe("stooge.howard.*", function (data) {
            ++moeSubscriptionCount3;
        });

        var random = [1, 2, 1, 3, 3, 3, 2, 2, 3, 1];
        var topics = ["", "stooge.moe", "stooge.howard.moe", "stooge.howard.curly"];
        for (var i = 0; i < random.length; ++i) {
            studioBus.publish(topics[random[i]], {});
        }

        expect(moeSubscriptionCount1).toBe(3);
        expect(moeSubscriptionCount2).toBe(3);
        expect(moeSubscriptionCount3).toBe(7);
    });

    it("unsubscribe test 1", function () {
        var moeSubscriptionCount = 0;
        moeBus.subscribe("stooge", function (data) {
            ++moeSubscriptionCount;
        });

        studioBus.publish("stooge", {});
        expect(moeSubscriptionCount).toBe(1);

        moeBus.unsubscribe("stooge");
        studioBus.publish("stooge", {});
        expect(moeSubscriptionCount).toBe(1);
    });

    it("unsubscribe test 2", function () {
        var moeSubscriptionCount1 = 0;
        var moeSubscriptionCount2 = 0;
        var moeSubscriptionCount3 = 0;
        moeBus.subscribe("stooge.moe", function (data) {
            ++moeSubscriptionCount1;
        });
        moeBus.subscribe("stooge.howard.moe", function (data) {
            ++moeSubscriptionCount2;
        });
        moeBus.subscribe("stooge.howard.*", function (data) {
            ++moeSubscriptionCount3;
        });

        var randomTopicIndex = [1, 2, 1, 3, 3, 3, 2, 2, 3, 1];
        var randomUnsubscribe = [2, 0, 0, 0, 3, 2, 2, 1, 1, 0];
        var topics = ["", "stooge.moe", "stooge.howard.moe", "stooge.howard.curly"];
        for (var i = 0; i < randomTopicIndex.length; ++i) {
            studioBus.publish(topics[randomTopicIndex[i]], {});
            switch (randomUnsubscribe[i]) {
                case 0:
                    break;
                case 1:
                    moeBus.unsubscribe("stooge.moe");
                    break;
                case 2:
                    moeBus.unsubscribe("stooge.howard.moe");
                    break;
                case 3:
                    moeBus.unsubscribe("stooge.howard.*");
                    break;
            }
        }

        expect(moeSubscriptionCount1).toBe(2);
        expect(moeSubscriptionCount2).toBe(0);
        expect(moeSubscriptionCount3).toBe(3);
    });

    it("wild-card topic test", function () {
        var ignoredMessageCount = 0;
        var moeSubscriptionCount = 0;
        moeBus.subscribe("stooge.howard.*", function (data, message) {
            if (message.getSubtopic(2) === "moe") {
                ++moeSubscriptionCount;
            } else {
                ++ignoredMessageCount;
            }
        });
        var larrySubscriptionCount = 0;
        larryBus.subscribe("stooge.fine.larry", function (data) {
            ++larrySubscriptionCount;
        });
        var curlySubscriptionCount = 0;
        curlyBus.subscribe("stooge.howard.*", function (data, message) {
            if (message.getSubtopic(2) === "curly") {
                ++curlySubscriptionCount;
            } else {
                ++ignoredMessageCount;
            }
        });

        var random = [1, 2, 1, 3, 3, 3, 2, 2, 3, 1];
        var topics = ["", "stooge.howard.moe", "stooge.fine.larry", "stooge.howard.curly"];
        for (var i = 0; i < random.length; ++i) {
            studioBus.publish(topics[random[i]], {});
        }

        expect(moeSubscriptionCount).toBe(3);
        expect(larrySubscriptionCount).toBe(3);
        expect(curlySubscriptionCount).toBe(4);
        expect(ignoredMessageCount).toBe(7);
    });

    it("wild publisher test", function () {
        debugger;
        var moeSubscriptionCount = 0;
        moeBus.subscribe("stooge.moe.howard", function (data, message) {
            ++moeSubscriptionCount;
        });
        var larrySubscriptionCount = 0;
        larryBus.subscribe("stooge.larry.fine", function (data) {
            ++larrySubscriptionCount;
        });
        var curlySubscriptionCount = 0;
        curlyBus.subscribe("stooge.curly.howard", function (data, message) {
            ++curlySubscriptionCount;
        });


        var anyStoogeSubscriptionCount = 0;
        moeBus.subscribe("stooge.*", function (data, message) {
            ++anyStoogeSubscriptionCount;
        });

        var howardFamilySubscriptionCount = 0;
        moeBus.subscribe("stooge.*.howard", function (data, message) {
            ++howardFamilySubscriptionCount;
        });

        studioBus.publish("stooge.*.howard", {});
        expect(moeSubscriptionCount).toBe(1);
        expect(larrySubscriptionCount).toBe(0);
        expect(curlySubscriptionCount).toBe(1);
        expect(anyStoogeSubscriptionCount).toBe(1);
        expect(howardFamilySubscriptionCount).toBe(1);

        studioBus.publish("stooge.*.fine", {});
        expect(moeSubscriptionCount).toBe(1);
        expect(larrySubscriptionCount).toBe(1);
        expect(curlySubscriptionCount).toBe(1);
        expect(anyStoogeSubscriptionCount).toBe(2);
        expect(howardFamilySubscriptionCount).toBe(1);

        studioBus.publish("stooge.*", {});
        expect(moeSubscriptionCount).toBe(2);
        expect(larrySubscriptionCount).toBe(2);
        expect(curlySubscriptionCount).toBe(2);
        expect(anyStoogeSubscriptionCount).toBe(3);
        expect(howardFamilySubscriptionCount).toBe(2);
    });
});