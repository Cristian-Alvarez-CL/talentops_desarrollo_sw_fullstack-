const router = require('express').Router();
const postsCtrl = require('../controllers/postsController');
const auth = require('../middleware/auth');

router.get('/', postsCtrl.getPosts);
router.post('/:id/vote', auth(), postsCtrl.votePost);

module.exports = router;