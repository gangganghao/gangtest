var events = require('events');
var base = require('./processorbase.js');
var Logger = require('../utils/log.js');
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

var logger = new Logger("IndustryCategoryProcessor");

var IndustryCategoryProcessor = function () {
    var self = this;
    var industryCategorys = new Array();
    this._map = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getIndustryCategorys = function () {
        return { industryCategorys: industryCategorys };
    };

    this.getInitIndustryCategoryName = function (category_id) {
        var industryCategory = self._map.get(category_id);
        if (industryCategory) {
            if (industryCategory.parent_id == 0) {
                return industryCategory.name;
            } else {
                var parentIndustryCategory = self._map.get(industryCategory.parent_id);
                return parentIndustryCategory.name + "-" + industryCategory.name;
            }
        } else {
            return "";
        }
    };

    function initIndustryCategory(callback) {
        getDatabase().getIndustryCategorys(null, function (resultData) {
            industryCategorys = resultData;
            callback && callback(resultData);
            resultData.forEach(function (industryCategory) {
                self._map.put(industryCategory.category_id, industryCategory);
            });

        });
    }

    this.initIndustryCategory = function (callback) {
        getRestClient().GetIndustryCategory(function (industryCategorys) {
            if (industryCategorys != null) {
                getDatabase().insertIndustryCategorys(industryCategorys.insert, industryCategorys.delete, function () {
                    initIndustryCategory(callback);
                });
            } else {
                initIndustryCategory(callback);
            }
        });
    }
}

/*
 *继承事件类
 */
util.inherits(IndustryCategoryProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(IndustryCategoryProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = IndustryCategoryProcessor;