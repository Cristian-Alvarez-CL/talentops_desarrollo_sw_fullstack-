import React from 'react';
import ContactForm from './components/ContactForm';
import LikeButton from './components/LikeButton';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <h1 className="main-title">Fullstack Demo</h1>
      <section className="card">
        <h2>Sistema de Likes</h2>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
          Prueba la latencia de red y el estado de carga.
        </p>
        <LikeButton postId={1} initialLikes={42} />
      </section>
      <ContactForm />
    </div>
  );
}

export default App;