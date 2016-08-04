var Utils = {};
(function(){
	var IsExists = function(obj){
		return obj && obj != null && obj != 'undefined';
	};
	var GetLoadingPanelMainElement = function () {
		var mainElem = document.getElementById("loadingMain");
		if(!mainElem)
			mainElem = CreateLoadingPanel();
		return mainElem;
	};
	var CreateLoadingPanel = function () {
		var mainElem = document.createElement("DIV");
		mainElem.id = "loadingMain";
		var overlay = document.createElement("DIV");
		overlay.id = "loadingOverlay";

		var loading = document.createElement("DIV");
		var loadingInner = document.createElement("DIV");
		var loadingImg = document.createElement("IMG");
		loadingImg.src = "./img/loading.gif";
		loading.id = "loadingELement";
		loadingInner.id = "loadingInner"

		loadingInner.appendChild(loadingImg);
		loading.appendChild(loadingInner);

		mainElem.appendChild(overlay);
		mainElem.appendChild(loading);

		return mainElem;
	};
	var ToggleLoadingPanel = function () {
		toggleElement(GetLoadingPanelMainElement());
	};
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
	}
	var isFunction = function(functionToCheck) {
		var getType = {};
		return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
	}
	var sendRequest = function (request, success) {
		jsonp(request, success);
	};
	var addScript = function( src, onLoad ) {
		var s = document.createElement( 'script' );
		s.setAttribute( 'src', src );
		if(onLoad)
			AddEveventHandlerToElement(s, "load", onLoad);
		document.head.appendChild( s );
	};
	var toggleElement = function (elememnt) {
		if(elememnt.style.display == "none")
			elememnt.style.display = "block";
		else
			elememnt.style.display = "none"
	};
	var AddEveventHandlerToElement = function (element, event, handler) {
		element.addEventListener(event, handler);
	};
	var ContainsObject = function (arr, obj, cMethod) {
		return arr.some(function (objToCompare) {
			if(!cMethod)
				return cMethod(obj, objToCompare);
			else
				return obj.IsEqualTo(objToCompare)
		})
	}
	Utils.IsExists = IsExists;
	Utils.sendRequest = sendRequest;
	Utils.isFunction = isFunction;
	Utils.toggleElement = toggleElement;
	Utils.AddEveventHandlerToElement = AddEveventHandlerToElement;
	Utils.addScript = addScript;
	Utils.ContainsObject = ContainsObject;
	Utils.CreateLoadingPanel = CreateLoadingPanel;
	Utils.ToggleLoadingPanel = ToggleLoadingPanel;
}());
