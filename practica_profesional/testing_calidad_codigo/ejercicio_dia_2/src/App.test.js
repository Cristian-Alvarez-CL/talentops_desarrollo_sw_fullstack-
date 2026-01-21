import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoApp from './components/TodoApp';
import { useTodos } from './hooks/useTodos';


describe('Unit Tests: useTodos Hook', () => {
  test('debe agregar una tarea correctamente', () => {
    const { result } = renderHook(() => useTodos());
    act(() => { result.current.addTodo('Test unitario'); });
    expect(result.current.todos[0].text).toBe('Test unitario');
  });

  test('debe eliminar una tarea por ID', () => {
    const { result } = renderHook(() => useTodos());
    act(() => { result.current.addTodo('Eliminarme'); });
    const id = result.current.todos[0].id;
    act(() => { result.current.deleteTodo(id); });
    expect(result.current.todos).toHaveLength(0);
  });
});


describe('Integration Tests: TodoApp', () => {
  
  test('flujo completo: agregar, completar y filtrar', async () => {
    render(<TodoApp />);
    const user = userEvent.setup();
    const input = screen.getByLabelText('nueva-tarea');
    const addBtn = screen.getByText('Agregar');

    // 1. Agregar tareas
    await user.type(input, 'Tarea 1');
    await user.click(addBtn);
    await user.type(input, 'Tarea 2');
    await user.click(addBtn);

    expect(screen.getByText('Tarea 1')).toBeInTheDocument();
    expect(screen.getByText('Tarea 2')).toBeInTheDocument();

    const task1 = screen.getByText('Tarea 1');
    await user.click(task1);
    expect(task1.parentElement).toHaveStyle('text-decoration: line-through');

    await user.click(screen.getByText('Pendientes'));
    expect(screen.queryByText('Tarea 1')).not.toBeInTheDocument();
    expect(screen.getByText('Tarea 2')).toBeInTheDocument();

    await user.click(screen.getByText('Completadas'));
    expect(screen.getByText('Tarea 1')).toBeInTheDocument();
    expect(screen.queryByText('Tarea 2')).not.toBeInTheDocument();
  });

  test('debe eliminar una tarea al pulsar el botón correspondiente', async () => {
    render(<TodoApp />);
    const user = userEvent.setup();
    const input = screen.getByLabelText('nueva-tarea');
    
    await user.type(input, 'Tarea a borrar');
    await user.click(screen.getByText('Agregar'));
    
    const deleteBtn = screen.getByLabelText('eliminar-Tarea a borrar');
    await user.click(deleteBtn);
    
    expect(screen.queryByText('Tarea a borrar')).not.toBeInTheDocument();
  });
});