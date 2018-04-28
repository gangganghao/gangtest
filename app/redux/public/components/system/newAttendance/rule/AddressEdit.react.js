import React, { Component } from 'react';
import PropTypes from "prop-types";
import apiHelper from '../../../../api/apiHelper.js';
import Tooltip from 'rc-tooltip';
const mapZoomSize = 18;
const warningTime = 2500;
/**
 * 考勤地点管理组件
 * 
 * @class AddressEdit
 * @extends {Component}
 */
class AddressEdit extends Component {
    constructor(props) {
        super(props);
        this.state = {
            edit: props.edit,//当前在编辑的对象
            optionShow: false, //是否显示待选地址列表
            inputFocus: false, //输入框是否获的焦点，
        }
        this.map = {} //百度地图对象
        this.initAddress = _.clone(props.edit.address);
    }

    showNullResult() {
        apiHelper.warning("考勤地址搜索结果为空，请尝试减少检索关键字长度，或拖动地图单击选点！", warningTime)
        return
    }

    handleSaveFunc() {
        const { isNew, readonly, closeModal, saveFunc,currentIndex } = this.props
        let { address, address_xy, distance } = this.state.edit
        if (!address_xy.length) {
            apiHelper.error("请在地图上选择一个地址坐标！", warningTime)
            return
        }
        if (!address) {
            apiHelper.error("请输入考勤地址！", warningTime)
            return
        }
        if (!distance) {
            apiHelper.error("考勤地址有效范围必须大于0！",  warningTime)
            return
        }
        if (distance > 10000) {
            apiHelper.error("考勤地址有效范围不能大于10千米！",  warningTime)
            return
        }
        let newAddress = $("#suggestId").val();
        if (newAddress) {
            saveFunc(currentIndex,{ ...this.state.edit, address: newAddress });
        } else {
            saveFunc(currentIndex,this.state.edit);
        }

    }

    handleInputKeyPressSearch(val) {
        this.localSearch(val);
    }

    render() {
        let { edit, optionShow } = this.state;
        const { isNew, readonly, closeModal, saveFunc } = this.props;
        let { address, address_xy, distance } = edit;

        let overLayText = "输入关键字后选取搜索建议或直接单击地图选点";
        if (address.length > 0) {
            overLayText = "编辑调整地址";
        }
        return (
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="close" onClick={closeModal}><i
                            className="iconfont icon-delname"></i></button>
                        <h4 className="modal-title" style={{ display: 'inline-block' }}>{'考勤地点' + (readonly ? '查看' : (isNew ? '新增' : '编辑'))}</h4>
                    </div>
                    <div className="modal-body">
                        <div className="clock-land" style={{ padding: "20px" }}>

                            <div className="clock-choose" style={{ marginTop: "-20px" }}>
                                <ul className="clearfix">
                                    <li>
                                        <label><b>*</b>考勤地址：</label>
                                        <div className="clock-site-elect">
                                            <Tooltip placement="topLeft" overlay={overLayText} overlayClassName={readonly == true || optionShow ? "hide" : ""}>
                                                <div className="clock-sitsech contenteditable" style={readonly ? { backgroundColor: "#eee" } : {}}>
                                                    <input
                                                        type="text"
                                                        placeholder={this.initAddress || "搜索地点"}
                                                        id="suggestId"
                                                        defaultValue={address}
                                                        disabled={readonly}
                                                        tabIndex="1" />
                                                    {readonly ? null : <i className="iconfont icon-thinclose" onClick={() => { $("#suggestId").val("") }}></i>}
                                                    {readonly ? null : <a href="javascript:;" onClick={() => { this.handleInputKeyPressSearch($("#suggestId").val()) }}><i className="iconfont icon-search"></i>搜索</a>}
                                                </div>
                                            </Tooltip>

                                        </div>

                                    </li>
                                </ul>
                            </div>
                            <div className="clock-map" id="allmap" onMouseOver={() => { optionShow && this.setState({ optionShow: false }) }}></div>
                            <div className="clock-choose">
                                <ul className="clearfix">
                                    <li>
                                        <label><b>*</b>考勤有效范围：</label>

                                        <input
                                            type="text"
                                            className="form-control"
                                            value={distance}
                                            placeholder="请输入数字"
                                            disabled={readonly}
                                            onChange={(e) => {
                                                this.changeDistance(e.target.value)
                                            }}
                                            onFocus={(e) => {
                                                this.setState({ optionShow: false })
                                            }}
                                            tabIndex="2"
                                        />


                                        <em>米</em>
                                        <div className="crm-why">
                                            <a href="javascript:void(0)">为什么默认范围是300米？</a>
                                            <div className="form-error">国家规定民用定位不得过于精准，在不影响日常考勤的基础上，设置300为最佳</div>
                                        </div>
                                    </li>

                                </ul>
                            </div>
                        </div>
                    </div>

                    {readonly ?
                        <div className="modal-footer">
                            <button type="button" className="btn btn-default" onClick={closeModal}>关闭</button>
                        </div>
                        :
                        <div className="modal-footer" onMouseOver={() => { optionShow && this.setState({ optionShow: false }) }}>
                            <button type="button" className="btn btn-primary" onClick={this.handleSaveFunc.bind(this)}>
                                确定
                            </button>
                            <button type="button" className="btn btn-default" onClick={closeModal}>取消</button>
                        </div>
                    }

                </div>
            </div>
        )
    }

    changeDistance(val) {
        let newDistance = Math.abs(val)
        let edit = _.clone(this.state.edit)
        edit.distance = newDistance >= 0 ? newDistance : this.state.edit.distance
        this.setState({ edit }, () => {
            if (edit.hasOwnProperty('address_xy') && edit.address_xy[0] > 0) {
                this.addressEdit(edit, true)
            }
        })

    }

    setAddress(address) {
        let newEdit = this.state.edit
        newEdit.address = address
        this.setState({ edit: newEdit })
    }

    setPoint(xy, address, e) {
        let edit = _.clone(this.state.edit)
        if (!this.props.readonly) {
            let data = {}
            if (xy) edit.address_xy = xy
            if (address) edit.address = address
            //$('#pt').html((point.lng > 0 ? "东经" : "西经") + point.lng + ", " + (point.lat > 0 ? "北纬" : "南纬") + point.lat);
            //更新标注点
            this.setState({ edit: edit, optionShow: false }, () => {
                this.addressEdit(edit, true)
            })

        }
    }
    checkMapLoading(func) {
        if (window.BMap) {
            func();
        } else {
            apiHelper.CreateBMap(function (response, status) {
                if (status == "success") {
                    func();
                } else {
                    apiHelper.error("载入地图失败请稍后重试");
                }
            });
        }
    }
    componentDidMount() {
        this.checkMapLoading(() => {
            // 百度地图API功能
            var map = new BMap.Map("allmap", { enableMapClick: false })
            var ac;
            map.disable3DBuilding();
            map.enableScrollWheelZoom();   //启用滚轮放大缩小，默认禁用
            map.enableContinuousZoom();    //启用地图惯性拖拽，默认禁用
            map.addControl(new BMap.ScaleControl());                       // 添加比例尺组件
            map.setMinZoom(3);
            map.setMaxZoom(19);//放大级别调整以显示更详尽的目标

            map.addControl(new BMap.OverviewMapControl());              //添加缩略地图组件
            map.addControl(new BMap.NavigationControl());               //添加平移缩放组件
            if (!this.props.readonly) {

                //map.addControl(new BMap.MapTypeControl());          //添加地图类型组件
                var showNullResult = this.showNullResult.bind(this);
                ac = new BMap.Autocomplete(    //建立一个自动完成的对象
                    {
                        "input": "suggestId",
                        "location": map,
                        "onSearchComplete": function (rs) {
                            rs.ur = _.dropRight(rs.ur, 5);
                            // if (rs.getNumPois() < 1) {
                            //     showNullResult()
                            // }
                        }
                    });

                var myValue = '';
                ac.setInputValue(this.initAddress);
                ac.addEventListener("onconfirm", function (e) {    //鼠标点击下拉列表后的事件
                    var _value = e.item.value;
                    myValue = _value.province + _value.city + _value.district + _value.street + _value.streetNumber + _value.business;
                    setAddress(_value.title || _value.address || myValue)
                    setPlace();
                });
                this.ac = ac;

                //建立本地搜索的数据对象
                this.localSearch = function localSearch(title) {
                    var localOptions = {
                        onSearchComplete: function (rs) {
                            var s = [];
                            for (var i = 0; i < rs.getCurrentNumPois(); i++) {
                                var poi = rs.getPoi(i)
                                s.push({ title: poi.title, address: poi.address, address_xy: [poi.point.lng, poi.point.lat] });
                            }

                            //默认选中第一个搜索结果
                            if (s.length > 0) {
                                setPoint(s[0].address_xy, s[0].title);
                            }
                        }
                    }
                    var local = new BMap.LocalSearch(map, localOptions);
                    local.search(title);
                    this.local = local;
                }
            }

            var setPoint = this.setPoint.bind(this)
            var setAddress = this.setAddress.bind(this)

            function setPlace() {
                map.clearOverlays();    //清除地图上所有覆盖物
                function myFun() {
                    var pois = local.getResults()
                    var pp = pois.getPoi(0);    //获取第一个智能搜索的结果
                    if (pp) {
                        var point = pp.point;
                        setPoint([point.lng, point.lat]);
                    }
                }

                var local = new BMap.LocalSearch(map, { //智能搜索
                    onSearchComplete: myFun
                });
                local.search(myValue);
            }


            function LocateCity(result) {
                let cityName = result.name
                map.setCenter(cityName)
            }

            var showLocate = function (e) {
                let pt = e.point
                let geoc = new BMap.Geocoder()
                geoc.getLocation(pt, function (rs) {
                    let acom = rs.addressComponents
                    let locate = acom.province + ", " + acom.city + ", " + acom.district + ", " + acom.street + ", " + acom.streetNumber;
                    ac.setInputValue(locate);
                    //$("#suggestId").val(locate);
                    setPoint([pt.lng, pt.lat], locate)
                    //store.set("lastpoint", pt) //缓存最后一次选取的坐标
                })

            }



            this.map = map
            this.showLocate = showLocate
            this.LocateCity = LocateCity
            //设置默认显示单击选中
            if (this.props.isNew) {
                this.address_add()
            } else {
                this.addressEdit()
            }
            this.map.addEventListener("click", this.showLocate)
        })
    }

    componentWillUnmount() {
        if (this.map && this.props.readonly !== true) {
            this.map.removeEventListener("click", this.showLocate)
        }
    }

    addressEdit(edit, update, e) {
        let { address_xy, distance } = this.state.edit
        if (edit) {
            address_xy = edit.address_xy
            distance = edit.distance
        }
        this.map.clearOverlays()//移除其它标注
        let point = new BMap.Point(address_xy[0], address_xy[1])

        let marker = new BMap.Marker(point);                     //创建标注
        this.map.addOverlay(marker);                             //将标注添加到地图中
        marker.setAnimation(BMAP_ANIMATION_BOUNCE);              //跳动的动画
        let circle = new BMap.Circle(point, distance)
        this.map.addOverlay(circle);   //增加圆形区域范围

        if (update) {
            this.map.panTo(point);
        } else {
            this.map.centerAndZoom(point, this.map.getZoom() > mapZoomSize ? this.map.getZoom() : mapZoomSize)
        }
    }

    address_add(e) {
        var lastpoint = store.get("lastpoint")
        let map = this.map
        let LocateCity = this.LocateCity
        if (false && lastpoint) {
            //此处，暂时弃用新建时选点最后一次单击的位置
            map.centerAndZoom(new BMap.Point(lastpoint.lng, lastpoint.lat), mapZoomSize)
        } else {
            var point = new BMap.Point(116.331398, 39.897445);//默认在北京
            map.centerAndZoom(point, mapZoomSize);
            var myCity = new BMap.LocalCity();
            myCity.get((r) => {
                var cityName = r.name
                if (cityName) {
                    map.setCenter(cityName)
                }
            })

        }
    }

}

AddressEdit.propTypes = {
    edit: PropTypes.object.isRequired,
    isNew: PropTypes.bool.isRequired, //是否新增
    readonly: PropTypes.bool.isRequired, //是否查看模式
    closeModal: PropTypes.func.isRequired,
    saveFunc: PropTypes.func.isRequired //保存考勤地点设置
};
export default AddressEdit;