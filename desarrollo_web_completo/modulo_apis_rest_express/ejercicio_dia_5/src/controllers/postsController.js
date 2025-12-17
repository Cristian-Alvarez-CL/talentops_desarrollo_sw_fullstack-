const DataModel = require('../models/DataModel');
const Post = new DataModel('posts');

exports.getPosts = async (req, res) => {
  try {
    let posts = await Post.getAll();
    const { q, category, sort } = req.query;

    // 1. Búsqueda Avanzada "Elasticsearch-like"
    if (q) {
      const searchTerms = q.toLowerCase().split(' ');
      posts = posts.filter(post => {
        const searchText = `${post.titulo} ${post.contenido} ${post.tags ? post.tags.join(' ') : ''}`.toLowerCase();
        return searchTerms.some(term => searchText.includes(term));
      });
    }

    // 2. Filtro por Categoría
    if (category) {
      posts = posts.filter(p => p.categoria === category);
    }

    // 3. Ordenamiento
    if (sort === 'popular') {
      posts.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    } else {
      posts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Error interno al obtener posts' });
  }
};

exports.votePost = async (req, res) => {
  try {
    const posts = await Post.getAll();
    const post = posts.find(p => p.id === req.params.id);
    
    if (!post) return res.status(404).json({ error: 'Post no encontrado' });

    post.votes = (post.votes || 0) + 1;
    await Post.saveAll(posts);
    
    res.json({ success: true, votes: post.votes });
  } catch (error) {
    res.status(500).json({ error: 'Error al votar' });
  }
};