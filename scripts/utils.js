var Utils = {};
(function() {
    var IsExists = function(obj) {
        return obj && obj != null && obj != 'undefined';
    };
    var GetLoadingPanelMainElement = function() {
        var mainElem = document.getElementById("loadingMain");
        if(!mainElem)
            mainElem = CreateLoadingPanel();
        return mainElem;
    };
    var CreateLoadingPanel = function() {
        var mainElem = document.createElement("DIV");
        mainElem.id = "loadingMain";
        mainElem.style.display = "none";
        var overlay = document.createElement("DIV");
        overlay.id = "loadingOverlay";

        var loading = document.createElement("DIV");
        var loadingInner = document.createElement("DIV");
        var loadingImg = document.createElement("IMG");
        loadingImg.src = "./img/loading.gif";
        loading.id = "loadingElement";
        loadingInner.id = "loadingInner";

        loadingInner.appendChild(loadingImg);
        loading.appendChild(loadingInner);

        mainElem.appendChild(overlay);
        mainElem.appendChild(loading);

        document.body.appendChild(mainElem);
        return mainElem;
    };

    var ToggleLoadingPanel = function() {
        ToggleElement(GetLoadingPanelMainElement());
    };

    var IsFunction = function(functionToCheck) {
        var getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    };
    /*requests helper part*/
    var jsonp = function(url, callback) {
        var callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        window[callbackName] = function(data) {
            delete window[callbackName];
            document.body.removeChild(script);
            callback(data);
            ToggleLoadingPanel();
        };

        ToggleLoadingPanel();
        var script = document.createElement('script');
        script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
        document.body.appendChild(script);
    };
    var SendRequest = function(request, success) {
        jsonp(request, success);
    };
    /* end requests helper part*/

    var AddScript = function(src, onLoad) {
        var s = document.createElement('script');
        s.setAttribute('src', src);
        if(onLoad)
            AddEventHandlerToElement(s, "load", onLoad);
        document.head.appendChild(s);
    };

    var ToggleElement = function(elememnt) {
        if(elememnt.style.display == "none")
            elememnt.style.display = "block";
        else
            elememnt.style.display = "none"
    };

    var AddEventHandlerToElement = function(element, event, handler) {
        element.addEventListener(event, handler);
    };
    var ContainsObject = function(arr, obj, cMethod) {
        var result = arr.some(function(objToCompare) {
            if(cMethod)
                return cMethod(obj, objToCompare);
            else
                return obj.IsEqualTo(objToCompare)
        });
        return result;
    };
    var Queue = function(itemProcessor, onQueueProcessed) {
        this.items = [];
        this.itemProcessor = itemProcessor;
        this.onQueueProcessed = onQueueProcessed;
        this.promises = [];
    };
    Queue.prototype = {
        IsEmpty: function() {
            return this.items.length === 0;
        },
        AddItem: function(item) {
            this.items.push(item);
        },
        createPromiseForItem: function(item, delay) {
            var queue = this;
            var promise = new Promise(function(resolve, reject) {
                queue.itemProcessor(item, resolve, delay);
            });
            promise.then(function(success) {
                if(!success)
                    queue.promises.push(promise);
            });
            this.promises.push(promise);
        },
        ProcessQueue: function() {
            var delay = 2000;
            var item = null;
            while(!this.IsEmpty()) {
                item = this.items.shift();
                this.createPromiseForItem(item, delay);
                delay += 2000;
            }
            Promise.all(this.promises).then(this.onQueueProcessed);
        },

    };

    var SendMessage = function(message, onEndResponse, delay) {
        var getMessageSendRequest = message => "https://api.vk.com/method/messages.send?user_id=" + /*message.receiver.id*/"29091975"
        + "&message=" + message.receiver.name + ", " + message.text + "&access_token=" + sessionStorage.token;
        var request = getMessageSendRequest(message);
        setTimeout(function() {
            Utils.SendRequest(request, function(result) {
                var state = Utils.IsExists(result.response);
                if(!state)
                    console.log(result.error);
                if(state)
                    message.OnProcessed();
                onEndResponse(state);
            });
        }, delay);
    };
    var GetCreateMessageQueue = function(messages) {
        var queue = new Queue(Utils.SendMessage, Utils.ToggleLoadingPanel);
        var i = 0;
        for(i = 0; i < messages.length; i++) {
            queue.AddItem(messages[i]);
        }
        return queue;
    };
    var GetCreateMessages = function(users, onMessageSend) {
        var result = users.map(function(user) {
            return {
                receiver: user,
                text: "",
                OnProcessed: function() {
                    onMessageSend(user);
                }
            };
        });
        return result;
    };
    var ControllerRequiredModels = {
        "notification": "poll"
    };
    var TryGetControllerModelName = function(name) {
        var modelName = null;
        if(Object.keys(ControllerRequiredModels).indexOf(name) > -1)
            modelName = ControllerRequiredModels[name];
        return modelName;
    };
    Utils.IsExists = IsExists;
    Utils.SendRequest = SendRequest;
    Utils.IsFunction = IsFunction;
    Utils.ToggleElement = ToggleElement;
    Utils.AddEveventHandlerToElement = AddEventHandlerToElement;
    Utils.AddScript = AddScript;
    Utils.ContainsObject = ContainsObject;
    Utils.CreateLoadingPanel = CreateLoadingPanel;
    Utils.ToggleLoadingPanel = ToggleLoadingPanel;
    Utils.SendMessage = SendMessage;
    Utils.GetCreateMessageQueue = GetCreateMessageQueue;
    Utils.GetCreateMessages = GetCreateMessages;
    Utils.TryGetPageModelName = TryGetControllerModelName;
}());
