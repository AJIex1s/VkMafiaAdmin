"use strict";
var urlModule = require("url");
var Controllers = {};
var DataSources = {};
(function () {
    var Page = function (name) {
        this.name = name;
        this.controller = null;
        this.requiredScripts = [];
        this.Initialize();
    };
    Page.prototype = {
        Initialize: function() {
            var modelNames = Utils.TryGetPageModelNames(this.name).split(",");
            var i;
            if(modelNames.length != 0) {
                for (i = 0; i < modelNames.length; i++) {
                    this.addModelScript(modelNames[i]);
                }
            }
            this.addControllerScript();
        },
        addModelScript: function(modelName) {
            var modelRequiredScriptSrc = "/scripts/models/" + modelName + ".js";
            this.addRequiredScript(modelRequiredScriptSrc);
        },
        addControllerScript: function() {
            var controllerRequiredScriptSrc = "/scripts/controllers/" + this.name + ".js";
            this.addRequiredScript(controllerRequiredScriptSrc);
        },
        GetControllerName: function () {
            var capitalizedPageName = this.name.charAt(0).toUpperCase() + this.name.slice(1);
            return capitalizedPageName + "PageController";
        },
        CreateController: function () {
            if (!this.controller)
                this.controller = new Controllers[this.GetControllerName()]();
            return this.controller;
        },
        addRequiredScript: function(src) {
            return this.requiredScripts.push(src);
        },
        GetRequiredScripts: function () {
            return this.requiredScripts;
        },
        IncludeScripts: function () {
            this.GetRequiredScripts().forEach(function (src) {
                Utils.AddScript(src);
            });
        }
    };
    var Router = (function () {
        var instance;
        var writeTokenToCookies = function (token) {
            sessionStorage.setItem("token", token);
        };

        var getPageName = function () {
            var url = location.href;
            var path = urlModule.parse(url, true).pathname;
            return path.replace("/", "").replace(".html", "");
        };

        function Router() {
            if (!instance)
                instance = this;
            else return instance;
            this.page = null;
        }

        Router.prototype = {
            InitPage: function () {
                this.page = new Page(getPageName());
                this.page.IncludeScripts();

                var script = document.querySelector("script[src*='"+this.page.name+"']");
                script.onload = function () {
                    this.CreatePageController();
                }.bind(this);
            },
            CreatePageController: function () {
                return this.page.CreateController();
            }
        };

        return Router;
    })();
    var router = new Router();
    router.InitPage();
}());
