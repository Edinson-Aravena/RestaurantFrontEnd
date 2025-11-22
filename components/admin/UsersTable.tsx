"use client";

import { User, UserRole, Address, UserHasRole, Role } from "@prisma/client";
import { useState } from "react";
import { deleteUserAction } from "@/actions/delete-user-action";
import { updateUserAction } from "@/actions/update-user-action";
import { toast } from "react-toastify";

type UserWithRelations = User & {
  roles: (UserHasRole & { role: Role })[];
  addresses: Address[];
  ordersAsClient: { id: bigint }[];
  ordersAsDelivery: { id: bigint }[];
};

type UsersTableProps = {
  users: UserWithRelations[];
};

const roleLabels: Record<UserRole, { label: string; color: string; icon: string }> = {
  ADMIN: { label: 'Administrador', color: 'bg-purple-100 text-purple-800', icon: '👑' },
  CHEF: { label: 'Chef', color: 'bg-orange-100 text-orange-800', icon: '👨‍🍳' },
  WAITER: { label: 'Garzón', color: 'bg-blue-100 text-blue-800', icon: '🍽️' },
  REPARTIDOR: { label: 'Repartidor', color: 'bg-green-100 text-green-800', icon: '🛵' },
  CLIENTE: { label: 'Cliente', color: 'bg-gray-100 text-gray-800', icon: '👤' },
  RESTAURANTE: { label: 'Restaurante', color: 'bg-amber-100 text-amber-800', icon: '🏪' }
};

export default function UsersTable({ users }: UsersTableProps) {
  const [editingUser, setEditingUser] = useState<UserWithRelations | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async (userId: bigint, username: string | null) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${username || 'Sin nombre'}"?`)) {
      return;
    }

    const result = await deleteUserAction(Number(userId));

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateUserAction(Number(editingUser.id), formData);

    if (result.success) {
      toast.success(result.message);
      setEditingUser(null);
    } else {
      toast.error(result.error);
    }

    setIsSubmitting(false);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Rol(es)
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Info Adicional
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => {
                const roleInfo = user.role ? roleLabels[user.role] : null;
                const mobileRoles = user.roles.map(r => r.role.name);
                const hasOrders = user.ordersAsClient.length > 0;
                const hasDeliveries = user.ordersAsDelivery.length > 0;
                
                return (
                  <tr key={Number(user.id)} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {user.username || user.email || 'Sin usuario'}
                        </div>
                        {user.name && (
                          <div className="text-sm text-gray-500">
                            {user.name} {user.lastname || ''}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        {user.email && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {user.email}
                          </div>
                        )}
                        {user.phone && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {roleInfo && (
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${roleInfo.color} w-fit`}>
                            <span>{roleInfo.icon}</span>
                            {roleInfo.label}
                          </span>
                        )}
                        {mobileRoles.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {mobileRoles.map((roleName, idx) => (
                              <span key={idx} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                {roleName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        {user.addresses.length > 0 && (
                          <span className="text-gray-600">
                            📍 {user.addresses.length} dirección(es)
                          </span>
                        )}
                        {hasOrders && (
                          <span className="text-blue-600">
                            🛒 {user.ordersAsClient.length} pedido(s)
                          </span>
                        )}
                        {hasDeliveries && (
                          <span className="text-green-600">
                            🛵 {user.ordersAsDelivery.length} entrega(s)
                          </span>
                        )}
                        <span className="text-gray-500">
                          Creado: {new Date(user.createdAt).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-semibold"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                      {user.id !== BigInt(1) && (
                        <button
                          onClick={() => handleDelete(user.id, user.username)}
                          className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-semibold"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de edición */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Editar Usuario</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  value={editingUser.username || editingUser.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingUser.name || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nueva contraseña (opcional)
                </label>
                <input
                  type="password"
                  name="newPassword"
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Dejar vacío para no cambiar"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Rol *
                </label>
                <select
                  name="role"
                  required
                  defaultValue={editingUser.role}
                  disabled={editingUser.id === BigInt(1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="WAITER">🍽️ Garzón - Restaurant</option>
                  <option value="CHEF">👨‍🍳 Chef - Órdenes</option>
                  <option value="REPARTIDOR">🛵 Repartidor - Entregas</option>
                  <option value="CLIENTE">👤 Cliente - App Móvil</option>
                  <option value="ADMIN">👑 Administrador - Acceso Total</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
