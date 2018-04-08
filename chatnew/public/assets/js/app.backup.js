
var app=angular.module("chatRoom",[]);

app.factory('socket', function($rootScope) {
    var socket = io(); //默认连接部署网站的服务器
    return {
        on: function(eventName, callback) {
            socket.on(eventName, function() {
                var args = arguments;
                $rootScope.$apply(function() {   //手动执行脏检查
                    callback.apply(socket, args);
                });
            });
        },
        emit: function(eventName, data, callback) {
            socket.emit(eventName, data, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    if(callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
});

app.factory('randomColor', function($rootScope) {
    return {
        newColor: function() {
            return '#'+('00000'+(Math.random()*0x1000000<<0).toString(16)).slice(-6);
        }
    };
});

app.factory('userService', function($rootScope) {
    return {
        get: function(users,username) {
            if(users instanceof Array){
                for(var i=0;i<users.length;i++){
                    if(users[i].username===username){
                        return users[i];
                    }
                }
            }else{
                return null;
            }
        }
    };
});

app.controller("chatCtrl",['$scope','socket','$http','userService','$timeout',function($scope,socket,$http,userService,$timeout){
    var messageWrapper= $('.message-wrapper');
    $scope.hasLogined=false;
    $scope.receiver="";//默认是群聊
    $scope.publicMessages=[];//群聊消息
    $scope.privateMessages={};//私信消息
    $scope.messages=$scope.publicMessages;//默认显示群聊
    $scope.users=[];
    var index = parseInt(Math.random()*50);
    $scope.imgsrc = '/assets/images/'+index+'.png';
    $scope.create = {};
    $scope.reg = {};
    $scope.create1 = {};
    $scope.create.loginpage = true;
    $scope.create.registpage = false;
    $scope.create.showlogin = false;
    $scope.islogin = true;
    $scope.headerimgsel = [];
    $scope.facedata = [];
    for(var i =0;i<100;i++){
        $scope.headerimgsel[i] = i;
        if(i<72){
            $scope.facedata[i] = i;
        }
    }
    $scope.selimg = function (item) {
        $scope.imgsrc = '/assets/images/'+item+'.png';
        $scope.create.showheader = false;
    }
    // session
    // 群聊历史记录
    $scope.getChatHistory = function () {
        $http.get("/history/getChatHistory").success(function(result) {
            // console.log(result);
            $scope.ChatHistory= [];
            if(result.code = '200'){
                $scope.ChatHistory = result.info.reverse();
                // localStorage.setItem('history',JSON.stringify($scope.ChatHistory));
                $timeout(function(){$scope.scrollToBottom();},100)
                if(result.data.user){
                    $scope.user = result.data.user;
                }
            }
            if($scope.user){
                console.log($scope.user);
                $scope.islogin = false;
                sessionStorage.setItem('username',$scope.user.username)
                socket.emit("addUser",$scope.user);
            }else{
                console.log('ssf');
                var name = '游客';
                sessionStorage.setItem('username',name)
                socket.emit("addUser",{username:name,imgsrc:$scope.imgsrc});
            }
        });
    }
    $scope.getChatHistory();
    $scope.login=function(){   //登录进入聊天室
        $scope.userExisted = false;
        if($scope.create1.username == undefined || $scope.create1.username == ''){
            $scope.userExisted = true;
            $scope.alertinfo = '请输入正确的账号和密码！';
            return false;
        }
        $http.post("/user/login",{
            username:$scope.create1.username,
            password:$scope.create1.password
        }).success(function(result) {
            $scope.user = {};
            if(result.code == 200){
                $scope.create.loginpage = $scope.create.registpage = $scope.create.showlogin =  false;
                $scope.user.username = $scope.create1.username;
                $scope.user.imgsrc = $scope.create1.imgsrc
                $scope.islogin = false;
                location.reload();
            }else if(result.code == 500){
                $scope.userExisted = true;
                $scope.alertinfo = result.info;
            }
            $scope.create1 = {};
        });
    }

    $scope.regist = function(){   //登录进入聊天室
        $scope.userregExisted = false;
        if($scope.reg.username == undefined || $scope.reg.password == '' || $scope.reg.username.length<3){
            $scope.userregExisted = true;
            $scope.alertinfo = '请输入账号和密码！';
            return false;
        }
        $http.post("/user/regist",{
            username:$scope.reg.username,
            password:$scope.reg.password,
            imgsrc:$scope.imgsrc
            // ,role:21
        }).success(function(result) {
            if(result.code == 200){
                $scope.create1 = {};
                $scope.create.loginpage = true;
                $scope.create.registpage = false;
                $scope.create.showlogin = true;
                // var data = JSON.stringify($scope.reg);
                // sessionStorage.setItem('userinfo',data);
                // location.reload();
                $scope.userExisted = true;
                $scope.alertinfo = result.info;
            }else if(result.code == 500){
                $scope.userregExisted = true;
                $scope.alertinfo = result.info;
            }
        });
    }
    // 退出登录
    $scope.logout = function () {
        $http.get("/user/logout").success(function(result) {
            if(result.code == 200){
                sessionStorage.removeItem('username');
                location.reload();
            }else if(result.code == 500){
                alert(result.info);
            }
        });
    }

    $scope.scrollToBottom=function(){
        messageWrapper.scrollTop(messageWrapper[0].scrollHeight);
    }
    // 发送消息
    $scope.postMessage=function(item,flag){
        console.log($scope.receiver)
        // 如果没有登录就登录后再发送
        if(!$scope.user){
            $scope.create.showlogin = true;
            $scope.create.loginpage = true;
            return false;
        }
        // else if($scope.user.role < 10 && $scope.receiver != '' && $scope.receiver != '群聊'){
        //     return false;
        // }
        // else if($scope.user.username == $scope.receiver){
        //     alert('自己不能和自己聊天！');
        //     return false;
        // }
        var textarea = document.getElementById("SendMessageContent");
        if(flag){
            // infotxt = "<img src='/assets/images/face/"+item+".gif' />";
            $scope.words = textarea.innerHTML+="<img src='/assets/images/face/"+item+".gif' />";
            return false;
        }
            // var textarea = document.getElementById("SendMessageContent")
            $scope.words = textarea.innerHTML.replace(/\"/g, "");
            if($scope.words == undefined || $scope.words == '')return false;

            // var infotxt = $scope.words.replace(/\r\n/g,"<br>");
            // infotxt = infotxt.replace(/\n/g,"<br>");
            // infotxt =  infotxt.replace(/\s/g,"&nbsp;");
            // console.log(infotxt);
        var msg={text:$scope.words,type:"normal",imgsrc:$scope.user.imgsrc,from:$scope.user.username,to:$scope.receiver};
        var rec=$scope.receiver;
        console.log(msg);
        if(rec){  //私信
           if(!$scope.privateMessages[rec]){
               $scope.privateMessages[rec]=[];
           }
            $scope.privateMessages[rec].push(msg);
        }else{ //群聊
            $scope.publicMessages.push(msg);
            var data = {
                from:$scope.user.username,
                to:'',
                imgsrc:$scope.user.imgsrc,
                time:Date.now(),
                text:$scope.words,
                type:'normal'

            }
            console.log(data);
            // 保存历史记录
            $http.post("/history/save",data).success(function(result) {
                if(result.code == 500){
                    console.log(result.info);
                }
            });
        }
        $scope.words="";
        if(rec!==$scope.user.username) { //排除给自己发的情况
            socket.emit("addMessage", msg);
            $('#SendMessageContent').html('');
            $timeout(function(){$scope.scrollToBottom();},100)
        }
    }
    $scope.setReceiver=function(receiver,index){
        console.log(receiver)
        // 如果不是管理员，禁止私聊
        // if($scope.user.role < 10){
        //     return false;
        // }else
        $scope.create.currentindex = index;
        $scope.receiver = receiver;
        if(receiver != '群聊'){ //私信用户
            if(!$scope.privateMessages[receiver]){
                $scope.privateMessages[receiver]=[];
            }
            $scope.messages=$scope.privateMessages[receiver];
        }else{//广播
            $scope.messages=$scope.publicMessages;
        }
        var user=userService.get($scope.users,receiver);
        if(user){
            user.hasNewMessage=false;
        }
    }

    $scope.stopspeak = function (info) {
        console.log($scope.user.role);
        if($scope.user.role<10)return false;
        console.log('开始禁言');


    }

    // $scope.startspeak = function () {
    //     console.log('解禁')
    // }

    //收到登录结果
    socket.on('userAddingResult',function(data){
        if(data.result){
            $scope.userExisted=false;
            // $scope.hasLogined=true;
        }else{//昵称被占用
            $scope.userExisted=true;
        }
    });

    //接收到欢迎新用户消息
    socket.on('userAdded', function(data) {
        // if(!$scope.hasLogined) return;
        $scope.publicMessages.push({text:data.username,type:"welcome"});
        $scope.users.push(data);
    });

    //接收到在线用户消息
    socket.on('allUser', function(data) {
        // if(!$scope.hasLogined) return;
        $scope.users=data;
    });

    //接收到用户退出消息
    socket.on('userRemoved', function(data) {
        if(!$scope.hasLogined) return;
        $scope.publicMessages.push({text:data.username,type:"bye"});
        for(var i=0;i<$scope.users.length;i++){
            if($scope.users[i].username==data.username){
                $scope.users.splice(i,1);
                return;
            }
        }
    });

    //接收到新消息
    socket.on('messageAdded', function(data) {
        console.log(data)
        if(!$scope.hasLogined) return;
        if(data.to){ //私信
            if(!$scope.privateMessages[data.from]){
                $scope.privateMessages[data.from]=[];
            }
            $scope.privateMessages[data.from].push(data);
        }else{//群发
            $scope.publicMessages.push(data);
        }
        var fromUser=userService.get($scope.users,data.from);
        var toUser=userService.get($scope.users,data.to);
        if($scope.receiver!==data.to) {//与来信方不是正在聊天当中才提示新消息
            if (fromUser && toUser.username) {
                fromUser.hasNewMessage = true;//私信
            } else {
                toUser.hasNewMessage = true;//群发
            }
        }
    });



}]);

app.directive('message', ['$timeout',function() {
    return {
        restrict: 'E',
        templateUrl: 'message.html',
        scope:{
            info:"=",
            self:"=",
            scrolltothis:"&"
        },
        link:function(scope, elem){//console.log(scope);
            scope.time = new Date();
            scope.self = sessionStorage.getItem('username');
            // scope.info.text = '<span>sss</span>';
            console.log(scope.info.text);
            scope.stopspeakmessage = function (info) {
                console.log(scope.user.role);
                if(scope.user.role<10)return false;
                console.log(开始禁言);
            }
            // $timeout(function(){
            //     elem.find('img').attr('src',scope.info.imgsrc);
            // });
        }
    };
}])
    .directive('user', ['$timeout',function($timeout) {
        return {
            restrict: 'E',
            templateUrl: 'user.html',
            scope:{
                info:"=",
                iscurrentreceiver:"=",
                setreceiver:"&"
            },
            link:function(scope, elem, attrs,chatCtrl){//console.log('user')
                // $timeout(function(){
                //     elem.find('.avatar').css('src',scope.info.imgsrc);
                // });
            }
        };
    }]);
