import React, { useState } from 'react';
import { useTodos } from '../hooks/useTodos';

const TodoApp = () => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState(''); // Estado para el error
  const { todos, setFilter, addTodo, toggleTodo, deleteTodo } = useTodos();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setError('La tarea no puede estar vacía');
      return;
    }
    addTodo(inputValue);
    setInputValue('');
    setError('');
  };

  return (
    <div className="todo-app">
      <h1>Lista de Tareas</h1>
      
      <form onSubmit={handleSubmit}>
        <input 
          aria-label="nueva-tarea"
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Nueva tarea..." 
        />
        <button type="submit">Agregar</button>
        {/* Este es el mensaje que el test no encontraba */}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>

      <div className="filters">
        <button onClick={() => setFilter('all')}>Todas</button>
        <button onClick={() => setFilter('active')}>Pendientes</button>
        <button onClick={() => setFilter('completed')}>Completadas</button>
      </div>

      <ul aria-label="lista-tareas">
        {todos.map(todo => (
          <li key={todo.id} style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
            <span onClick={() => toggleTodo(todo.id)} role="button">
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)} aria-label={`eliminar-${todo.text}`}>
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoApp;