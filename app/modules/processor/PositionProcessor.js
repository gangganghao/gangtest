var events = require('events');
var base = require('./processorbase.js');
var Database = require('../data/Database.js');
var util = require('util');
var restClient = require('../apis/RESTClient.js');
var lodash = require('lodash');

var Logger = require('../utils/log.js');
var logger = new Logger("PositionProcessor");

var PositionProcessor = function () {
    var self = this;
    this._datas = new Array();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getAllPositions = function () {
        return { positions: lodash.filter(self._datas, { is_delete: 0 }) };
    };
    this.getAllPositionsContainDel = function () {
        return { positions: self._datas };
    };
    function initPositions(callback) {
        Database.getPositions(function (resultData) {
            resultData = lodash.transform(resultData, function (result, item, key) {
                item.interview_process = item.interview_process == "" ? [] : JSON.parse(item.interview_process);
                item.custom_fields = item.custom_fields == "" ? [] : JSON.parse(item.custom_fields);
                result.push(item);
            });
            self._datas = lodash.orderBy(resultData, ['is_delete', 'publish_time'], ['asc', 'desc']);//根据是否删除升序、发布时间降序

            if (typeof callback === "function") callback();
        });
    }

    this.initPosition = function () {
        return new Promise(function (resolve, reject) {
            restClient.GetPosition(function (resObj) {
                if (resObj != null) {
                    var newData = [];//格式化object为string
                    if (!lodash.isEmpty(resObj.insert)) {
                        lodash.map(resObj.insert, function (position) {
                            var tempObj = lodash.mapValues(position, function (value) {
                                if (lodash.isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            newData.push(tempObj)
                        });
                    }
                    var deleteIds = [];
                    if (!lodash.isEmpty(resObj.delete)) {
                        deleteIds = resObj.delete;
                    }
                    newData = lodash.uniqBy(newData, 'id');
                    Database.insertPositions(newData, deleteIds, function () {
                        initPositions(function () { resolve(); });
                    });
                } else {
                    initPositions(function () { resolve(); });
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(PositionProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(PositionProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = PositionProcessor;