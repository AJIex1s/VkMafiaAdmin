var url = require('url');
var token = "";
var authWin = null;
(function () {
    var requestParams = {
        client_id: "5521634",
        redirect_uri: "https://oauth.vk.com/blank.html",
        scope: "friends,messages,offline,wall,groups",
        response_type: "token",
        version: "5.52"
    };
    var AuthController = function () {
        this.authButton = null;
        Utils.AddEveventHandlerToElement(this.GetAuthButton(), "click", this.OnAuthButtonClick.bind(this));
    };
    AuthController.prototype = {
        GetAuthButton: function () {
            if(!this.authButton)
                this.authButton = document.getElementById("auth");
            return this.authButton;
        },
        OnAuthButtonClick: function () {
            var win = nw.Window.get();
            nw.Window.get().maximize();
            nw.Window.open(this.GetTokentCommand(), {}, function (new_win) {
                new_win.on('loaded', function () {
                    authWin = new_win;
                    var access_token_url = new_win.window.location.href.replace('#', "?");
                    var params = url.parse(access_token_url, true).query;
                    new_win.close();
                    setTimeout(function () {
                        sessionStorage.setItem("token", params["access_token"]);
                        window.location.href = "notification.html?access_token=" + params["access_token"];
                    }, 100);
                });

            });
        },
        GetTokentCommand: function () {
            var cmd = "https://oauth.vk.com/authorize?";
            for(parameter in requestParams) {
                cmd += requestParams[parameter] + "=" + parameter;
                cmd += parameter!="version" ? "&" : "";
            }
            return cmd;
        }
    }
    window.AuthController = AuthController;
}());
