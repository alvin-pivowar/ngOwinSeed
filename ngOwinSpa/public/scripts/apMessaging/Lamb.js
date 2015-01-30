(function () {
    "use strict";

    /*
        Lamb:  "Little Angular Message Bus"
        
        This factory returns a singleton class named "Lamb".
        You must construct it before using. See the class definition, below.

        JSFiddle: http://jsfiddle.net/alvin_pivowar/do8o3yst/
    */
    angular
        .module("apMessagingLib")
        .factory("Lamb",
            ["$rootScope",
            function ($rootScope) {
                // Private Service Properties
                var subscribers = [];
                var LAMB_BUS = "$$LAMB$$";

                // Private Service Methods

                $rootScope.$on(LAMB_BUS, function (event, message) {
                    var topicMatches;

                    angular.forEach(subscribers, function (subscriber) {
                        topicMatches = message.getTopicMatches(message.publisher, subscriber);
                        if (topicMatches && subscriber.subscriberId != message.publisherId) {
                            subscriber.callbackFn(message.data, new MessageInfo(message.publisher, subscriber, topicMatches, message.data));
                        }
                    });
                });

                function publishImp(message) {
                    $rootScope.$broadcast(LAMB_BUS, message);
                };

                function subscribeImp(newSubscriber) {
                    angular.forEach(subscribers, function (subscriber) {
                        if (subscriber.subscriberId === newSubscriber.subscriberId && subscriber.topic === newSubscriber.topic) {
                            return;
                        }
                    });

                    subscribers.push(newSubscriber);
                };

                function unregisterImp(subscriberId) {
                    unsubscribeImp(null, subscriberId);
                };

                // If topic is null, all subscriptions for the subscriber will be removed.
                function unsubscribeImp(topic, subscriberId) {
                    var newsubscribers = [];

                    angular.forEach(subscribers, function (subscriber) {
                        if (subscriber.subscriberId != subscriberId ||
                            (subscriber.subscriberId === subscriberId && topic && topic !== subscriber.topic)) {
                            newsubscribers.push(subscriber);
                        }
                    });

                    subscribers = newsubscribers;
                };

                /*
                   Public Class "Lamb"
                   
                   var lamb = new Lamb(clientName, scope);
                   
                   lamb.clientId  unique string identifier composed of name and scope.$id
                   lamb.dispose();
                   lamb.publish(topic, data);
                   lamb.subscribe(topic, callbackFn);
                   lamb.unsubscribe(topic);
                 */
                function Lamb(clientName, scope) {
                    // Constructor
                    if (!clientName) throw new Error("clientName cannot be null or empty.");
                    if (!scope) throw new Error("scope cannot be null.");

                    var that = (this instanceof Lamb) ? this : Object.create(Lamb.prototype);

                    // Public Lamb Properties
                    that.clientId = clientName + ":" + scope.$id;

                    // Private Lamb Methods
                    scope.$on("$destroy", function () {
                        that.dispose();
                    });

                    return that;
                }
                
                Lamb.prototype = {
                    dispose: function () {
                        if (this.clientId) {
                            unregisterImp(this.clientId);
                            this.clientId = null;
                        };
                    },
                    
                    publish: function (topic, data) {
                        var message;
                        var publisher;
                        
                        if (this.clientId) {
                            if (!topic) throw new Error("topic cannot be null or empty");

                            publisher = new Publisher(this.clientId, topic);
                            message = new Message(publisher, data);
                            publishImp(message);
                        }
                    },
                    
                    subscribe: function (topic, callbackFn) {
                        var subscriber;
                        
                        if (this.clientId) {
                            if (!topic) throw new Error("topic cannot be null or empty");

                            subscriber = new Subscriber(topic, this.clientId, callbackFn);
                            subscribeImp(subscriber);
                        }
                    },
                    
                    unsubscribe: function (topic) {
                        if (this.clientId) {
                            if (!topic) throw new Error("topic cannot be null or empty");

                            unsubscribeImp(topic, this.clientId);
                        }
                    }
                };

                return Lamb;
            }]);

    /*
       Message: {
           data: Javascript object of the message contents
           publisher
           
           getTopicMatches(): Build an array of literals based on matching the message topic to the subscriber's pattern.
       }
     */
    function Message(publisher, data) {
        this.data = data;
        this.publisher = publisher;
    };
    
    Message.prototype.getTopicMatches = function (publisher, subscriber) {
        var i;
        var publisherSubtopic;
        var subscriberSubtopic;
        var topicLength;
        var topicMatches;

        function getSubtopic(subtopics, index) {
            if (index < subtopics.length) {
                return subtopics[index];
            } else if (subtopics[subtopics.length - 1] === "*") {
                return "*";
            } else {
                return undefined;
            };
        };

        function isMatch(subtopic1, subtopic2) {
            if (! (subtopic1 && subtopic2)) return false;
            if (subtopic1 === "*" || subtopic2 === "*") return true;
            return (subtopic1 === subtopic2);
        };

        topicLength = Math.max(publisher.subtopics.length, subscriber.subtopics.length);
        topicMatches = [];
        for (i = 0; i < topicLength; ++i) {
            publisherSubtopic = getSubtopic(publisher.subtopics, i);
            subscriberSubtopic = getSubtopic(subscriber.subtopics, i);

            if (!isMatch(publisherSubtopic, subscriberSubtopic)) return null;
            topicMatches.push((publisherSubtopic !== "*") ? publisherSubtopic : subscriberSubtopic);
        };

        return topicMatches;
    };

    /*
        MessageInfo: {
           data
           publisherId
           publisherTopic
           subscriberId
           subscriberTopic
           topicMatches
           
           getSubtopic(index, defaultValue)
       }
     */
    function MessageInfo(publisher, subscriber, topicMatches, data) {
        this.publisherId = publisher.publisherId;
        this.publisherTopic = publisher.topic;
        this.subscriberId = subscriber.subscriberId;
        this.subscriberTopic = subscriber.topic;
        this.topicMatches = topicMatches;
        this.data = data;
    };
    
    MessageInfo.prototype.getSubtopic = function (index, defaultValue) {
        return (this.topicMatches && this.topicMatches.length > index) ? this.topicMatches[index]: defaultValue;
    };

    /*
       Publisher: {
           publisherId
           subtopics:  An array of the parts of the topic (a.b.c => [a, b, c])
           topic
       }
     */
    function Publisher(publisherId, topic) {
        this.publisherId = publisherId;
        this.subtopics = topic.split('.');
        this.topic = topic;
    };

    /*
       Subscriber: {
           callbackFn: Method to call when a matching message is received
           subscriberId: The identifier of the subscriber
           subtopics:  An array of the parts of the topic (a.b.c => [a, b, c])
           topic
       }
     */
    function Subscriber(topic, subscriberId, callbackFn) {
        this.callbackFn = callbackFn;
        this.subscriberId = subscriberId;
        this.subtopics = topic.split('.');
        this.topic = topic;
    };
})();