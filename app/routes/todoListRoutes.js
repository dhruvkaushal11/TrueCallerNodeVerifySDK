'use strict';
module.exports = {
  PUBLIC_KEY_URL: 'https://api4.truecaller.com/v1/key'
};
module.exports = function (app) {
var todoList = require('../controllers/todoListController');

//admins side apis
app.route('/verifyToken')
    .post(todoList.verifyToken);


};  