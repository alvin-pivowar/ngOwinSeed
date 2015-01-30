(function () {
    'use strict';

    angular
        .module("apMessagingLib")
        .factory("signalRService",
            ["$injector", "$rootScope", "$window", "Lamb",
            function ($injector, $rootScope, $window, Lamb) {
                var POST_TRANSFORM_HOOK = 0x01;
                var PRE_TRANSFORM_HOOK = 0x02;
                var RAW_HOOK = 0x04;

                var bus;
                var hooks = null;
                var transforms = null;

                init();

                function callHooks(when, topic, data, transform) {
                    var info;

                    info = new HookInfo(topic, data, when, transform);
                    hooks.forEach(function (hook) {
                        if ((hook.when & when) !== 0) {
                            hook.callbackFn(info);
                        };
                    });
                };

                function findTransform(message) {
                    var i;

                    if (transforms) {
                        for (i = 0; i < transforms.length; ++i) {
                            if (transforms[i].regex.test(message.topic)) {
                                return transforms[i];
                            };
                        };
                    };

                    return null;
                };

                function handler(topic, serverData) {
                    var clientData;
                    var message;
                    var transform;

                    if (hooks) {
                        callHooks(RAW_HOOK, topic, serverData);
                    }

                    try {
                        clientData = JSON.parse(serverData);
                    } catch (ex) {
                        clientData = (serverData || angular.isString(serverData)) ? serverData : null;
                    };

                    message = new Message(topic, clientData);
                    transform = findTransform(message);

                    if (hooks) {
                        callHooks(PRE_TRANSFORM_HOOK, topic, clientData, transform);
                    }

                    if (transform) {
                        message = transform.fn(message);
                    };
                    
                    if (hooks) {
                        callHooks(POST_TRANSFORM_HOOK, message.topic, message.data, transform);
                    }

                    bus.publish(message.topic, message.data);
                };

                function init() {
                    var config;
                    var connection;
                    var jQuery;
                    var proxy;

                    try {
                        config = $injector.get("signalrConfig");
                    } catch (ex) { };

                    if (!config) throw new Error("signalRConfig cannot be injected");
                    if (!config.hubName) throw new Error("signalRConfig: missing hubName");
                    if (!config.channelName) throw new Error("signalRConfig: missing channelName");

                    jQuery = $window.jQuery;
                    if (!jQuery) throw new Error("signalRService requires jQuery");
                    if (!jQuery.hubConnection) throw new Error("signalRService requires jquery.signalR-{version}.js");

                    bus = new Lamb("signalR", $rootScope.$new(true));
                    connection = jQuery.hubConnection();
                    proxy = connection.createHubProxy(config.hubName);
                    proxy.on(config.channelName, handler);
                    connection.start();
                };

                function registerHook(name, scope, when, callbackFn) {
                    var hook;
                    var i;

                    if (!name) throw new Error("registerHook: name is required");
                    if (!scope) throw new Error("registerHook: scope is required");
                    if (!when) throw new Error("registerHook: Either RAW_HOOK, PRE_TRANSFORM_HOOK or POST_TRANSFORM_HOOK is required");
                    if (!callbackFn) throw new Error("registerHook: callbackFn is required");

                    hook = new Hook(name, scope, when, callbackFn);
                    if (!hooks) {
                        hooks = [];
                    };
                    for (i = 0; i < hooks.length; ++i) {
                        if (hooks[i].id === hook.id) {
                            return false;
                        };
                    };

                    hooks.push(hook);
                    return hook.id;
                };

                function registerTransform(regex, fn) {
                    var i;
                    var key;
                    var newTransform;

                    if (!regex) throw new Error("registerTransform: regex is required");
                    if (! (regex instanceof RegExp)) throw new Error("registerTransform: regex not a regular expression");
                    if (!fn) throw new Error("registerTransform: fn is required");

                    newTransform = new Transform(regex, fn);
                    if (!transforms) {
                        transforms = [];
                    };
                    for (i = 0; (i < transforms.length) && (newTransform.regexLength <= transforms[i].regexLength) ; ++i) {
                        if (transforms[i].id === newTransform.id) return false;
                    };

                    transforms.splice(i, 0, newTransform);
                    return true;
                }

                function unregisterHook(hookId) {
                    var i;

                    if (!hookId) throw new Error("unregisterHook: hookId is required");

                    if (hooks) {
                        for (i = 0; i < hooks.length; ++i) {
                            if (hooks[i].id === hookId) {
                                hooks.splice(i, 1);
                                if (hooks.length === 0) {
                                    hooks = null;
                                };
                                return true;
                            };
                        };
                    };

                    return false;
                };

                function unregisterTransform(regex) {
                    var i;
                    var key;

                    if (!regex) throw new Error("unregisterTransform: regex is required");

                    if (transforms) {
                        key = regex.toString();
                        for (i = 0; i < transforms.length; ++i) {
                            if (transforms[i].id === key) {
                                transforms.splice(i, 1);
                                if (transforms.lenth === 0) {
                                    transforms = null;
                                };
                                return true;
                            };
                        };
                    };

                    return false;
                };

                return {
                    RAW_HOOK: RAW_HOOK,
                    PRE_TRANSFORM_HOOK: PRE_TRANSFORM_HOOK,
                    POST_TRANSFORM_HOOK: POST_TRANSFORM_HOOK,
                    registerHook: registerHook,
                    unregisterHook: unregisterHook,

                    Message: Message,
                    registerTransform: registerTransform,
                    unregisterTransform: unregisterTransform
                };
            }]
        );

    function Hook(name, scope, when, callbackFn) {
        this.id = name + ":" + scope.$id;
        this.when = when;
        this.callbackFn = callbackFn;
    };

    function HookInfo(topic, data, when, transform) {
        this.topic = topic;
        this.data = data;
        this.when = when;

        if (transform) {
            this.transform = {
                regex: transform.regex,
                fn: transform.fn
            };
        };
    };
    
    function Message(topic, data) {
        var that = (this instanceof Message) ? this : Object.create(Message.prototype);
        that.topic = topic;
        that.data = data;
        return that;
    };

    function Transform(regex, fn) {
        this.id = regex.toString();
        this.regex = regex;
        this.regexLength = this.id.length;
        this.fn = fn;
    };
})();