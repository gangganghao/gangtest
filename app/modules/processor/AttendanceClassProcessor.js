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
var logger = new Logger("AttendanceClassProcessor");

var AttendanceClassProcessor = function () {
    var self = this;
    var attendanceClasses = new Array();
    this._map = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getAttendanceClasses = function () {
        return { attendanceClasses: attendanceClasses };
    };

    function initAttendanceClass(callback) {
        getDatabase().getAttendanceClasses(null, function (resultData) {
            resultData = getLodash().transform(resultData, function (result, item, key) {
                item.section = item.section == "" ? [] : JSON.parse(item.section);
                item.elastic = item.elastic == "" ? [] : JSON.parse(item.elastic);
                self._map.put(item.id, item);
                result.push(item);
            });
            attendanceClasses = resultData;
            if (typeof callback === "function") callback()
        });
    }

    this.initAttendanceClass = function () {
        return new Promise(function (resolve, reject) {
            getRestClient().GetAttendanceClass(function (attendanceClasses) { // RESTClient.js 
                if (attendanceClasses != null) {
                    var formatResult = [];
                    if (!getLodash().isEmpty(attendanceClasses.insert)) {
                        getLodash().map(attendanceClasses.insert, function (attendanceClassItem) {
                            var tempAttendanceClassItem = getLodash().mapValues(attendanceClassItem, function (value) {
                                if (getLodash().isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            formatResult.push(tempAttendanceClassItem)
                        });
                    }
                    var deleteIds = [];
                    if (!getLodash().isEmpty(attendanceClasses.delete)) {
                        deleteIds = attendanceClasses.delete;
                    }
                    getDatabase().insertAttendanceClasses(formatResult, deleteIds, function () { // Database.js 
                        initAttendanceClass(function () { resolve() });
                    });
                } else {
                    initAttendanceClass(function () { resolve() });
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(AttendanceClassProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(AttendanceClassProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = AttendanceClassProcessor;