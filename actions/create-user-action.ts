"use server";

import { revalidatePath } from "next/cache";
import { createUserApi } from "@/src/lib/api";

export async function createUserAction(formData: FormData) {
  try {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const lastname = formData.get('lastname') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const role = formData.get('role') as string;

    // Validaciones
    if (!username || !password || !role) {
      return {
        success: false,
        error: 'Usuario, contraseña y rol son requeridos'
      };
    }

    if (!name) {
      return {
        success: false,
        error: 'El nombre es requerido'
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      };
    }

    // Concatenar +56 al teléfono si existe
    const fullPhone = phone ? `+56${phone.replace(/\s/g, '')}` : undefined;

    // Llamar a la API del backend para crear el usuario
    const response = await createUserApi({
      username,
      email: email || undefined,
      name,
      lastname: lastname || undefined,
      phone: fullPhone,
      password,
      role
    });

    if (!response.success) {
      return {
        success: false,
        error: response.message || 'Error al crear el usuario'
      };
    }

    revalidatePath('/admin/users');
    
    return {
      success: true,
      message: 'Usuario creado exitosamente'
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: 'Error al crear el usuario'
    };
  }
}
