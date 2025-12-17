const express = require('express');
const router = express.Router();
const commentsCtrl = require('../controllers/commentsController');
const auth = require('../middleware/auth');

router.post('/', commentsCtrl.createComment);

router.put('/:id/approve', auth(['admin']), commentsCtrl.approveComment);

router.post('/:id/vote', auth(['admin', 'autor', 'usuario']), commentsCtrl.voteComment);

module.exports = router;