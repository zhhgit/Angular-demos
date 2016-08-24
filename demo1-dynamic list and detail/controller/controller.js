var app = angular.module('bill',['ngRoute','ngSanitize']);

//路由
app.config(function($routeProvider){
    $routeProvider
        .when('/',{
            templateUrl: './view/billList.html'
        })
        .when('/detail/:billId',{
            templateUrl: './view/billDetail.html'
        })
        .otherwise({
            redirectTo:'/'
        });
});

//billList控制器
app.controller('billListCtrl', function($scope, HandleData, $http) {
    //请求参数
    var dataJson = {
        cityCd: "310000",
        orderType: "4",
        currentPage: "1",
        pageSize: "10",
        version: "1.0",
        source: "1"
    };
    //存储总页数
    var totalPage;

    //发送列表请求
    $http({
        method: 'GET',
        url: 'https://youhui.95516.com/wm-non-biz-web/restlet/payBill/allBillList',
        params: dataJson
    }).then(function successCallback(resp) {
        //success
        var newBillListData = resp.data.data;
        $scope.billListData = HandleData.preHandleList(newBillListData);
        totalPage = resp.data.totalPage;

    }, function errorCallback(response) {
        //error
    });

    //监听滚动并加载新数据
    window.addEventListener("scroll",loadNewData);
    function loadNewData() {
        //显示loadingMore
        if ($(window).scrollTop()!=0){
            $(".loadingMore").show();
        }
        //显示返回顶部按钮
        if($(window).scrollTop()>100){
            $(".backTopBox").show();
        }else{
            $(".backTopBox").hide();
        }
        //请求新一页数据
        if(HandleData.checkLoading()){
            var currentPage = parseInt(dataJson.currentPage)+1;
            dataJson.currentPage = currentPage;
            if (currentPage<=totalPage){
                $http({
                    method: 'GET',
                    url: 'https://youhui.95516.com/wm-non-biz-web/restlet/payBill/allBillList',
                    params: dataJson
                }).then(function successCallback(resp) {
                    //success
                    var newBillListData = resp.data.data;
                    $scope.billListData = $scope.billListData.concat(HandleData.preHandleList(newBillListData));
                }, function errorCallback(response) {
                    //error
                });
            }
        }
        //当完全加载后变化底部显示字
        if (currentPage==totalPage){
            $(".loadingMore").text("没有更多数据");
        }
    }

    //返回顶部
    $scope.backTop = function(){
        $(window).scrollTop(0);
    };

});

//billDetail控制器
app.controller('billDetailCtrl', function($scope, HandleData, $http, $routeParams) {

    //页面回到顶部
    document.body.scrollTop = 0;
    //链接参数
    $scope.params = $routeParams;

    //第一个请求
    $http({
        method: 'GET',
        url: 'https://youhui.95516.com/static/bill_' + $scope.params.billId +".json"
    }).then(function successCallback(resp) {
        //success回调
        var billData = HandleData.handleBillData(resp.data);

        //-----------------billItem------------------
        $scope.billItem = billData.billItemData;
        angular.extend($scope.billItem,{setBillPicPath: "https://youhui.95516.com/"+ $scope.billItem.billPicPath});
        angular.extend($scope.billItem,{setLeftNum: (parseInt($scope.billItem.leftNum)<0) ? "":((parseInt($scope.billItem.leftNum)==0) ? "已抢完":"剩余"+parseInt($scope.billItem.leftNum)+"张")})
        angular.extend($scope.billItem,{setSalePrice: (parseInt($scope.billItem.salePrice)==0) ? "免费获取" : "￥"+$scope.billItem.salePrice});
        angular.extend($scope.billItem,{setOriginPrice: (parseInt($scope.billItem.salePrice)==0) ? " ":"￥"+$scope.billItem.originPrice});
        angular.extend($scope.billItem,{setDownloadNum: $scope.billItem.downloadNum + "人获取"});

        //-----------------cardRequire------------------
        $scope.cardRequire = billData.cardRequireData;

        //-----------------userNotes------------------
        $scope.userNotes = billData.userNotesData;

        //-----------------clientService------------------
        $scope.clientService = billData.clientServiceData;

        //-----------------relatedCoupon------------------
        billData.relatedCouponData.billItemDataArray.shift();
        $scope.relatedCoupon = billData.relatedCouponData.billItemDataArray;

        //-----------------merchant------------------
        $scope.merchant = billData.merchantData;

        //-----------------comment------------------
        $scope.comment = billData.commentData.billCommentDataArray;
        for(i in billData.commentData.billCommentDataArray){
            angular.extend(billData.commentData.billCommentDataArray[i],{starClassArray:HandleData.calStar(billData.commentData.billCommentDataArray[i].avgPoint)});
        }

    }, function errorCallback(response) {
        //error回调
    });

    //第二个请求
    var billId= $scope.params.billId.split("_")[1];
    $http({
        method: 'GET',
        url: 'http://youhui.95516.com/wm-non-biz-web/restlet/bill/billBranchList',
        params:{
            billId:billId,
            cityCd: "310000",
            currentPage: "1",
            pageSize: "3",
            version: "1.0",
            source: "1"
        }
    }).then(function successCallback(resp) {
        //success回调
        var billBranchData = HandleData.handleBillBranchData(resp.data.data[0]);
        //-----------------nearPlace------------------
        $scope.nearPlace = billBranchData.nearPlaceData;

    }, function errorCallback(response) {
        //error回调
    });

});

//HandleData服务
app.service('HandleData', function(){
    //处理列表页数据
    this.preHandleList = function(billListData){
        for (i in billListData){
            billListData[i].setBillPicPath = "https://youhui.95516.com/"+ billListData[i].billPicPath;
            billListData[i].setLeftNum = (parseInt(billListData[i].leftNum)<0) ? "":((parseInt(billListData[i].leftNum)==0) ? "已抢完":"剩余"+parseInt(billListData[i].leftNum)+"张");
            billListData[i].setSalePrice = (parseInt(billListData[i].salePrice)==0) ? "免费获取" : "￥"+billListData[i].salePrice;
            billListData[i].setOriginPrice = (parseInt(billListData[i].salePrice)==0) ? " ":"￥"+billListData[i].originPrice;
            billListData[i].setDownloadNum = billListData[i].downloadNum + "人获取";
            billListData[i].setLink = "#/detail/" + billListData[i].brandId + "_" + billListData[i].billId + "_310000";
        }
        return billListData;
    };

    //处理详情页第一个请求数据
    this.handleBillData = function(billData) {
        if (billData["data-brand-bill-list"] != undefined){
            //data-brand-bill-list
            var billItemDataArray = billData["data-brand-bill-list"]["data"];
            var currentBillData;
            //data-brand-detail
            var billBrandData = billData["data-brand-detail"]["data"];
            //data-comments-list
            var billCommentDataArray = billData["data-comments-list"]["data"];

            //-----------------处理data-brand-bill-list-----------------
            if (Array.isArray(billItemDataArray) && billItemDataArray.length > 0) {
                currentBillData = billItemDataArray[0];
            }
            //billItem数据
            var billItemData = {
                "billPicPath":currentBillData.billPicPath,
                "brandNm":currentBillData.brandNm,
                "ticketNm":currentBillData.ticketNm,
                "leftNum":currentBillData.leftNum,
                "originPrice":currentBillData.originPrice,
                "salePrice":currentBillData.salePrice,
                "downloadNum":currentBillData.downloadNum
            };

            //cardRequire数据
            var cardRequireData = {
                "billRestrictDesc":currentBillData.billRestrictDesc
            };

            //userNotes数据
            var userNotesData = {
                "billBeginDtYear":currentBillData.billBeginDt.substring(0,4),
                "billBeginDtMouth":currentBillData.billBeginDt.substring(4,6),
                "billBeginDtDay":currentBillData.billBeginDt.substring(6,8),
                "billEndDtYear":currentBillData.billEndDt.substring(0,4),
                "billEndDtMouth":currentBillData.billEndDt.substring(4,6),
                "billEndDtDay":currentBillData.billEndDt.substring(6,8),
                "billRule":currentBillData.billRule,
                "userInstructions":currentBillData.userInstructions.replace(/；/g, "；<br />")
            };

            //clientService数据
            var clientServiceData = {
                "billId":currentBillData.billId
            };

            //relatedCoupon数据
            var relatedCouponData = {
                "billItemDataArray":billItemDataArray
            };

            //-----------------处理data-brand-detail-----------------

            //merchant数据
            var merchantData = {
                "brandDesc":billBrandData.brandDesc,
                "brandNm":billBrandData.brandNm
            };

            //-----------------处理data-comments-list-----------------
            //comment数据
            var commentData = {
                "billCommentDataArray":billCommentDataArray
            };

            return ({
                "billItemData":billItemData,
                "cardRequireData":cardRequireData,
                "userNotesData":userNotesData,
                "clientServiceData":clientServiceData,
                "relatedCouponData":relatedCouponData,
                "merchantData":merchantData,
                "commentData":commentData
            })
        }
    };

    //返回星星类型数组
    this.calStar = function(data) {
        var fullNum = Math.floor(data);
        var halfNum = (fullNum!=data)? 1:0;
        var emptyNum = 5-fullNum-halfNum;
        var starClassArray = [];
        for (var i=0;i<fullNum;i++){
            starClassArray.push("iconStarFull");
        }
        for (i=0;i<halfNum;i++){
            starClassArray.push("iconStarHalf");
        }
        for (i=0;i<emptyNum;i++){
            starClassArray.push("iconStarEmpty");
        }
        return starClassArray;
    };

    //处理第二个请求数据
    this.handleBillBranchData = function(billBranchData){
        if (billBranchData != undefined){
            //nearPlace数据
            var nearPlaceData = {
                "addr":billBranchData.addr,
                "phone":billBranchData.phone,
                "bussHour":billBranchData.bussHour,
                "name":billBranchData.name
            };

            return ({
                "nearPlaceData":nearPlaceData
            })
        }
    };

    //检查是否加载更多
    this.checkLoading = function () {
        if ($(window).scrollTop()==0){
            return false;
        }
        else if ($(window).scrollTop()+$(window).height()>=$(document).height()){
            return true;
        }
        else {
            return false;
        }
    };
});