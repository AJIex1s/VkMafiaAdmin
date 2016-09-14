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
    Utils.IsExists = IsExists;
    Utils.SendRequest = SendRequest;
    Utils.IsFunction = IsFunction;
    Utils.ToggleElement = ToggleElement;
    Utils.AddEveventHandlerToElement = AddEventHandlerToElement;
    Utils.AddScript = AddScript;
    Utils.ContainsObject = ContainsObject;
    Utils.CreateLoadingPanel = CreateLoadingPanel;
    Utils.ToggleLoadingPanel = ToggleLoadingPanel;
}());
