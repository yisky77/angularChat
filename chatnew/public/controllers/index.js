/*var Movie = require('../models/movie');
var Category = require('../models/category');
//首页
exports.index = function(req, res){
    console.log(req.session.user)
    Category
        .find({})
        .populate({path: 'movies', options: {limit: 5}})
        .exec(function(err, catetories){
             if (err) {
                        console.log(err);
                    }
        res.render('index', {title:'电影-首页', categories: categories});
        })
};*/
var Movie = require('../models/movie');
var Category = require('../models/category');
//首页
exports.index = function(req, res){
    // console.log(req.session.user);
    return res.json({'code':200,'info':req.session});
    // res.render('index', {title:'电影-首页', movies: movies});

    //调用movie.js里面的fetch方法
    // Movie.fetch(function (err, movies) {
    //     if (err) {
    //         console.log(err);
    //     }
    //     console.log('000')
    //     res.render('index', {title:'电影-首页', movies: movies});
    // });
};