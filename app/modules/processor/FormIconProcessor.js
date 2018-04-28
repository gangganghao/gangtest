var events = require('events');
var base = require('./processorbase.js');

var Database = null;
var getDatabase = function () {
    if (!Database) {
        Database = require('../data/Database.js');
    }
    return Database;
};
var map = require('../utils/Map.js');
var util = require('util');

var restClient = null;
var getRestClient = function () {
    if (!restClient) {
        restClient = require('../apis/RESTClient.js');
    }
    return restClient;
};

var lodash = null;
var getLodash = function () {
    if (!lodash) {
        lodash = require('lodash');
    }
    return lodash;
};

var Logger = require('../utils/log.js');
var logger = new Logger("FormIconProcessor"); //

var FormIconProcessor = function () { //
    var self = this;
    var formIcons = new Array(); //
    this._map = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getFormIcons = function () { //
        return { formIcons: formIcons }; //
    };

    function initFormIcon(callback) { //
        getDatabase().getFormIcons(null, function (resultData) { //
            resultData = getLodash().transform(resultData, function (result, item, key) {
                self._map.put(item.id, item);
                result.push(item);
            });
            formIcons = resultData; //
            if (typeof callback === "function") callback()
        });
    }

    this.initFormIcon = function () { //
        return new Promise(function (resolve, reject) {
            getRestClient().GetFormIcon(function (formIcons) { // RESTClient.js  // //
                if (formIcons != null) { //
                    var formatResult = [];
                    if (!getLodash().isEmpty(formIcons.insert)) { //
                        getLodash().map(formIcons.insert, function (formIconItem) { // //
                            var tempFormIconItem = getLodash().mapValues(formIconItem, function (value) { // //
                                if (getLodash().isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            formatResult.push(tempFormIconItem) //
                        });
                    }
                    var deleteIds = [];
                    if (!getLodash().isEmpty(formIcons.delete)) { //
                        deleteIds = formIcons.delete; //
                    }
                    getDatabase().insertFormIcons(formatResult, deleteIds, function () { // Database.js  //
                        initFormIcon(function () { resolve() }); //
                    });
                } else {
                    initFormIcon(function () { resolve() }); //
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(FormIconProcessor, events.EventEmitter); //
/*
 *继承消息处理器类
 */
util.inherits(FormIconProcessor, base.ProcessorBase); //
/*
 *类的全局声明
 */
module.exports = FormIconProcessor; //