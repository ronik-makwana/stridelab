import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore.js";
import { logoutUser } from "../services/authApi.js";
import toast from "react-hot-toast";
import {
  MdDashboard,
  MdInventory,
  MdCollections,
  MdReceipt,
  MdPeople,
  MdAnalytics,
  MdStore,
  MdLogout,
  MdMenu,
} from "react-icons/md";

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    try {
      await logoutUser();
      useAuthStore.getState().setUser(null);
      navigate("/login");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: MdDashboard,
    },
    {
      name: "Products",
      path: "/admin/products",
      icon: MdInventory,
    },
    {
      name: "Collections",
      path: "/admin/collections",
      icon: MdCollections,
    },
    {
      name: "Orders",
      path: "/admin/orders",
      icon: MdReceipt,
    },
    {
      name: "Customers",
      path: "/admin/customers",
      icon: MdPeople,
    },
    {
      name: "Analytics",
      path: "/admin/analytics",
      icon: MdAnalytics,
    },
    {
      name: "View Store",
      path: "/",
      icon: MdStore,
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white border-r border-slate-200 transition-all duration-300 flex flex-col`}
      >
        {/* Logo/Header */}
        <div
          className={`h-16 border-b border-slate-200 flex items-center ${
            sidebarOpen ? "px-4" : "justify-center px-2"
          }`}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <MdMenu className="w-5 h-5 text-slate-600" />
          </button>
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-slate-900 ml-2">
              Admin Panel
            </h1>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              const IconComponent = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center ${
                      sidebarOpen ? "gap-3 px-4" : "justify-center px-2"
                    } py-3 rounded-lg transition-colors ${
                      active
                        ? "bg-slate-900 text-white!"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span
                      className={`shrink-0 ${active ? "text-white!" : "text-slate-600"}`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </span>
                    {sidebarOpen && (
                      <span
                        className={`font-medium ${active ? "text-white!" : ""}`}
                      >
                        {item.name}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-slate-200 p-4">
          {sidebarOpen && user && (
            <div className="mb-3 px-2">
              <p className="text-sm font-medium text-slate-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${
              sidebarOpen ? "gap-3 px-4" : "justify-center px-2"
            } py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors`}
          >
            <MdLogout className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
