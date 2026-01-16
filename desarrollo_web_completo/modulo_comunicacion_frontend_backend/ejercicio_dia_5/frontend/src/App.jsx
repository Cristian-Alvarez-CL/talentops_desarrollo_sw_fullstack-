import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { TaskProvider } from './context/TaskContext';
import { AppRoutes } from './routes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <TaskProvider>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1e293b',
                  color: '#fff',
                  borderRadius: '8px',
                },
                success: {
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </TaskProvider>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
