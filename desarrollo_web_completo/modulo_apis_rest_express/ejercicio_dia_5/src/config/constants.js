module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'clave_secreta_blog_2025',
  
  ROLES: {
    ADMIN: 'admin',
    AUTHOR: 'autor',
    USER: 'usuario'
  },
  
  PAGINATION: {
    DEFAULT_LIMIT: 10
  }
};