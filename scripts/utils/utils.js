var Utils = {};
(function(){
	var IsExists = function(obj){
		return obj && obj != null && obj != 'undefined';
	}
	function jsonp(url, callback) {
		var callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
		window[callbackName] = function(data) {
			delete window[callbackName];
			document.body.removeChild(script);
			callback(data);
		};

		var script = document.createElement('script');
		script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
		document.body.appendChild(script);
	}
	function isFunction(functionToCheck) {
		var getType = {};
		return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
	}
	var sendRequest = function (request, success) {
		jsonp(request, success);
	}
	Utils.IsExists = IsExists;
	Utils.sendRequest = sendRequest;
	Utils.isFunction = isFunction;
}());