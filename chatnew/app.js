var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var port = process.env.PORT || 5555;
var logger = require('morgan');
//var cookieSession = require('cookie-session');
var session = require('express-session');
// 静态资源请求路径
var path = require('path');
var bodyParser= require('body-parser');
var MongoStore = require('connect-mongo')(session);//将session存入mongodb
// var MongoStore = require('connect-mongo')(express);
app.locals.moment = require('moment');//记录上传的时间

// 静态资源请求路径
// app.use(express.static(__dirname + '/app'));
app.use(express.static(__dirname + '/public'));


app.get('/', function (req, res) {
    res.sendfile('public/index.html');
});

// 链接mongodb（默认是不打开所以注释掉了，ps:需安装mongodb）
// var db = mongoose.connect("mongodb://127.0.0.1:27017/chat");
// db.connection.on("error", function (error) {
//     console.log("数据库连接失败：" + error);
// });
// db.connection.on("open", function () {
//     console.log("——数据库连接成功！——");
// });
// app.use(session({
//     secret: 'con',//密码
//     resave:false,//
//     saveUninitialized:true,
//     store: new MongoStore({
//         url: 'mongodb://127.0.0.1:27017/chat',
//         collection: 'session'
//     })
// }))

// 表单数据格式化
app.use(bodyParser());
app.use(require('connect-multiparty')());
// if('development' === app.get('env')){
//     app.set('showStackError', true);//打印出错误
//     app.use(logger(':method :url :status'));//请求的情况打印出来
//     app.locals.pretty = true;//看网页源码的时候是有格式的
//     mongoose.set('debug', true);//数据库打印出来
// }
require('./config/route')(app);

// app.get('/main', function (req, res) {
//     // res.render('app/main.html')
//     res.redirect("main");
// });
var applocals = {}
var connectedSockets={};
var allUsers=[{username:"群聊",imgsrc:'/assets/images/carbg.jpg'}];//初始值即包含"群聊",用""表示username
if(!applocals.online){
    applocals.online=[];
}
if(!applocals.offline){
    applocals.offline=[];
}
// 获取当前在线用户列表
app.use('/currentonline', function (req, res) {
    // console.log(applocals.online);
    res.send(applocals.online);
});

io.on('connection',function(socket){//console.log('2222')
         // 时刻发送离线消息
        io.emit('offlineMessage',applocals.offline);
        io.emit('allonline',applocals.online);
        // 获取最新的离线消息
        socket.on('offlinenewessage', function(data) {
            applocals.offline = data;
        })
        // 在线
        function flagonline(data) {
            for(var i = 0;i < applocals.online.length;i++){
                // 重复登录就删除该在线用户数据后面再添加
                if(applocals.online[i].id == data.id || applocals.online[i].username == data.username){
                    applocals.online.splice(i,1);
                    // return false;
                }
                // return true;
            }
        }
        // socket.on('addUser', function(data){
        //     var userlist = {
        //         socketId:socket.id,
        //         username:data.username?data.username:data.name,
        //         id:data.id,
        //         logintime:data.logintime?data.logintime:'未知',
        //         platforms:data.platforms?data.platforms:'PC浏览器',
        //         sign:data.sign?data.sign:'这个人很懒，没有签名！',
        //         avatar:data.avatar?data.avatar:'/images/avatar/default.jpg'
        //     }
        //     flagonline(data);
        //     applocals.online.push(userlist);
        //     // console.log(applocals.online)
        //     socket.broadcast.emit('addUser',userlist);
        // });

        socket.on('message', function(data){
            var name = data.to.username?data.to.username:data.to.name;
            data.mine.id = data.mine.username;
            // console.log(data)
            //如果用户在线
            var tempSocket=findOnline(name);

            if(tempSocket){
                io.emit('message', data);
                // tempSocket.socket.emit('message', data);
            }else{
                //存入离线消息
                applocals.offline.push(data);
                // console.log(applocals.offline.length);
                // io.emit('offlineMessage1',applocals.offline);
            }
        });

        socket.on('messageGroup', function(data){
            io.emit('messageGroup', data);
        });

        // socket.on('disconnect', function () {//console.log('32323')
        //     var result=findOnlineById(socket.id);
        //     var online=applocals.online;
        //     if(result){
        //         socket.broadcast.emit('offline', online[result.index]);
        //         online.splice(result.index,1);
        //     }
        // });

        socket.on('invisible', function (data) {
            socket.broadcast.emit('offline', data.username);
        });

        socket.on('uninvisible', function (data) {
            socket.broadcast.emit('online', {username:data.username});
        });

    socket.on('addUser',function(data){ //有新用户进入聊天室
        console.log('2222')
        if(connectedSockets[data.username]){//昵称已被占用
          socket.emit('userAddingResult',{result:false});
        }else{
            socket.emit('userAddingResult',{result:true});
            socket.username=data.username;
            connectedSockets[socket.username]=socket;//保存每个socket实例,发私信需要用
            allUsers.push(data);
            socket.broadcast.emit('userAdded',data);//广播欢迎新用户,除新用户外都可看到
            socket.emit('allUser',allUsers);//将所有在线用户发给新用户
        }

    });

    socket.on('addMessage',function(data){ //有用户发送新消息
        if(data.to){//发给特定用户
            connectedSockets[data.to].emit('messageAdded',data);
        }else{//群发
            socket.broadcast.emit('messageAdded',data);//广播消息,除原发送者外都可看到
        }


    });



    socket.on('disconnect', function () {  //有用户退出聊天室
            socket.broadcast.emit('userRemoved', {  //广播有用户退出
                username: socket.username
            });
            for(var i=0;i<allUsers.length;i++){
                if(allUsers[i].username==socket.username){
                    allUsers.splice(i,1);
                }
            }
            delete connectedSockets[socket.username]; //删除对应的socket实例

        }
    );
});
function getonlinenum() {
    return applocals.online;
}
function sendFile(username,content,to){
    var now=findOnline(to)
    if(now){
        now.socket.emit("message",{
            type:2,
            content:content,
            from:username,
            to:to
        })
    }
}

function findOnline(username){
    var online=applocals.online;
    for(var i=0;i<online.length;i++){
        if(online[i].username==username){
            return online[i];
        }
    }
    return false;
}

function findOnlineById(id){
    var online=applocals.online;
    for(var i=0;i<online.length;i++){
        if(online[i].socketId==id){
            return {
                index:i
            };
        }
    }
    return false;
}
http.listen(port, function () {
    console.log('listening on *:' + port);
});
