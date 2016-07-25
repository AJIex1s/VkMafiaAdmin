var urlModule = require('url');
(function () {
    var ScriptManager = (function () {
        var instance;
        var getPageName = function (url) {
            var path = urlModule.parse(url, true).pathname;
            return path.replace("/", "").replace(".html", "");
        };
        var addScript = function (src) {
            var s = document.createElement('script');
            s.setAttribute('src', src);
            document.body.appendChild(s);
        };
        var writeTokenToCookies = function (token) {
            sessionStorage.setItem("token", token);
        }

        function ScriptManager() {
            if (!instance)
                instance = this;
            else return instance;
        }

        ScriptManager.prototype = {
            includeScripts: function () {
                var pageName = getPageName(location.href);
                var pageProcessorCreator;
                var scriptsRequired = ["/scripts/utils/utils.js"];
                switch (pageName) {
                    case "index": {
                        scriptsRequired.push("/scripts/auth.js");
                        break;
                    }
                    case "notification": {
                        scriptsRequired.push("/scripts/notification.js");
                        break;
                    }
                }
                scriptsRequired.forEach(function (src) {
                    addScript(src);
                });
            },
            getPageProcessor: function () {
                
            }
        };

        return Router;
    })();
    var scriptManager = new ScriptManager();
    window.addEventListener("DOMContentLoaded", function () {
        scriptManager.includeScripts();
    });
}());
