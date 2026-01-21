import { renderHook, act } from '@testing-library/react';
import { useTodos } from '../src/hooks/useTodos';

describe('useTodos Hook', () => {
  test('debe inicializarse con una lista vacía', () => {
    const { result } = renderHook(() => useTodos());
    expect(result.current.todos).toEqual([]);
  });

  test('debe agregar una nueva tarea', () => {
    const { result } = renderHook(() => useTodos());
    act(() => {
      result.current.addTodo('Aprender Testing');
    });
    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].text).toBe('Aprender Testing');
  });

  test('debe alternar el estado de completado', () => {
    const { result } = renderHook(() => useTodos());
    act(() => {
      result.current.addTodo('Tarea 1');
    });
    const id = result.current.todos[0].id;
    act(() => {
      result.current.toggleTodo(id);
    });
    expect(result.current.todos[0].completed).toBe(true);
  });
});