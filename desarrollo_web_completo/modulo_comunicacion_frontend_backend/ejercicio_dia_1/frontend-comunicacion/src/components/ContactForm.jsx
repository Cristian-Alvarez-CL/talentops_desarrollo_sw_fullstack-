import React, { useState } from 'react';
import api from '../services/api';
import useHttp from '../hooks/useHttp';

const ContactForm = () => {
  const { loading, error, success, sendRequest, resetStates } = useHttp();
  const [formData, setFormData] = useState({ email: '', message: '' });
  const [validationError, setValidationError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (success || error) resetStates();
    if (validationError) setValidationError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.includes('@')) {
      setValidationError('Por favor ingresa un email válido.');
      return;
    }

    try {
      await sendRequest(() => api.post('/contact', formData));
      setFormData({ email: '', message: '' });
    } catch (err) {
      console.error("Error en envío:", err);
    }
  };

  return (
    <div className="card">
      <h3>Contacto</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Tu Correo"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
        />
        <textarea
          name="message"
          placeholder="Mensaje"
          value={formData.message}
          onChange={handleChange}
          disabled={loading}
        />

        {validationError && <div className="message-error">{validationError}</div>}
        {error && <div className="message-error">Error: {error}</div>}
        {success && <div className="message-success">¡Mensaje enviado con éxito!</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar Mensaje'}
        </button>
      </form>
    </div>
  );
};

export default ContactForm;