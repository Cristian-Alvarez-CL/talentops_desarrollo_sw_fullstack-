const DataModel = require('../models/DataModel');
const Comment = new DataModel('comments');
const { sendEmail } = require('../utils/mailer');
const { v4: uuidv4 } = require('uuid'); // Asegúrate de instalar uuid: npm install uuid

exports.createComment = async (req, res) => {
  const { postId, content, userEmail } = req.body;
  
  if (!postId || !content || !userEmail) {
    return res.status(400).json({ error: 'Faltan datos (postId, content, userEmail)' });
  }

  const comments = await Comment.getAll();
  const newComment = {
    id: uuidv4(),
    postId,
    userEmail,
    content,
    status: 'pending',
    votes: 0,
    createdAt: new Date().toISOString()
  };

  comments.push(newComment);
  await Comment.saveAll(comments);

  res.status(201).json(newComment);
};

exports.approveComment = async (req, res) => {
  const comments = await Comment.getAll();
  const comment = comments.find(c => c.id === req.params.id);
  
  if (!comment) return res.status(404).json({ error: 'Comentario no encontrado' });

  comment.status = 'approved';
  await Comment.saveAll(comments);

  await sendEmail(comment.userEmail, 'Comentario Aprobado', 'Tu comentario ha sido publicado.');

  res.json({ message: 'Aprobado y notificado' });
};

exports.voteComment = async (req, res) => {
  const comments = await Comment.getAll();
  const comment = comments.find(c => c.id === req.params.id);

  if (!comment) return res.status(404).json({ error: 'Comentario no encontrado' });

  comment.votes = (comment.votes || 0) + 1;
  await Comment.saveAll(comments);

  res.json({ success: true, votes: comment.votes });
};