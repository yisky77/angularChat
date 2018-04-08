var User = require('../models/user.js');
//singup
exports.showSignup = function (req, res) {
        res.render('signup', {title:'注册页面'});
};
exports.showSignin = function (req, res) {
        res.render('signin', {title:'登陆界面'});
};
// 注册
exports.regist = function(req, res){
    var _user = req.body;//req.param('user')同样可以取到
    // console.log('111'+req.body);
    // console.log(_user);
    //用schemas中User的findOne方法，如果有已经存在的用户名，则跳转到登陆页面
    User.findOne({username: _user.username}, function(err, user){
        if(err) {console.log(err);}
        if(user){
            return res.json({'code':500,'info':'注册失败,该账号已存在！'});
        }
        else{
            var user = new User(_user);console.log(_user)
            user.save(function(err, user){console.log('333')
                if(err){
                    console.log(err);
                    res.json({'code':500,'info':'注册失败！'});
                }else{
                    console.log('注册成功')
                    res.json({'code':200,'info':'注册成功！可以去登录了！'});
                }
            // res.redirect('/');
            })
        }
    })
    
};

//登录
exports.login = function(req, res){
    var _user = req.body;
    // console.log(_user)
    var name = _user.username;
    // console.log('查找name:'+name);
    var password = _user.password;
    User.findOne({username:name}, function(err ,user){
        if(err){
            console.log(err);
        }
        console.log(user)
        if(!user){
            return res.json({'code':500,'info':'账号不存在'});
        }
        //调用User中的comparePassword方法
        user.comparePassword(password, function(err, isMatch){
            if (err){
                console.log(err);
            }
            if(isMatch){
                req.session.user = {
                    username:user.username,
                    imgsrc:user.imgsrc,
                    role:user.role
                };//如果密码匹配把user存入内存
                return res.json({'code':200,'info':'登录成功！'});
            }
            else{
                return res.json({'code':500,'info':'密码错误！'});
                // res.end('<h1>密码错误</h1>')
                // console.log('Password is not matched');
            }
        })
    })
}

//logout
exports.logout = function(req, res){console.log(req)
    delete req.session.user;
    //delete app.locals.user;
    // res.redirect('/');
    res.json({'code':200,'info':'退出成功！'})
}

//userlist
exports.userlist = function (req, res) {
    User.fetch(function (err, users) {
        if (err) {
            console.log(err);
        }
        res.json({'code':200,'info':users})
        // res.render('userlist', {title:'电影-用户列表', users: users});
    });
};

//midware for user
exports.signinRequired = function (req, res, next) {
    var user = req.session.user;
    if(!user){
        return res.redirect('/signin');
    }
    next()
};
exports.adminRequired = function (req, res, next) {
    var user = req.session.user;
    if(user.role<=10){
        return res.redirect('/signin');
    }
    next();
};