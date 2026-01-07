const { body, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ errors: errors.array() });
  };
};

const registerValidation = validate([
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
]);

const loginValidation = validate([
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es requerida')
]);

const productValidation = validate([
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('precio').isFloat({ min: 0 }).withMessage('El precio debe ser mayor a 0'),
  body('stock').isInt({ min: 0 }).withMessage('El stock debe ser mayor o igual a 0')
]);

const reviewValidation = validate([
  body('calificacion').isInt({ min: 1, max: 5 }).withMessage('La calificación debe estar entre 1 y 5'),
  body('comentario').optional().isLength({ max: 500 }).withMessage('El comentario no puede exceder 500 caracteres')
]);

module.exports = {
  registerValidation,
  loginValidation,
  productValidation,
  reviewValidation
};