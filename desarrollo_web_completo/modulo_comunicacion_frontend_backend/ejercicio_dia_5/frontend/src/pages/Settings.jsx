import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, User, Lock, Bell, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/auth.service';
import {
  Card,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Avatar,
} from '../components/ui';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z.string().email('Email invalido'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contrasena actual es requerida'),
    newPassword: z
      .string()
      .min(8, 'La nueva contrasena debe tener al menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Debe contener mayuscula, minuscula y numero'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmPassword'],
  });

export const Settings = () => {
  const { user, updateUser, updateAvatar } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef(null);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleProfileSubmit = async (data) => {
    await updateUser(data);
  };

  const handlePasswordSubmit = async (data) => {
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Contrasena actualizada');
      passwordForm.reset();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cambiar contrasena');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await updateAvatar(file);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Seguridad', icon: Lock },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Configuracion</h1>
        <p className="text-secondary-500 mt-1">
          Administra tu cuenta y preferencias
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-secondary-600 hover:bg-secondary-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <CardTitle>Informacion del perfil</CardTitle>
              <CardDescription>
                Actualiza tu informacion personal
              </CardDescription>

              <div className="mt-6 space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar
                      src={user?.avatar}
                      name={user?.name}
                      size="2xl"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900">
                      Foto de perfil
                    </p>
                    <p className="text-sm text-secondary-500">
                      JPG, PNG o GIF. Maximo 5MB
                    </p>
                  </div>
                </div>

                {/* Form */}
                <form
                  onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
                  className="space-y-4"
                >
                  <Input
                    label="Nombre completo"
                    error={profileForm.formState.errors.name?.message}
                    {...profileForm.register('name')}
                  />

                  <Input
                    label="Email"
                    type="email"
                    error={profileForm.formState.errors.email?.message}
                    {...profileForm.register('email')}
                  />

                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      loading={profileForm.formState.isSubmitting}
                    >
                      Guardar cambios
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card>
              <CardTitle>Seguridad</CardTitle>
              <CardDescription>
                Administra tu contrasena y configuracion de seguridad
              </CardDescription>

              <form
                onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
                className="mt-6 space-y-4"
              >
                <Input
                  label="Contrasena actual"
                  type="password"
                  error={passwordForm.formState.errors.currentPassword?.message}
                  {...passwordForm.register('currentPassword')}
                />

                <Input
                  label="Nueva contrasena"
                  type="password"
                  error={passwordForm.formState.errors.newPassword?.message}
                  {...passwordForm.register('newPassword')}
                />

                <Input
                  label="Confirmar nueva contrasena"
                  type="password"
                  error={passwordForm.formState.errors.confirmPassword?.message}
                  {...passwordForm.register('confirmPassword')}
                />

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    loading={passwordForm.formState.isSubmitting}
                  >
                    Cambiar contrasena
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>
                Configura como quieres recibir notificaciones
              </CardDescription>

              <div className="mt-6 space-y-4">
                {[
                  {
                    title: 'Notificaciones por email',
                    description: 'Recibe actualizaciones en tu correo',
                  },
                  {
                    title: 'Tareas asignadas',
                    description: 'Cuando te asignen una nueva tarea',
                  },
                  {
                    title: 'Menciones',
                    description: 'Cuando alguien te mencione en un comentario',
                  },
                  {
                    title: 'Recordatorios',
                    description: 'Recordatorios de fechas limite',
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-4 border-b border-secondary-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-secondary-900">
                        {item.title}
                      </p>
                      <p className="text-sm text-secondary-500">
                        {item.description}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
