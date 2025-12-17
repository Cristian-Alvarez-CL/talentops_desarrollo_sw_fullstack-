const DataModel = require('../models/DataModel');
const Post = new DataModel('posts');
const Comment = new DataModel('comments');

exports.getStats = async (req, res) => {
  const posts = await Post.getAll();
  const comments = await Comment.getAll();

  const stats = {
    totalPosts: posts.length,
    totalVotes: posts.reduce((sum, p) => sum + (p.votes || 0), 0),
    commentsPending: comments.filter(c => c.status === 'pending').length,
    postsByCategory: posts.reduce((acc, p) => {
      acc[p.categoria] = (acc[p.categoria] || 0) + 1;
      return acc;
    }, {})
  };

  res.json(stats);
};