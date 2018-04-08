var History = require('../models/history');

// commet
exports.save = function (req, res) {
    var _comment = req.body;
    console.log(_comment);
    // var movieId = _comment.movie;
    //判断，如果是回复给回复
    if(_comment.cid){
        Comment.findById(_comment.cid, function(err, comment){
            // console.log('有回复');
            // console.log('评论给：'+comment.reply);
            // var reply = {
            //     from: _comment.from,
            //     to: _comment.tid,
            //     content: _comment.content
            // }//将input里面的数据读出来，加入replay数组
            // comment.reply.push(reply);
            comment.save(function(err, comment){
                if (err) {
                    console.log(err);
                }
                res.json({code:'200',info:comment})
            })
        })
    }
    else{
        var comment = new History(_comment);
        comment.save(function (err, comment) {
            console.log('评论来自：'+comment.from);
            if (err) {
                console.log(err);
            }
            res.json({code:'200',info:comment})
        })
    }
}

exports.getChatHistory = function (req, res) {
    console.log(req.session);
    History.fetch(function (err, users) {
        if (err) {
            console.log(err);
        }
        res.json({'code':200,data:req.session,'info':users})
        // res.render('userlist', {title:'电影-用户列表', users: users});
    });
};
