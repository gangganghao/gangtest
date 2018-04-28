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
var logger = new Logger("OpenSeaProcessor");
var SZControl = require("../SZControl");

var OpenSeaProcessor = function () {
    var self = this;
    var openSeas = new Array();
    this._map = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getOpenSeas = function () {
        return { openSeas: openSeas };
    };

    function initOpenSea(callback) {

        getDatabase().getOpenSeas(null, function (resultData) {
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
            getLodash().map(getLodash().filter(openSeas, function (f) { return f.is_using == 1 }), function (se) {
                var cse = getLodash().find(resultData, function (c) { return c.id == se.id })
                if (!cse) {
                    deleteIds.push(se.id);
                } else if (cse.is_using == 0) {
                    disableIds.push(se.id);
                }
            });

            openSeas = resultData;
            SZControl.event.getter("crmSaleWin").emit("categoryChange", { type: "opensea", deleteIds: deleteIds, disableIds: disableIds });
            if (typeof callback === "function") callback()
        });


    }

    this.initOpenSea = function () {
        return new Promise(function (resolve, reject) {
            getRestClient().GetOpenSea(function (openSeas) {
                if (openSeas != null) {
                    var formatResult = [];
                    if (!getLodash().isEmpty(openSeas.insert)) {
                        getLodash().map(openSeas.insert, function (openSeaItem) {
                            var tempOpenSeaItem = getLodash().mapValues(openSeaItem, function (value) {
                                if (getLodash().isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            formatResult.push(tempOpenSeaItem)
                        });
                    }
                    var deleteIds = [];
                    if (!getLodash().isEmpty(openSeas.delete)) {
                        deleteIds = openSeas.delete;
                    }
                    getDatabase().insertOpenSeas(formatResult, deleteIds, function () {
                        initOpenSea(function () { resolve(); });
                    });
                } else {
                    initOpenSea(function () { resolve() });
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(OpenSeaProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(OpenSeaProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = OpenSeaProcessor; 