'use strict';
var url = require('url');
var token = "";
var authWin = null;
window.onload = function () {
    var auth = document.getElementById("auth");
    auth.onclick = function () {
        var client_id = "5521634";
        var redirect_uri = "https://oauth.vk.com/blank.html";
        var scope = "friends,messages,offline,wall,groups";
        var response_type = "token";
        var version = "5.52";

        var tokenURL = "https://oauth.vk.com/authorize?client_id=" + client_id +
            "&display=page&redirect_uri=" + redirect_uri +
            "&scope=" + scope + "&response_type=" + response_type + "&v=" + version;
        var win = nw.Window.get();

        nw.Window.open(tokenURL, {}, function(new_win) {
            new_win.on('loaded', function() {
                authWin = new_win;
                var access_token_url = new_win.window.location.href.replace('#', "?");
                var params = url.parse(access_token_url, true).query;
                new_win.close();
                setTimeout(function(){window.location.href="main.html?access_token=" + params["access_token"];}, 100);
            });

        });
    }
}