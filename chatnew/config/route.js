var User = require('../public/controllers/user.js');
var Index = require('../public/controllers/index.js');
var History = require('../public/controllers/history.js');

module.exports = function(app){
    // 路由
    //预处理
    app.use(function(req, res,next){
        console.log(req)
        if(req && req.session.user){
            //console.log('含有session')
            var _user = req.session.user;
            app.locals.user = _user;//挂到locals上面，就是程序的本地变量，可以在页面访问到
        }
        next();
    })

    // 首页
    // app.get('/user/getinfo', Index.index);

    // 注册请求
    app.post('/user/regist', User.regist);
    // 登录请求
    app.post('/user/login', User.login);


    // 登录请求
    app.get('/user/logout', User.logout);

    app.get('/userlist', User.userlist);
    app.get('/history/getChatHistory', History.getChatHistory);
    app.post('/history/save', History.save);

}