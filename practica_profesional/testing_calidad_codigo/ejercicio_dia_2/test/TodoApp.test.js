import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoApp from '../src/components/TodoApp';
import React from 'react';

describe('TodoApp Component', () => {
  
  test('debe mostrar error cuando el input está vacío', async () => {
    render(<TodoApp />);
    const user = userEvent.setup();
    const button = screen.getByText(/agregar/i);
    
    await user.click(button);
    
    expect(screen.getByText(/la tarea no puede estar vacía/i)).toBeInTheDocument();
  });

  test('debe agregar una tarea a la lista y limpiar el input', async () => {
    render(<TodoApp />);
    const user = userEvent.setup();
    const input = screen.getByPlaceholderText(/nueva tarea\.\.\./i);
    const button = screen.getByText(/agregar/i);

    await user.type(input, 'Comprar leche');
    await user.click(button);

    expect(screen.getByText('Comprar leche')).toBeInTheDocument();
    expect(input.value).toBe('');
  });

  test('debe eliminar una tarea', async () => {
    render(<TodoApp />);
    const user = userEvent.setup();
    const input = screen.getByPlaceholderText(/nueva tarea\.\.\./i);
    const addBtn = screen.getByText(/agregar/i);

    await user.type(input, 'Tarea a eliminar');
    await user.click(addBtn);

    const deleteButton = screen.getByLabelText(/eliminar-Tarea a eliminar/i);
    await user.click(deleteButton);

    expect(screen.queryByText('Tarea a eliminar')).not.toBeInTheDocument();
  });

  test('debe filtrar tareas completadas', async () => {
    render(<TodoApp />);
    const user = userEvent.setup();
    const input = screen.getByPlaceholderText(/nueva tarea\.\.\./i);
    const addBtn = screen.getByText(/agregar/i);

    await user.type(input, 'Tarea 1');
    await user.click(addBtn);

    const task = screen.getByText('Tarea 1');
    await user.click(task); // Completar tarea

    await user.click(screen.getByText(/completadas/i));
    expect(screen.getByText('Tarea 1')).toBeInTheDocument();

    await user.click(screen.getByText(/pendientes/i));
    expect(screen.queryByText('Tarea 1')).not.toBeInTheDocument();
  });
});