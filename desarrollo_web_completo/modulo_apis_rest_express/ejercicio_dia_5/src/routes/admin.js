const router = require('express').Router();
const adminCtrl = require('../controllers/adminController');
const auth = require('../middleware/auth');

router.get('/stats', auth(['admin']), adminCtrl.getStats);

module.exports = router;