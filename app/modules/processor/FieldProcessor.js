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
var logger = new Logger("FieldProcessor");

var FieldProcessor = function () {
    var self = this;
    this._fields = new Array();
    this._map = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getAllFields = function () {
        return { fields: self._fields };
    };

    this.getFieldsByFormId = function (formId) {
        return getLodash().filter(self._fields, function (field) {
            return field.form_id === Number(formId);
        }).sort(function (a, b) { return a.order - b.order });
    };

    function initFields(callback) {
        getDatabase().getFields(null, function (resultData) {
            resultData = getLodash().transform(resultData, function (result, item, key) {
                item.subfields = item.subfields == "" ? [] : JSON.parse(item.subfields);
                item.options = item.options == "" ? [] : JSON.parse(item.options);
                result.push(item);
            });
            self._fields = resultData;
            if (typeof callback === "function") callback()
        });
    }

    this.initField = function (optionsObj) {
        return new Promise(function (resolve, reject) {
            getRestClient().GetField(optionsObj, function (fieldObj) {
                if (fieldObj != null) {
                    var newFields = [];//格式化object为string
                    if (!getLodash().isEmpty(fieldObj.insert)) {
                        getLodash().map(fieldObj.insert, function (field) {
                            var tempField = getLodash().mapValues(field, function (value) {
                                if (getLodash().isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            newFields.push(tempField)
                        });
                    }
                    var deleteIds = [];
                    if (!getLodash().isEmpty(fieldObj.delete)) {
                        deleteIds = fieldObj.delete;
                    }
                    newFields = getLodash().uniqBy(newFields, 'id');
                    getDatabase().insertFields(newFields, deleteIds, function () {
                        initFields(function () { resolve() });
                    });
                } else {
                    initFields(function () { resolve() });
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(FieldProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(FieldProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = FieldProcessor;