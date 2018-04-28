var util = require('util');
var events = require('events');
var map = require('../utils/Map.js');
var Database = null;
var getDatabase = function () {
    if (!Database) {
        Database = require('../data/Database.js');
    }
    return Database;
};

var restClient = null;
var getRestClient = function () {
    if (!restClient) {
        restClient = require('../apis/RESTClient.js');
    }
    return restClient;
};

var base = require('./processorbase.js');
var constVar = require('../data/AppConstVar.js');
var _ = require('lodash');

var szApi = require('../apis/api');

var Logger = require('../utils/log.js');
/*
 *访客处理
 */
var FriendsProcessor = function (netClient) {
    var logger = new Logger("FriendsProcessor");
    this.data = {};
    var self = this;
    self._netClient = netClient;
    this._map = new map.Map(); //存储访客显示控制类
    this.errorUsers = [];
    var _organzitonData;
    var _deptData;             //部门表所有数据
    var _userData;             //人员表所有数据
    var _deptUserRel;          //部门与人员关系所有数据
    var _normalDeptData;       //返回在用的部门列表（去掉未分配、离职、已停用）
    var _userMap;              //当前最新人员集合（人员ID为键，人员对象为值）
    var _deptUserRelMap;       //部门人员关联集合

    events.EventEmitter.call(this);
    base.ProcessorBase.call(this);

    this.getFriend = function (key, callback) {
        var friend = self._map.get(key + "");
        if (friend) {
            friend.faceImg = global.ImageCache.CreateImageUrl(friend.HeadImage, friend.Sex);
            friend.getLocalImg = function () {
                return global.ImageCache.getHeadImageUrl(key);
            };
            if (callback) {
                callback && callback(friend)
            } else {
                return friend;
            }
        } else {
            if (self.errorUsers.indexOf(key) == -1 && callback) {
                getRestClient().GetUsersInfoFromServer([parseInt(key)], function (resp) {
                    if (resp[0]) {
                        var tempUser = {};
                        ServerInfoToLocalInfo(tempUser, resp[0]);
                        self.putFriend(tempUser.Id, tempUser);
                        tempUser.faceImg = global.ImageCache.CreateImageUrl(tempUser.HeadImage, tempUser.Sex);
                        tempUser.getLocalImg = function () {
                            return global.ImageCache.getHeadImageUrl(tempUser.Id);
                        };
                        getDatabase().insertOrUpdateUserInfo(resp[0]);

                        //人员不对应可能是增量未拉取导致，这里重新拉取增量。
                        self.getIncrement([1, 1, 1, 1]);
                        global.UserLeaderProcessor.initUserLeader();//增量更新（人员与上级关系）

                        if (callback) {
                            callback && callback(tempUser)
                        } else {
                            return tempUser;
                        }
                    } else {
                        self.errorUsers.push(key);
                    }
                });
            }
        }
    }

    /**
     * 获取该fid的访客控制类对象  keys可以为空，getFriends(callback)表示返回全部用户
     * @param {string|array}keys  要获取的key，可以为
     * @param callback 返回值的回调
     */
    this.getFriends = function (keys, callback) {
        if (callback === undefined && typeof keys === "function") {
            callback = keys;
            keys = undefined;
        }
        if (!keys) {
            callback(self._map.values().map(function (friend) {
                friend.faceImg = global.ImageCache.CreateImageUrl(friend.HeadImage, friend.Sex);
                friend.getLocalImg = function () {
                    return global.ImageCache.getHeadImageUrl(friend.Id);
                };
                return friend;
            }))
        } else {
            if (typeof keys === 'string') {
                keys = [keys];
            }
            var friends = [];
            keys.forEach(function (key) {
                if (self._map.containsKey(key)) {
                    var friend = self._map.get(key);
                    if (friend) {
                        friend.faceImg = global.ImageCache.CreateImageUrl(friend.HeadImage, friend.Sex);
                        friend.getLocalImg = function () {
                            return global.ImageCache.getHeadImageUrl(friend.Id);
                        };
                        friends.push(friend);
                    }
                }
            });
            //本地检索到的数量小于预期的数据，可能有数据没有从服务器获取
            if (friends.length != keys.length) {
                getRestClient().GetUsersInfoFromServer(keys, function (resp) {
                    friends = [];
                    var usersArray = resp;
                    for (var i = 0; i < usersArray.length; i++) {
                        var friend = self.getFriend(usersArray[i].id) || {};
                        ServerInfoToLocalInfo(friend, usersArray[i]);
                        friend.faceImg = global.ImageCache.CreateImageUrl(friend.HeadImage, friend.Sex);
                        friend.getLocalImg = function () {
                            return global.ImageCache.getHeadImageUrl(friend.Id);
                        };
                        self.putFriend(friend.Id, friend);
                        friends.push(friend);
                    }
                    getDatabase().insertFriendsInfo(usersArray);
                    callback(friends);
                    //人员不对应可能是增量未拉取导致，这里重新拉取增量。
                    self.getIncrement([1, 1, 1, 1]);
                    global.UserLeaderProcessor.initUserLeader();//增量更新（人员与上级关系）
                });
            } else {
                callback(friends);
            }
        }
    }

    /**
     * 获取用户昵称
     */
    this.getFriendName = function (key) {
        var fobj = self._map.get(key);
        return fobj ? fobj.Name : '未知用户';
    };

    /**
     * 获取用户昵称拼接的字符串
     */
    this.getFriendNames = function (keys, showLimit, delimiter) {
        showLimit = showLimit ? showLimit : 3;
        var names = '';
        var deli = delimiter || ' '
        for (var i = 0; i < keys.length; i++) {
            if (i == showLimit) {
                names = names.replace(/(\s*$)/g, "") + '等' + keys.length + '个用户';
                break;
            }
            names = names + self.getFriendName(keys[i]) + deli;
        }
        return names.replace(/(\s*$)/g, "");
    };

    //this.getFriendByEmail = function (email) {
    //    var friend = self._emailMap.get(email);
    //    if (friend) {
    //        friend.faceImg = ImageCache.CreateImageUrl(friend.HeadImage, friend.Sex);
    //    }
    //    return friend;
    //}

    /*
     *向容器中添加该fid的访客控制类对象
     *key        访客的FriendId
     *Friend    访客控制类
     */
    this.putFriend = function (key, friend) {
        if (self.getFriend(key)) {
            friend.isOnline = self.getFriend(key).isOnline;
        }
        self._map.put(key, friend);
        // self._emailMap.put(friend.LoginId, friend);
    };

    /*
     * 遍历访客控制类对象
     * fun 遍历时要执行的函数
     */
    this.forEachFriend = function (fun) {
        var values = self._map.values();
        values.forEach(function (friend) {
            if (friend) {
                friend.faceImg = global.ImageCache.CreateImageUrl(friend.HeadImage, friend.Sex);
            }
            fun(friend);
        });
    }

    /**
     * 返回所有部门表数据
     */
    this.getDeptList = function () {
        return _deptData;
    }

    /**
     * 返回所有人员表数据
     */
    this.getUserList = function () {
        var userList = [];
        if (_userData && _userData.length > 0) {
            _userData.forEach(function (item) {
                if (item.tel && typeof item.tel == 'string') {
                    item.tel = JSON.parse(item.tel);
                }
                if (item.email_info && typeof item.email_info == 'string') {
                    item.email_info = JSON.parse(item.email_info);
                }
                if (item.pre_dept_name && typeof item.pre_dept_name == 'string') {
                    item.pre_dept_name = JSON.parse(item.pre_dept_name);
                }
                userList.push(item);
            });
        }
        return userList;
    }

    /**
     * 返回所有部门与人员关系表数据
     */
    this.getDeptUserRel = function () {
        return _deptUserRel;
    }

    /**
     * 返回不同类型的部门信息
     * bool bool  是否只返回在用部门（去掉未分配、离职、已停用）
     */
    this.getNormalDepts = function (bool = true) {
        var normalDeptList = _.clone(this.getDeptList());

        if (bool) {
            _.remove(normalDeptList, (dept) => {
                return [3, 4].indexOf(dept.system_type) > -1 || dept.is_delete == 1;
            });
            return _.map(_.orderBy(normalDeptList, ['dept_order'], 'asc'));//部门排序

        } else {
            var obj = {};
            _.map(normalDeptList, (dept) => {
                obj[dept.id] = dept;
            });
            return obj;
        }
    }

    /**
     * 返回部门信息
     * deptId        number/string 部门ID
     * level         number        返回什么层级的部门（0所有层级 /1一级）
     * returnFiled   string/null   要返回的部门字段（为空时返回所有字段）
     * returnCurrent bool          是否返回当前部门（默认否）
     */
    this.getChildDepts = function (deptId, level = 1, returnFiled = 'id', returnCurrent = false) {
        var depts = [];
        if (returnCurrent) {
            var deptInfo = this.getDeptOrUser('dept', deptId, returnFiled, 'array');
            if (deptInfo.length > 0) {
                depts = deptInfo;
            }
        }

        if (deptId > 0 && _normalDeptData.length > 0) {
            _normalDeptData.map((dept) => {
                if (dept.main_id == deptId) {
                    if (returnFiled && _.has(dept, returnFiled)) {
                        depts.push(dept[returnFiled]);
                    } else {
                        depts.push(dept);
                    }

                    if (level == 0) {
                        var childDepts = this.getChildDepts(dept.id, 0, returnFiled, false);
                        depts = depts.concat(childDepts);//合并子部门
                    }
                }
            });
        }
        return depts;
    },

        /**
         * 获取部门人员（默认直属下级部门）
         * deptId        number/string 部门ID
         * level         number        返回什么层级的部门（0所有层级 /1一级）
         * returnFiled   string/null   要返回的人员字段（为空时返回所有字段）
         * returnCurrent bool          是否返回当前部门（默认否）
         */
        this.getDeptUsers = function (deptId, level = 1, returnFiled = 'id', returnCurrent = false) {
            var users = {};
            var deptArr = this.getChildDepts(deptId, level, 'id', returnCurrent);

            deptArr.map((deptId) => {//循环部门
                if (_deptUserRelMap[deptId]) {//如果该部门下有人
                    var deptUserIdList = _deptUserRelMap[deptId];
                    deptUserIdList.map((uid) => {
                        if (_userMap[uid] && !users[uid]) {//存在此人员信息
                            if (returnFiled && _userMap[uid][returnFiled]) {
                                users[uid] = _userMap[uid][returnFiled];//返回单个字段
                            } else {
                                users[uid] = _userMap[uid];//返回所有字段
                            }
                        }
                    });
                }
            });
            return _.values(users);
        }

    /**
     * 返回部门/人员详情
     * type         string                要获取的数据（dept部门/user人员）
     * ids          (number/string)/array 部门/用户ID集合（单个时可传入数字或字符串/多个时需传入数组）
     * returnFiled  string/null           要返回的部门/人员字段（为空时返回所有字段）
     * returnType   object/array          返回格式（object：{7：{...}, 15：{...}}  / array：[{...}, {...}]）
     */
    this.getDeptOrUser = function (type, ids, returnFiled = 'id', returnType = 'array') {
        var idArray = !_.isArray(ids) ? [ids] : ids,
            result = returnType == 'object' ? {} : [],
            dataMap = type == 'dept' ? this.getNormalDepts(false) : _userMap;//所有部门或人员数据

        if (idArray.length > 0 && dataMap) {
            _.map(idArray, (id) => {
                if (dataMap[id]) {//存在此部门/人员信息
                    if (returnFiled && dataMap[id][returnFiled]) {
                        if (returnType == 'object') {
                            result[id] = dataMap[id][returnFiled];//返回单个字段
                        } else {
                            result.push(dataMap[id][returnFiled]);
                        }

                    } else {
                        if (returnType == 'object') {
                            result[id] = dataMap[id];//返回所有字段
                        } else {
                            result.push(dataMap[id]);
                        }
                    }
                }
            });
        }

        return result;
    }

    this.getFriendList = function () {
        return self._map.values();
    }

    this.getFriendListKeys = function () {
        return self._map.keys();
    }

    /*
     *判断是否包含该FriendId的访客控制类对象
     **/
    this.containsFriend = function (key) {
        return self._map.containsKey(key)
    }

    //this.containsEmail = function (email) {
    //    return self._emailMap.containsKey(email)
    //}

    /*
     *删除该FriendId的访客控制类对象
     */
    this.removeFriend = function (key) {
        // var email = self._emailMap.get(key).Email;
        self._map.remove(key);
        //self._emailMap.remove(email);
    }

    /*
     *删除该Friend的访客控制类对象
     */
    //this.removeFriendByEmail = function (email) {
    //    var id = self._emailMap.get(email).Id;
    //    self._map.remove(id);
    //    self._emailMap.remove(email);
    //}

    this.clearFriendMap = function () {
        var keys = self._map.keys();
        for (var i = 0; i < keys.length; i++) {
            self._map.remove(keys[i]);
        }
    };

    /**
     * 清空本地缓存组织架构信息
     */
    this.reLoadOrganzitonData = function () {
        getDatabase().setConfig('organization.userinfo.maxidentity', 0);
        getDatabase().setConfig('organization.deptinfo.maxidentity', 0);
        getDatabase().setConfig('organization.userdeptrelation.maxidentity', 0);
        self.initOrganzitonData(true);
    };

    /**
     * 根据通知改变本地数据
     * identity数组中的含义
     第一个数字为1表示用户信息需要更新
     第二个数字为1表示部门信息需要更新
     第三个数字为1表示用户部门关系需要更新
     第四个数字为1表示领导信息需要更新
     */
    this.getIncrement = function (identity) {
        var needInitOrginzation = false;
        if (identity[0] == 1) {
            getDatabase().getConfig('Organization.userInfo.maxIdentity', function (result) {
                getRestClient().GetUserIncrement(parseInt(result && result.value) || 0).then(function (result) {
                    var data = result.data;
                    var fnArr = [];//需要执行的函数集合

                    data.insert && data.insert.length > 0 && fnArr.push(insertUser(data.insert));//添加人员
                    data.update && data.update.length > 0 && fnArr.push(updateUser(data.update));//修改人员
                    data.delete && data.delete.length > 0 && fnArr.push(deleteUser(data.delete));//删除人员

                    Promise.all(
                        fnArr
                    ).then(function (result) {
                        if (data.insert || data.delete) {
                            needInitOrginzation = true;
                        }

                        if (data.max_identity) {
                            getDatabase().setConfig('Organization.userInfo.maxIdentity', data.max_identity);
                        }

                        if (fnArr.length > 0) {
                            reloadOrganzitonDataUI(needInitOrginzation, data.update, 'stateUser');
                        }
                    }).catch(function (err) {
                        logger.error("edit department error", err);
                    });
                }).catch(function (err) {
                    //self.emit("failed");
                    logger.error("getUserInfoIncrement", err);
                });
            });
        }

        if (identity[1] == 1) {
            getDatabase().getConfig('Organization.deptInfo.maxIdentity', function (result) {
                getRestClient().GetDeptIncrement(parseInt(result && result.value) || 0).then(function (result) {
                    var data = result.data;
                    var fnArr = [];//需要执行的函数集合

                    data.insert && data.insert.length > 0 && fnArr.push(insertDept(data.insert));//添加部门
                    data.update && data.update.length > 0 && fnArr.push(updateDept(data.update));//修改部门
                    data.delete && data.delete.length > 0 && fnArr.push(deleteDept(data.delete));//删除部门

                    Promise.all(
                        fnArr
                    ).then(function (result) {
                        if (data.insert || data.delete) {
                            needInitOrginzation = true;
                        }

                        if (data.max_identity) {
                            getDatabase().setConfig('Organization.deptInfo.maxIdentity', data.max_identity);
                        }

                        if (fnArr.length > 0) {
                            reloadOrganzitonDataUI(needInitOrginzation, [], 'stateDept');
                        }
                    }).catch(function (err) {
                        logger.error("edit department error", err);
                    });
                }).catch(function (err) {
                    //self.emit("failed");
                    logger.error("getUserInfoIncrement", err);
                });
            });
        }

        if (identity[2] == 1) {
            getDatabase().getConfig('Organization.userDeptRelation.maxIdentity', function (result) {
                getRestClient().GetUserDeptIncrement(parseInt(result && result.value) || 0).then(function (result) {
                    var data = result.data;
                    var fnArr = [];//需要执行的函数集合

                    data.insert && data.insert.length > 0 && fnArr.push(insertDeptUserRel(data.insert));//添加部门与人员关系
                    data.update && data.update.length > 0 && fnArr.push(updateDeptUserRel(data.update));//修改部门与人员关系
                    data.delete && data.delete.length > 0 && fnArr.push(deleteDeptUserRel(data.delete));//删除部门与人员关系

                    Promise.all(
                        fnArr
                    ).then(function (result) {
                        needInitOrginzation = true;

                        if (data.max_identity) {
                            getDatabase().setConfig('Organization.userDeptRelation.maxIdentity', data.max_identity);
                        }

                        if (fnArr.length > 0) {
                            reloadOrganzitonDataUI(needInitOrginzation, [], 'stateDeptUserRel');
                        }
                    }).catch(function (err) {
                        logger.error("edit deptUserRelation error", err);
                    });
                }).catch(function (err) {
                    //self.emit("failed");
                    logger.error("getUserInfoIncrement", err);
                });
            });
        }
    };

    function reloadOrganzitonDataUI(needInitOrginzation, updateUsers, type) {
        prepareOrganzationData().then(function () {
            switch (type) {
                case 'stateDept':
                    global.FriendsProcessor.emit("reloadUserState", "dept");//更新状态树部门数据
                    break;
                case 'stateUser':
                    global.FriendsProcessor.emit("reloadUserState", "user");//更新状态树人员数据
                    break;
                case 'stateDeptUserRel':
                    global.FriendsProcessor.emit("reloadUserState", "deptUserRel");//更新状态树部门与人员关系数据
                    break;
            }

            needInitOrginzation && global.FriendsProcessor.emit("initOrginzation");
            if (updateUsers && updateUsers.length > 0) {
                updateUsers.forEach(function (user) {
                    var fobj = global.FriendsProcessor.getFriend(user.id);
                    global.ImageCache.GetHeadImage(fobj, $("#fheadimg"));
                    setTimeout(function () {
                        global.FriendsProcessor.emit("userInfoUpdate", fobj);
                    }, 500);
                });
            }

        }
        );
    }

    /**
     * 初始化本地架构信息
     * 本地未保存，拉取服务器数据
     */
    this.initOrganzitonData = function (needInitOrginzation) {
        Promise.all([
            getUserInfoIncrement(),
            getDeptInfoIncrement(),
            getUserDeptRelaIncrement()
        ]).then(function () {
            return prepareOrganzationData();
        }).then(function () {
            if (needInitOrginzation) {
                global.FriendsProcessor.emit("initOrginzation");
                var fobj = self.getFriend(global.getAccountId())
                global.ImageCache.GetHeadImage(fobj, $("#fheadimg"));
                setTimeout(function () {
                    global.FriendsProcessor.emit("userInfoUpdate", fobj);
                }, 500);
            } else {
                self.emit("ready");
            }
        }).catch(function (err) {
            //self.emit("failed");
            console.error(err)
            logger.error("getUserInfoIncrement, getDeptInfoIncrement, getUserDeptRelaIncrement error", err);
        })
    }

    this.initUserInfo = initUserInfo;

    function prepareOrganzationData() {
        return Promise.all([
            getDatabase().getUserInfos(),
            getDatabase().getDepartments(),
            getDatabase().getDeptUserRelas(),
            self.getUserState(),
        ]).then(function (results) {
            initUserInfo(results[0].map(user => {
                const uid = _.findIndex(results[3].data, ['uid', user.id]);
                return Object.assign(user, {
                    workStatus: uid != -1 ? results[3].data[uid].status : 0,
                })
            }));
            self.emit("updateWorkStatus", results[3].data);
            initDepartments(results[1], results[2]);

            _userData = results[0];   //人员数据
            _deptData = results[1];   //部门数据
            _deptUserRel = results[2];//部门与人员关系数据

            if (results[0]) {//_userMap重新赋值
                _userMap = [];
                _.forEach(results[0], (user) => {
                    _userMap[user.id] = user;
                });
            }

            if (results[2]) {//_deptUserRelMap重新赋值
                _deptUserRelMap = [];
                results[2].map((item) => {
                    //这里的值比如【未分配部门】也是需要关联到人，所以无需判断系统创建
                    if (!_deptUserRelMap[item.dept_id]) {
                        _deptUserRelMap[item.dept_id] = [];
                    }
                    _deptUserRelMap[item.dept_id].push(item.uid);
                });
            }

            return getDatabase().getRootDepartment().then(function (deptArr) {
                var org_info = new Array();
                deptArr.forEach(function (rootDept) {
                    var depart = global.deptMgr.getDepartment(rootDept.id);
                    depart && org_info.push(structureOrganziton(depart));
                });

                _normalDeptData = self.getNormalDepts();
                _organzitonData = { org_info: org_info };
            });
        });
    }

    this.getUserState = () => {
        return szApi.post({
            m: "Department",
            a: "UserStatus",
        })
    }

    function initUserInfo(userInfoData) {
        userInfoData.forEach(function (user) {
            var tempUser = {};
            user.Id ? (tempUser = user) : ServerInfoToLocalInfo(tempUser, user);
            self.putFriend(tempUser.Id + "", tempUser);
        });
    }

    function insertUser(data) {//添加人员
        global.szMail && global.szMail.setSystemUserEmails(data);
        return getDatabase().insertUserInfos(data);
    }

    function updateUser(data) {//修改人员
        global.szMail && global.szMail.setSystemUserEmails(data);
        return data.forEach(function (item) {
            getDatabase().insertOrUpdateUserInfo(item);
        });
    }

    function deleteUser(data) {//删除人员
        global.szMail && global.szMail.setSystemUserEmailsDelete(data);
        return data.forEach(function (userId) {
            if (userId == global.getAccountId()) {
                global.FriendsProcessor.emit("userQuit");
            }
            getDatabase().setUserInfoDelete(userId);
        });
    }

    function insertDept(data) {//添加部门
        return getDatabase().insertDepartments(data);
    }

    function updateDept(data) {//修改部门
        return data.forEach(function (item) {
            getDatabase().insertOrUpdateDepartment(item);
        });
    }

    function deleteDept(data) {//删除部门
        return data.forEach(function (deptId) {
            getDatabase().setDepartmentDelete(deptId);
        });
    }

    function insertDeptUserRel(data) {//添加部门与人员关系
        return getDatabase().insertUserDeptRelations(data);
    }

    function updateDeptUserRel(data) {//修改部门与人员关系
        return data.forEach(function (item) {
            getDatabase().insertOrUpdateUserDeptRelation(item);
        });
    }

    function deleteDeptUserRel(data) {//删除部门与人员关系
        return data.forEach(function (deptId) {
            getDatabase().deleteDeptUserRelation(deptId);
        });
    }

    function initDepartments(deptData, userDeptData) {
        var leave;
        deptData.forEach(function (dept) {
            if (dept.managers.search('"') == 0) {
                dept.managers = dept.managers.replace(/\"/g, '');
            }
            var department = {
                dId: dept.id,
                members: new Array(),
                deptMembers: new Array(),
                dName: dept.dept_name,
                order: dept.dept_order,
                // PYHead: PYHead.toUpperCase(),
                // Pinyin: Pinyin.toUpperCase(),
                dPath: dept.dept_name,//TODO 获取部门路径
                parentId: dept.main_id,
                childDeptIds: new Array(),
                leader: dept.managers ? dept.managers.split(',') : [],
                systemType: dept.system_type
            };
            global.deptMgr.putDepartment(department.dId, department);
            if (dept.system_type == 4) {
                leave = dept.id;
            }
        });

        deptData.forEach(function (dept) {
            var parentDept = global.deptMgr.getDepartment(dept.main_id);
            if (parentDept) {
                parentDept.childDeptIds.push(dept.id);
            }
        });

        userDeptData.forEach(function (rela) {
            var user = self.getFriend(rela.uid);
            if (user != null) {
                if (user.IsDelete == 0 && rela.dept_id != leave) {
                    global.deptMgr.addDeptMember(rela.dept_id, rela.uid);
                }
                if (user.orgDeptId == null) {
                    user.orgDeptId = new Array();
                }
                var dept = global.deptMgr.getDepartment(rela.dept_id);
                if (dept) {
                    user.deptName = dept.dName;
                } else {
                    user.deptName = "未知用户";
                }
                user.orgDeptId.push(rela.dept_id);
            }
        })
    }

    function getDeptInfoIncrement() {
        return new Promise(function (reslove, reject) {
            getDatabase().getConfig('Organization.deptInfo.maxIdentity', function (result) {
                getRestClient().GetDeptIncrement(parseInt(result && result.value) || 0).then(function (result) {
                    if (result.code == 0) {
                        var data = result.data;
                        if (data.insert) {
                            // data.insert.forEach(function(item){
                            getDatabase().insertDepartments(data.insert, function () {
                                if (data.update) {
                                    data.update.forEach(function (item) {
                                        getDatabase().insertOrUpdateDepartment(item);
                                    });
                                }
                                if (data.delete) {
                                    data.delete.forEach(function (deptId) {
                                        getDatabase().setDepartmentDelete(deptId);
                                    });
                                }
                                if (data.max_identity) {
                                    getDatabase().setConfig('Organization.deptInfo.maxIdentity', data.max_identity);
                                }
                                reslove();
                            });
                            //});
                        }

                    } else {
                        reject();
                    }
                }).catch(reject);
            });
        });
    }

    function getUserDeptRelaIncrement() {
        return new Promise(function (reslove, reject) {
            getDatabase().getConfig('Organization.userDeptRelation.maxIdentity', function (result) {
                getRestClient().GetUserDeptIncrement(parseInt(result && result.value) || 0).then(function (result) {
                    if (result.code == 0) {
                        var data = result.data;
                        if (data.insert) {
                            //data.insert.forEach(function(item){
                            getDatabase().insertUserDeptRelations(data.insert, function () {
                                if (data.update) {
                                    data.update.forEach(function (item) {
                                        getDatabase().insertOrUpdateUserDeptRelation(item);
                                    });
                                }
                                if (data.delete) {
                                    data.delete.forEach(function (deptId) {
                                        getDatabase().deleteDeptUserRelation(deptId);
                                    });
                                }
                                if (data.max_identity) {
                                    getDatabase().setConfig('Organization.userDeptRelation.maxIdentity', data.max_identity);
                                }

                                reslove();
                            });
                            //});
                        }

                    } else {
                        reject();
                    }
                }).catch(reject);
            });
        });
    }

    function getUserInfoIncrement() {
        return new Promise(function (reslove, reject) {
            getDatabase().getConfig('Organization.userInfo.maxIdentity', function (result) {
                getRestClient().GetUserIncrement(parseInt(result && result.value) || 0).then(function (result) {
                    if (result.code == 0) {
                        var data = result.data;
                        if (data.insert) {
                            getDatabase().insertUserInfos(data.insert, function () {
                                if (data.update) {
                                    data.update.forEach(function (item) {
                                        getDatabase().insertOrUpdateUserInfo(item);
                                    });
                                    global.szMail && global.szMail.setSystemUserEmails(data.update);
                                }
                                if (data.delete) {
                                    data.delete.forEach(function (deptId) {
                                        getDatabase().setUserInfoDelete(deptId);
                                    });
                                    global.szMail && global.szMail.setSystemUserEmailsDelete(data.delete);
                                }
                                if (data.max_identity) {
                                    getDatabase().setConfig('Organization.userInfo.maxIdentity', data.max_identity);
                                }
                                global.szMail && global.szMail.setSystemUserEmails(data.insert);
                                reslove();
                            });
                        }
                    } else {
                        reject();
                    }
                }).catch(reject);
            });
        });
    }

    this.GetOrginationData = function () {
        return _organzitonData;
    }

    this.getFriendInfo = function (fid, callback) {
        if (fid != null && fid != "") {
            getDatabase().getFriendInfoById(fid, function (row) {
                if (row) {
                    var friend = getDatabase().user2obj(row);
                    friend.faceImg = global.ImageCache.CreateImageUrl(friend.HeadImage, friend.Sex);
                    callback && callback(friend);
                } else {
                    if (self.errorUsers.indexOf(key) == -1 && callback) {
                        getRestClient().GetUsersInfoFromServer([fid], function (resp) {
                            if (resp[0]) {
                                var users = resp;
                                var friend = self.getFriend(fid) || {};
                                ServerInfoToLocalInfo(friend, users[0]);
                                friend.faceImg = global.ImageCache.CreateImageUrl(friend.HeadImage, friend.Sex);
                                self.putFriend(friend.Id, friend);
                                getDatabase().insertOrUpdateFriendInfo(users[0]);
                                callback && callback(friend);
                            } else {
                                self.errorUsers.push(fid);
                            }
                        });
                    }
                }
            });
        }
    }

    function structureOrganziton(parentDepartment) {

        var orgInfo = {
            member_info: new Array(),
            org_id: parentDepartment.dId,
            org_info: [],
            org_order: parentDepartment.order,
            org_name: parentDepartment.dName
        };

        //获取部门用户
        if (parentDepartment.deptMembers.length > 0) {
            parentDepartment.deptMembers.forEach(function (uid) {
                self.getFriend(uid, function (user) {
                    if (user) {
                        orgInfo.member_info.push({
                            IsDelete: user.IsDelete,
                            leader: user.IsLeader,
                            uid: user.Id,
                            username: user.Name,
                            top_time: getUserTopTime(parentDepartment.dId, user.Id),
                            workStatus: user.workStatus,
                        });
                        orgInfo.member_info = _.orderBy(orgInfo.member_info, "top_time", "desc");
                    } else {
                        logger.error("uid is not exists! uid=", uid);
                    }
                });
            });
        }

        if (parentDepartment.childDeptIds.length > 0) {
            parentDepartment.childDeptIds
                .reverse()
                .forEach(function (departId) {
                    var childDept = global.deptMgr.getDepartment(departId);

                    if (childDept.systemType == 3) {
                        orgInfo.org_info.push(structureOrganziton(childDept))
                    } else if (childDept.systemType != 4) {// systemType==4 目前表示为离职，所以不显示
                        orgInfo.org_info.unshift(structureOrganziton(childDept))
                    }
                });
        }
        return orgInfo;
    }

    function getUserTopTime(did, uid) {
        var list = _.filter(_deptUserRel, { 'dept_id': did, 'uid': uid });
        return list.length > 0 ? list[0].top_time : 0;
    }

    function ServerInfoToLocalInfo(lInfo, sInfo) {
        lInfo.Id = sInfo.id;
        lInfo.IsMe = sInfo.id == global.getAccountId();
        lInfo.LoginId = sInfo.email;
        lInfo.Mobile = sInfo.mobile;
        lInfo.Title = sInfo.title;
        lInfo.Name = sInfo.username;
        lInfo.PYHead = sInfo.header_letters;
        lInfo.Pinyin = sInfo.pinyin;
        lInfo.Sex = sInfo.sex && sInfo.sex > 0 ? sInfo.sex : 1;
        lInfo.BossType = sInfo.boss_type;
        lInfo.BloodType = sInfo.blood_type;
        lInfo.EmailInfo = eval(sInfo.email_info || "[]");
        lInfo.Education = sInfo.education;//学历 0 未选 1无 2小学 3初中 4高中 5中专 6大专 7本科 8硕士研究生 9博士研究生
        lInfo.HireDate = sInfo.hire_date; //入职时间
        lInfo.IsMarry = sInfo.is_marry; //是否已婚 1 否 2 是
        lInfo.ChildrenNum = sInfo.children_num;//有几个孩子
        lInfo.WorkDate = sInfo.work_date;//参加工作时长
        lInfo.EmergencyContactPerson = sInfo.emergency_contact_person;//紧急联系人
        lInfo.EmergencyContactMobile = sInfo.emergency_contact_mobile;//紧急联系电话
        lInfo.Birthday = sInfo.birthday;
        lInfo.HeadImage = sInfo.avatar;
        lInfo.Signature = sInfo.description;
        lInfo.Title = sInfo.title;
        lInfo.Telephone = eval(sInfo.tel);
        lInfo.IsDelete = sInfo.is_delete ? sInfo.is_delete : 0;
        lInfo.untreatedType = sInfo.untreated_type;//'未处理类型 0正常 1未分配直属上级 2未分配部门 3 直属上级跟部门均未分配 '
        lInfo.QQ = sInfo.qq;
        lInfo.preDeptName = sInfo.pre_dept_name ? eval(sInfo.pre_dept_name) : [];
        lInfo.IsLeader = sInfo.is_leader == 1;
        lInfo.IsManager = sInfo.is_manager == 1;
        lInfo.IsAdmin = sInfo.is_admin == 1;
        sInfo.workStatus !== undefined && (lInfo.workStatus = sInfo.workStatus);
    }

    this.UpdateFriendInfo = function (updateKeys) {
        if (updateKeys.length != 0) {
            getRestClient().GetUsersInfoFromServer(updateKeys, function (resp) {
                var items = resp;
                for (var i = 0; i < items.length; i++) {
                    var obj = self._map.get(items[i].id);
                    if (obj != null) {
                        ServerInfoToLocalInfo(obj, items[i]);
                        self.putFriend(obj.Id, obj);
                        global.FriendsProcessor.emit("userInfoUpdate", fobj);
                        getDatabase().updateFriendInfo(items[i]);
                    }
                }

            });
        }
    }

    function addInternalAccount() {
        var secretary = {
            Id: 1,
            Name: "小秘书",
            HeadImage: constVar.imagePath.imageSecretary,
            Pinyin: "xiaomishu",
            PYHead: "xms"
        };
        self.putFriend(secretary.Id, secretary);
        var tasks = {
            Id: 2,
            Name: "待办事项",
            HeadImage: constVar.imagePath.imageTask,
            Pinyin: "daibanshixiang",
            PYHead: "dbsx"
        };
        self.putFriend(tasks.Id, tasks);
        var servant = {
            Id: 19,
            Name: "哨子客服",
            HeadImage: constVar.imagePath.imageServant,
            Pinyin: "kefu",
            PYHead: "kf"
        };
        self.putFriend(servant.Id, servant);
    }

    this.findFriend = function (str, maxLimit, callback) {
        if (str) {
            str = str.toUpperCase();
        }
        var arr = new Array();
        var values = self._map.values();
        for (var i = 0; i < values.length; i++) {
            var item = values[i];
            if ((item.Id != global.getAccountId()) && ((item.Name != null && item.Name.toUpperCase().indexOf(str) != -1) ||
                (item.Pinyin != null && item.Pinyin.toUpperCase().indexOf(str) != -1) ||
                (item.PYHead != null && item.PYHead.toUpperCase().indexOf(str) != -1))) {
                if (arr.length < maxLimit) {
                    arr.push(item);
                } else {
                    break;
                }
            }
        }

        if (callback != null) {
            callback(arr);
        }
    }
};
/*
 *继承事件类
 */
util.inherits(FriendsProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(FriendsProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = FriendsProcessor;
