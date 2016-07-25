var urlModule = require('url');
alert(1);
(function() {
    var Router = (function() {
        var instance;
        var getPageName = function (url) {
            var path = urlModule.parse(url, true).pathname;
            return path.replace("/", "").replace(".html", "");
        };
        var addScript = function( src ) {
            var s = document.createElement( 'script' );
            s.setAttribute( 'src', src );
            document.body.appendChild( s );
        };

        function Router() {
            if ( !instance )
                instance = this;
            else return instance;
        }

        Router.prototype.IncludeScripts = function() {
            var pageName = getPageName(location.href);
            var scriptsRequired = [];
            switch (pageName) {
                case "index":{
                    scriptsRequired.push("/scripts/auth.js");
                    break;
                }
            }
            scriptsRequired.forEach(function (script) {
                addScript(script);
            });
        };

        return Router;
    })();
    window.addEventListener("DOMContentLoaded", function () {
        (new Router()).IncludeScripts();
    });
}());
