import Logo from "../ui/Logo"
import AdminRoute from "./AdminRoute"
import { logoutAction } from "@/actions/login-action"

const adminNavigation = [
    {url: '/admin/dashboard', text: 'Dashboard', blank: false, icon: '📈'},
    {url: '/admin/assistant', text: 'AraucarIA', blank: false, icon: '🤖'},
    {url: '/admin/orders/delivery', text: 'Órdenes Delivery', blank: false, icon: '🛵'},
    {url: '/admin/orders/history', text: 'Historial', blank: false, icon: '📊'},
    {url: '/admin/products', text: 'Productos', blank: false, icon: '🍽️'},
    {url: '/admin/users', text: 'Usuarios', blank: false, icon: '👥'},
    {url: '/order/almuerzos', text: 'Ver Restaurant', blank: true, icon: '🏪'},
]

export default function AdminSidebar() {

    return (
        <div className="h-full flex flex-col bg-slate-900 text-white">
            {/* Header con Logo */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 shadow-md border-b border-slate-700">
                <div className="flex items-center justify-between">
                    <Logo />
                    <span className="text-xs text-slate-400">Admin Panel</span>
                </div>
            </div>

            {/* Información del Admin */}
            <div className="px-6 py-6 border-b border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow">
                        👨‍💼
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-semibold text-lg">Panel Admin</p>
                        <p className="text-slate-400 text-sm">Gestión del sistema</p>
                    </div>
                    <form action={logoutAction}>
                        <button className="text-slate-300 text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded transition-colors">
                            Cerrar Sesión
                        </button>
                    </form>
                </div>
            </div>

            {/* Navegación */}
            <div className="flex-1 px-4 py-6 overflow-y-auto">
                <p className="uppercase font-bold text-xs text-slate-400 mb-4 px-2 tracking-wider">
                    Navegación
                </p>
                <nav className="flex flex-col gap-2">
                    {adminNavigation.map(link => (
                        <AdminRoute
                            key={link.url}
                            link={link}
                        />
                    ))}
                </nav>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-xs">
                        © 2024 Sistema de Gestión
                    </p>
                    <div className="text-slate-400 text-xs">
                        v1.0.0
                    </div>
                </div>
            </div>
        </div>
    )
}