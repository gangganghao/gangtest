var events = require('events');
var base = require('./processorbase.js');

var Database = require('../data/Database.js');
var map = require('../utils/Map.js');
var util = require('util');
var restClient = require('../apis/RESTClient.js');
var _ = require('lodash');

var Logger = require('../utils/log.js');
var logger = new Logger("TableProcessor"); //

var TableProcessor = function () { //
    var self = this;
    this._tableMap = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    //表名称对应增量请求接口
    this.tableIncrementOptions = {
        menu: {
            m: "menu",
            a: "increment",
        },
        workGroup: {
            m: "menu",
            a: "group/increment",
        },
        menuIcon: {
            m: "general",
            a: "icon/increment",
        }
    }

    /**
     * 获取所有表数据
     * @param tableName 表名称
     * @returns Array
     */
    this.getTableDatas = function (tableName) { //
        return { datas: self._tableMap.get(tableName) }; //
    };

    /**
    * 跟进属性获取表数据
    * @param tableName 表名称
    * @param attributeName 字段名称
    * @param attributeValue 字段值
    * @returns Array
    */
    this.getDataByAttribute = function (tableName, attributeName, attributeValue) {
        var datas = self._tableMap.get(tableName);
        if (datas) {
            return _.filter(datas, function (d) { return d[attributeName] == attributeValue }) || [];
        }
        return [];
    };

    function initDatas(tableName, callback) {
        Database.getTableDatas(tableName, null).then(function (resultData) {
            Database.getFieldsJSONParseConfig(tableName, function (data) {//取出需要转化的字段
                if (!_.isEmpty(data)) {
                    var jsonFormatFields = JSON.parse(data.value || '[]');
                    if (!_.isEmpty(jsonFormatFields)) {
                        resultData = _.transform(resultData, function (result, item, key) {
                            var tempItem = _.mapValues(item, function (value, fieldName) {//检测需要转化的字段
                                if (_.includes(jsonFormatFields, fieldName)) {
                                    try {
                                        return JSON.parse(value);
                                    } catch (error) {
                                        return value;
                                    }
                                }
                                else
                                    return value;
                            });
                            result.push(tempItem);
                        });
                    }
                }
                self._tableMap.put(tableName, resultData);
                if (typeof callback === "function") callback();
            });
        });
    }

    this.initTableDatas = function (tableName) {
        return new Promise(function (resolve, reject) {
            restClient.GetTableIncrement(tableName, self.tableIncrementOptions[tableName], function (datas) {
                if (datas != null) {
                    var formatResult = [];
                    if (!_.isEmpty(datas.insert)) {
                        var jsonFormatFields = [];
                        _.map(datas.insert, function (menuItem) {
                            var tempmenuItem = _.mapValues(menuItem, function (value,key) {
                                if (_.isObject(value)){
                                    if (!_.includes(jsonFormatFields, key))
                                        jsonFormatFields.push(key);
                                    return JSON.stringify(value);
                                }
                                else
                                    return value;
                            });
                            formatResult.push(tempmenuItem);
                        });
                        if(!_.isEmpty(jsonFormatFields)){
                            Database.setFieldsJSONParseConfig(tableName,JSON.stringify(jsonFormatFields));
                        }
                    }
                    var deleteIds = [];
                    if (!_.isEmpty(datas.delete)) {
                        deleteIds = datas.delete;
                    }
                    Database.insertTableDatas(tableName, formatResult, deleteIds).then(function () {
                        var configName = tableName + ".maxIdentity";
                        Database.setConfig(configName, datas.max_identity);
                        initDatas(tableName, function () { resolve() });
                    });
                } else {
                    initDatas(tableName, function () { resolve() });
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(TableProcessor, events.EventEmitter); //
/*
 *继承消息处理器类
 */
util.inherits(TableProcessor, base.ProcessorBase); //
/*
 *类的全局声明
 */
module.exports = TableProcessor; //