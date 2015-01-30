describe("SignalR Tests", function () {
    "use strict";

    beforeEach(module("apMessagingLib"));

    // Mock Scope
    var _scope;
    beforeEach(angular.mock.inject(function ($rootScope) {
        _scope = $rootScope.$new(true);
    }));

    // Add the SignalR configuration.
    angular
        .module("apMessagingLib")
        .constant("signalrConfig", {
            hubName: "hubName",
            channelName: "channelName"
        });

    // Mock jQuery SignalR
    // pushToClient will be the proxy.on() callback function within the service.
    var _pushToClient;
    beforeEach(angular.mock.inject(function ($window) {
        var proxy = { on: function (topic, handler) { _pushToClient = handler; } };

        var connection = {
            createHubProxy: function () { return proxy; },
            start: function () { }
        };

        $window.jQuery = { hubConnection: function () { return connection; }};
    }));

    // Get the services.
    var _lamb;
    var _signalR;
    beforeEach(angular.mock.inject(function (Lamb, signalRService) {
        _lamb = Lamb;
        _signalR = signalRService;
    }));

    it("all hooks (no transform) test", function () {
        var lastMessage = null;
        var bus = new _lamb("test", _scope);
        bus.subscribe("a.b.c", function (data, message) { lastMessage = message; });

        var hookCallbackCount = 0;
        var when = _signalR.RAW_HOOK | _signalR.PRE_TRANSFORM_HOOK | _signalR.POST_TRANSFORM_HOOK;
        _signalR.registerHook("all", _scope, when, function (info) {
            ++hookCallbackCount;
            switch (info.when) {
                case _signalR.RAW_HOOK:
                    expect(info.topic).toBe("a.b.c");
                    expect(info.data).toBe('{"test": "all hook test"}');
                    expect(info.when).toBe(_signalR.RAW_HOOK);
                    expect(info.transform).toBeUndefined();
                    break;

                case _signalR.PRE_TRANSFORM_HOOK:
                    expect(info.topic).toBe("a.b.c");
                    expect(info.data.test).toBe("all hook test");
                    expect(info.when).toBe(_signalR.PRE_TRANSFORM_HOOK);
                    expect(info.transform).toBeUndefined();
                    break;

                case _signalR.POST_TRANSFORM_HOOK:
                    expect(info.topic).toBe("a.b.c");
                    expect(info.data.test).toBe("all hook test");
                    expect(info.when).toBe(_signalR.POST_TRANSFORM_HOOK);
                    expect(info.transform).toBeUndefined();
                    break;
            };
        });

        _pushToClient("a.b.c", '{"test": "all hook test"}');
        expect(lastMessage).not.toBeNull();
        expect(lastMessage.data.test).toBe("all hook test");
        expect(hookCallbackCount).toBe(3);
    });

    it("all hooks (with transform) test", function () {
        var lastMessage = null;
        var bus = new _lamb("test", _scope);
        bus.subscribe("a.b.c", function (data, message) { lastMessage = message; });

        _signalR.registerTransform(/a\.b\.c/, function (message) {
            return new _signalR.Message("a.b.c", { newData: "modified" });
        });

        var hookCallbackCount = 0;
        var when = _signalR.RAW_HOOK | _signalR.PRE_TRANSFORM_HOOK | _signalR.POST_TRANSFORM_HOOK;
        _signalR.registerHook("all", _scope, when, function (info) {
            ++hookCallbackCount;
            switch (info.when) {
                case _signalR.RAW_HOOK:
                    expect(info.topic).toBe("a.b.c");
                    expect(info.data).toBe('{"test": "all hook test"}');
                    expect(info.when).toBe(_signalR.RAW_HOOK);
                    expect(info.transform).toBeUndefined();
                    break;

                case _signalR.PRE_TRANSFORM_HOOK:
                    expect(info.topic).toBe("a.b.c");
                    expect(info.data.test).toBe("all hook test");
                    expect(info.when).toBe(_signalR.PRE_TRANSFORM_HOOK);
                    expect(info.transform.regex).toEqual(/a\.b\.c/);
                    expect(info.transform.fn).toBeTruthy();
                    break;

                case _signalR.POST_TRANSFORM_HOOK:
                    expect(info.topic).toBe("a.b.c");
                    expect(info.data.newData).toBe("modified");
                    expect(info.when).toBe(_signalR.POST_TRANSFORM_HOOK);
                    expect(info.transform.regex).toEqual(/a\.b\.c/);
                    expect(info.transform.fn).toBeTruthy();
                    break;
            };
        });

        _pushToClient("a.b.c", '{"test": "all hook test"}');
        expect(lastMessage).not.toBeNull();
        expect(lastMessage.data.newData).toBe("modified");
        expect(hookCallbackCount).toBe(3);
    });

    it("handler test", function () {
        var lastMessage = null;
        var bus = new _lamb("test", _scope);
        bus.subscribe("a.b.c", function (data, message) { lastMessage = message; });

        _pushToClient("a.b.c", "handler test");
        expect(lastMessage).not.toBeNull();
        expect(lastMessage.data).toBe("handler test");
    });

    it("initialization test", function () {
    });

    it("multiple hook test", function () {
        var lastMessage = null;
        var bus = new _lamb("test", _scope);
        bus.subscribe("a.b.c", function (data, message) { lastMessage = message; });

        var hookCallbackCount = 0;
        _signalR.registerHook("raw1", _scope, _signalR.RAW_HOOK, function (info) {
            ++hookCallbackCount
        });
        _signalR.registerHook("raw2", _scope, _signalR.RAW_HOOK, function (info) {
            ++hookCallbackCount
        });

        _pushToClient("a.b.c", '{"test": "multiple hook test"}');
        expect(lastMessage).not.toBeNull();
        expect(lastMessage.data.test).toBe("multiple hook test");

        expect(hookCallbackCount).toBe(2);
    });

    it("multiple transform test", function () {
        var lastMessage = null;
        var bus = new _lamb("test", _scope);
        bus.subscribe("d.e.f", function (data, message) { lastMessage = message; });

        var aTransformCalled = false;
        _signalR.registerTransform(/a\..*/, function (message) {
            aTransformCalled = true;
            return new _signalR.Message("d.e.f", "modified by a");
        });

        var bTransformCalled = false;
        _signalR.registerTransform(/b\..*/, function (message) {
            bTransformCalled = true;
            return new _signalR.Message("d.e.f", "modified by b");
        });

        _pushToClient("a.b.c", "transform test");
        expect(lastMessage).not.toBeNull();
        expect(lastMessage.data).toBe("modified by a");
        expect(aTransformCalled).toBeTruthy();
        expect(bTransformCalled).toBeFalsy();
    });

    it("post hook (no transform) test", function () {
        var lastMessage = null;
        var bus = new _lamb("test", _scope);
        bus.subscribe("a.b.c", function (data, message) { lastMessage = message; });

        var hookInfo = null;
        var hookId = _signalR.registerHook("post", _scope, _signalR.POST_TRANSFORM_HOOK, function (info) {
            hookInfo = info;
        });
        expect(hookId).toBeTruthy();

        _pushToClient("a.b.c", '{"test": "post hook test"}');
        expect(lastMessage).not.toBeNull();
        expect(lastMessage.data.test).toBe("post hook test");

        expect(hookInfo).not.toBeNull();
        expect(hookInfo.topic).toBe("a.b.c");
        expect(hookInfo.data.test).toBe("post hook test");
        expect(hookInfo.when).toBe(_signalR.POST_TRANSFORM_HOOK);
        expect(hookInfo.transform).toBeUndefined();
    });

    it("post hook (with transform) test", function () {
        var lastMessage = null;
        var bus = new _lamb("test", _scope);
        bus.subscribe("a.b.c", function (data, message) { lastMessage = message; });

        _signalR.registerTransform(/a\.b\.c/, function (message) {
            return new _signalR.Message("a.b.c", { newData: "modified" });
        });

        var hookInfo = null;
        var hookId = _signalR.registerHook("post", _scope, _signalR.POST_TRANSFORM_HOOK, function (info) {
            hookInfo = info;
        });
        expect(hookId).toBeTruthy();

        _pushToClient("a.b.c", '{"test": "post hook test"}');
        expect(lastMessage).not.toBeNull();
        expect(lastMessage.data.newData).toBe("modified");

        expect(hookInfo).not.toBeNull();
        expect(hookInfo.topic).toBe("a.b.c");
        expect(hookInfo.data.newData).toBe("modified");
        expect(hookInfo.when).toBe(_signalR.POST_TRANSFORM_HOOK);

        expect(hookInfo.transform.regex).toEqual(/a\.b\.c/);
        expect(hookInfo.transform.fn).toBeTruthy();
    });

    it("pre hook (no transform) test", function () {
        var lastMessage = null;
        var bus = new _lamb("test", _scope);
        bus.subscribe("a.b.c", function (data, message) { lastMessage = message; });

        var hookInfo = null;
        var hookId = _signalR.registerHook("pre", _scope, _signalR.PRE_TRANSFORM_HOOK, function (info) {
            hookInfo = info;
        });
        expect(hookId).toBeTruthy();

        _pushToClient("a.b.c", '{"test": "pre hook test"}');
        expect(lastMessage).not.toBeNull();
        expect(lastMessage.data.test).toBe("pre hook test");

        expect(hookInfo).not.toBeNull();
        expect(hookInfo.topic).toBe("a.b.c");
        expect(hookInfo.data.test).toBe("pre hook test");
        expect(hookInfo.when).toBe(_signalR.PRE_TRANSFORM_HOOK);
        expect(hookInfo.transform).toBeUndefined();
    });

    it("pre hook (with transform) test", function () {
        var lastMessage = null;
        var bus = new _lamb("test", _scope);
        bus.subscribe("a.b.c", function (data, message) { lastMessage = message; });

        _signalR.registerTransform(/a\.b\.c/, function (message) {
            return new _signalR.Message("a.b.c", {newData: "modified"});
        });

        var hookInfo = null;
        var hookId = _signalR.registerHook("pre", _scope, _signalR.PRE_TRANSFORM_HOOK, function (info) {
            hookInfo = info;
        });
        expect(hookId).toBeTruthy();

        _pushToClient("a.b.c", '{"test": "pre hook test"}');
        expect(lastMessage).not.toBeNull();
        expect(lastMessage.data.newData).toBe("modified");

        expect(hookInfo).not.toBeNull();
        expect(hookInfo.topic).toBe("a.b.c");
        expect(hookInfo.data.test).toBe("pre hook test");
        expect(hookInfo.when).toBe(_signalR.PRE_TRANSFORM_HOOK);

        expect(hookInfo.transform.regex).toEqual(/a\.b\.c/);
        expect(hookInfo.transform.fn).toBeTruthy();
    });

    it("raw hook test", function () {
        var lastMessage = null;
        var bus = new _lamb("test", _scope);
        bus.subscribe("a.b.c", function (data, message) { lastMessage = message; });

        var hookInfo = null;
        var hookId = _signalR.registerHook("raw", _scope, _signalR.RAW_HOOK, function (info) {
            hookInfo = info;
        });
        expect(hookId).toBeTruthy();

        _pushToClient("a.b.c", '{"test": "raw hook test"}');
        expect(lastMessage).not.toBeNull();
        expect(lastMessage.data.test).toBe("raw hook test");

        expect(hookInfo).not.toBeNull();
        expect(hookInfo.topic).toBe("a.b.c");
        expect(hookInfo.data).toBe('{"test": "raw hook test"}');
        expect(hookInfo.when).toBe(_signalR.RAW_HOOK);
        expect(hookInfo.transform).toBeUndefined();
    });

    it("register hook test", function () {
        var lastMessage = null;
        var bus = new _lamb("test", _scope);
        bus.subscribe("a.b.c", function (data, message) { lastMessage = message; });

        var hookCallbackCount = 0;
        _pushToClient("a.b.c", '{"test": "register hook test"}');
        expect(hookCallbackCount).toBe(0);

        var hookId = _signalR.registerHook("raw", _scope, _signalR.RAW_HOOK, function (info) {
            ++hookCallbackCount;
        });
        expect(hookId).toBeTruthy();

        _pushToClient("a.b.c", '{"test": "register hook test"}');
        expect(hookCallbackCount).toBe(1);
    });

    it("register transform test", function () {
        var lastMessage = null;
        var bus = new _lamb("test", _scope);
        bus.subscribe("a.b.c", function (data, message) { lastMessage = message; });

        _pushToClient("a.b.c", "unmodified");
        expect(lastMessage.data).toBe("unmodified");

        var result = _signalR.registerTransform(/a\.b\.c/, function (message) {
            return new _signalR.Message("a.b.c", "modified");
        });
        expect(result).toBeTruthy();

        _pushToClient("a.b.c", "unmodified");
        expect(lastMessage.data).toBe("modified");
    });
    
    it("transform precedence test", function () {
        var lastMessage = null;
        var bus = new _lamb("test", _scope);
        bus.subscribe("d.e.f", function (data, message) { lastMessage = message; });

        _signalR.registerTransform(/a\..*/, function (message) {
            return new _signalR.Message("d.e.f", "modified by a.*");
        });

        _signalR.registerTransform(/a\.b\.c/, function (message) {
            return new _signalR.Message("d.e.f", "modified by a.b.c");
        });

        _pushToClient("a.b.c", "transform test");
        expect(lastMessage).not.toBeNull();
        expect(lastMessage.data).toBe("modified by a.b.c");
    });

    it("transform test", function () {
        var lastMessage = null;
        var bus = new _lamb("test", _scope);
        bus.subscribe("d.e.f", function (data, message) { lastMessage = message; });

        _signalR.registerTransform(/a\..*/, function (message) {
            return new _signalR.Message("d.e.f", "modified");
        });

        _pushToClient("a.b.c", "transform test");
        expect(lastMessage).not.toBeNull();
        expect(lastMessage.data).toBe("modified");
    });

    it("unregister hook test", function () {
        var lastMessage = null;
        var bus = new _lamb("test", _scope);
        bus.subscribe("a.b.c", function (data, message) { lastMessage = message; });

        var hookCallbackCount = 0;
        var hookId = _signalR.registerHook("raw", _scope, _signalR.RAW_HOOK, function (info) {
            ++hookCallbackCount;
        });
        expect(hookId).toBeTruthy();

        _pushToClient("a.b.c", '{"test": "unregister hook test"}');
        expect(hookCallbackCount).toBe(1);

        var result = _signalR.unregisterHook(hookId);
        expect(result).toBeTruthy();
        
        _pushToClient("a.b.c", '{"test": "unregister hook test"}');
        expect(hookCallbackCount).toBe(1);
    });

    it("unregister transform test", function () {
        var lastMessage = null;
        var bus = new _lamb("test", _scope);
        bus.subscribe("a.b.c", function (data, message) { lastMessage = message; });

        _signalR.registerTransform(/a\.b\.c/, function (message) {
            return new _signalR.Message("a.b.c", "modified");
        });

        _pushToClient("a.b.c", "unmodified");
        expect(lastMessage.data).toBe("modified");

        var result = _signalR.unregisterTransform(/a\.b\.c/);
        expect(result).toBeTruthy();

        _pushToClient("a.b.c", "unmodified");
        expect(lastMessage.data).toBe("unmodified");
    });
}); 