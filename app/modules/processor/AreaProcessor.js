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
var Logger = require('../utils/log.js');
var logger = new Logger("AreaProcessor");

var AreaProcessor = function () {
    var self = this;
    var areas = new Array();
    this._map = new map.Map();
    this.is_init = false;
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getAreas = function () {
        return { areas: areas };
    };

    this.getAreaName = function (id) {
        if (!self.is_init) {
            self.initArea(function () {
                return self.getAreaName(id);
            });
        } else {
            var area = self._map.get(id);
            if (area) {
                if (area.parent_id == 0) {
                    return area.simple_name;
                } else {
                    var parentArea = self._map.get(area.parent_id);;

                    return parentArea.simple_name + "-" + area.simple_name;
                }
            } else {
                return "";
            }
        }
    };

    function initAreas(callback) {
        if (areas.length == 0) {
            getDatabase().getAreas(null, function (areas1) {
                areas = areas1;
                areas1.forEach(function (area) {
                    self._map.put(area.id, area);
                });
                callback && callback(areas1);
            })
        }
    }

    this.initArea = function (callback) {
        if (self.is_init) {
            callback && callback(areas);
            return;
        }
        self.is_init = true;
        getRestClient().GetArea(function (areas) {
            if (areas != null) {
                getDatabase().insertAreas(areas, function () {
                    initAreas(callback)
                });
            } else {
                self.is_init = false;
                // initAreas(callback);
            }
        });
    }
}

/*
 *继承事件类
 */
util.inherits(AreaProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(AreaProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = AreaProcessor;