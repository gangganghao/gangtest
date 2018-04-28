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
var logger = new Logger("ServiceOpenSeaProcessor");
var SZControl = require("../SZControl");

var ServiceOpenSeaProcessor = function () {
    var self = this;
    var serviceOpenSeas = new Array();
    this._map = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getServiceOpenSeas = function () {
        return { serviceOpenSeas: serviceOpenSeas };
    };

    function initServiceOpenSea(callback) {

        getDatabase().getServiceOpenSeas(null, function (resultData) {
            resultData = getLodash().transform(resultData, function (result, item, key) {
                item.fields = item.fields == "" ? [] : JSON.parse(item.fields);
                item.fetch_rule = item.fetch_rule == "" ? [] : JSON.parse(item.fetch_rule);
                item.recovery_rule = item.recovery_rule == "" ? [] : JSON.parse(item.recovery_rule);
                item.users = item.users == "" ? [] : JSON.parse(item.users);
                self._map.put(item.id, item);
                result.push(item);
            });
            var deleteIds = [];
            var disableIds = [];
            getLodash().map(getLodash().filter(serviceOpenSeas, function (f) { return f.is_using == 1 }), function (se) {
                var cse = getLodash().find(resultData, function (c) { return c.id == se.id })
                if (!cse) {
                    deleteIds.push(se.id);
                } else if (cse.is_using == 0) {
                    disableIds.push(se.id);
                }
            });

            serviceOpenSeas = resultData;
            SZControl.event.getter("crmSerivceWin").emit("categoryChange", { type: "serviceOpensea", deleteIds: deleteIds, disableIds: disableIds });
            if (typeof callback === "function") callback()
        });


    }

    this.initServiceOpenSea = function () {
        return new Promise(function (resolve, reject) {
            getRestClient().GetServiceOpenSea(function (serviceOpenSeas) {
                if (serviceOpenSeas != null) {
                    var formatResult = [];
                    if (!getLodash().isEmpty(serviceOpenSeas.insert)) {
                        getLodash().map(serviceOpenSeas.insert, function (serviceOpenSeaItem) {
                            var tempServiceOpenSeaItem = getLodash().mapValues(serviceOpenSeaItem, function (value) {
                                if (getLodash().isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            formatResult.push(tempServiceOpenSeaItem)
                        });
                    }
                    var deleteIds = [];
                    if (!getLodash().isEmpty(serviceOpenSeas.delete)) {
                        deleteIds = serviceOpenSeas.delete;
                    }
                    getDatabase().insertServiceOpenSeas(formatResult, deleteIds, function () {
                        initServiceOpenSea(function () { resolve(); });
                    });
                } else {
                    initServiceOpenSea(function () { resolve() });
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(ServiceOpenSeaProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(ServiceOpenSeaProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = ServiceOpenSeaProcessor; 