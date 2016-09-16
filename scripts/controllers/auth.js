var url = require('url');
var token = "";
var authWin = null;
nw.Window.get().onNavigation = function () {
  alert(window.location.href);
};
(function () {
    var requestParams = {
        client_id: "5521634",
        redirect_uri: "https://oauth.vk.com/blank.html",
        scope: "friends,messages,wall,groups,offline",
        response_type: "token",
        version: "5.52"
    };
    var AuthPageController = function () {
        this.authButton = null;
        this.token = "";
        this.Initialize();
    };
    AuthPageController.prototype = {
        Initialize: function () {
            Utils.AddEveventHandlerToElement(this.GetAuthButton(), "click", this.OnAuthButtonClick.bind(this));
        },
        GetAuthButton: function () {
            if(!this.authButton)
                this.authButton = document.getElementById("auth");
            return this.authButton;
        },
        GetCorrectedAuthUrl: function (w) {
            return w.location.href.replace('#', "?");
        },
        GetAccessToken: function (w) {
            var params = url.parse(this.GetCorrectedAuthUrl(w), true).query;
            return params["access_token"];
        },
        RedirectToNotificationPage: function (token) {
            window.location.href = "notification.html?access_token=" + token;
        },
        OnAuthWindowLoaded: function (auth) {
            var token = this.GetAccessToken(auth.window);
            sessionStorage.setItem("token", token);
            auth.close();
            setTimeout(function () {
                this.RedirectToNotificationPage(token);
            }.bind(this), 100);
        },
        OnAuthButtonClick: function () {
            var main = nw.Window.get();
            main.maximize();

            nw.Window.open(this.GetTokentCommand(), {}, function (wObj) {

                wObj.on('loaded', function () {
                    debugger;
                    this.TrackUrlChange(wObj);
                }.bind(this));

                wObj.on('closed', function () {
                   debugger;
                }.bind(this));
            }.bind(this));
        },
        TrackUrlChange: function (wObj) {
            var trackUrl = setInterval(function () {
                if(wObj.window.location.href.indexOf("access_token=") != -1){
                    debugger;
                    clearInterval(trackUrl);
                    setTimeout(function(){this.OnAuthWindowLoaded(wObj);}.bind(this), 300);
                    return;
                }
            }.bind(this), 10);
        },
        OpenAuthWindow: function () {

        },
        GetTokentCommand: function () {
            var cmd = "https://oauth.vk.com/authorize?";
            for(parameter in requestParams) {
                cmd += parameter + "=" + requestParams[parameter];
                cmd += parameter!="version" ? "&" : "";
            }
            return cmd;
        }
    };



    Controllers.AuthPageController = AuthPageController;
}());
