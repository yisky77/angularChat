var mongoose = require('mongoose');

var HistorySchema = require('../schemas/history');
var History = mongoose.model('History', HistorySchema);

module.exports = History;

