var map = require('../utils/Map.js');

var DepartmentManager = function () {
    // body...
    this.deptsMap = new map.Map();
    var self = this;
    var companyMembers = new Array();

    this.putDepartment = function (dId, department) {
        self.deptsMap.put(dId, department);
    };

    this.addDeptMember = function(dId, uid){
       var dept = self.getDepartment(dId);
        if (dept != null) {
            dept.deptMembers.push(uid);
            var i = 0;
            while (dept != null) {
                if(dept.members.indexOf(uid) == -1){
                    dept.members.push(uid);
                }
                dept = self.getDepartment(dept.parentId);
                if (i++ > 100) {
                //    logger.error("addDeptMember in death loop! loop i=", i);
                    break;
                }
            }
        }
    };

    this.getCompany = function () {
        return {members: companyMembers};
    };

    this.getDepartment = function (dId) {
        return self.deptsMap.get(dId + "");
    };

    this.printEach = function (callback) {
        self.deptsMap.forEach(function (item) {
            callback(item);
        });
    };

    this.findDept = function (str, maxLimit, callback) {
        //todo:支持组织机构拼音，组织机构拼音简写
        if (str) {
            str = str.toUpperCase();
        }
        var arr = new Array();
        var num = 0;
        self.deptsMap.forEach(function (item) {
            if ((item.dName != null && item.dName.indexOf(str) != -1) ||
                (item.Pinyin != null && item.Pinyin.indexOf(str) != -1) ||
                (item.PYHead != null && item.PYHead.indexOf(str) != -1)) {
                if (num++ < maxLimit) {
                    arr.push(item);
                }
            }
        });

        if (callback != null) {
            callback(arr);
        }
    }
}

module.exports = DepartmentManager;
