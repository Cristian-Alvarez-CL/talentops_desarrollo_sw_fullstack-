import React, { useState } from 'react';
import api from '../services/api';

const LikeButton = ({ postId, initialLikes }) => {
  const [likes, setLikes] = useState(initialLikes);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const handleLike = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    setError(null);

    try {
      const response = await api.post(`/posts/${postId}/like`);

      setLikes(response.data.likes);
    } catch (err) {
      console.error(err);
      setError('No se pudo actualizar el like. Intenta nuevamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="like-section">
      <button 
        onClick={handleLike} 
        disabled={isUpdating}
        style={{ 
          opacity: isUpdating ? 0.7 : 1,
          cursor: isUpdating ? 'not-allowed' : 'pointer'
        }}
      >
        {isUpdating ? '⏳ Guardando...' : `👍 Like (${likes})`}
      </button>
      
      {error && (
        <div style={{ color: 'red', fontSize: '0.85em', marginTop: '5px' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default LikeButton;