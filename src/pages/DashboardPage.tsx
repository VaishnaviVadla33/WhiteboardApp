import { useAuth } from "../contexts/AuthContext";
import { useProjects } from "../hooks/useProjects";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { Plus, LogOut, FolderPlus } from "lucide-react";

export function DashboardPage() {
  const { user } = useAuth();
  const { projects, createProject } = useProjects(user?.uid ?? "");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!newName.trim() || !user) return;
    setLoading(true);
    try {
      await createProject(newName.trim(), user.uid, user.email ?? "");
      setNewName("");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header - Responsive */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Whiteboard</h1>
              <p className="text-sm md:text-base text-gray-300 mt-1">Welcome back, {user?.displayName || user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition font-medium w-full sm:w-auto justify-center"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content - Responsive */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Create Project Section */}
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-8 mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FolderPlus size={24} className="text-blue-600" />
            <span className="hidden sm:inline">Create New Project</span>
            <span className="sm:hidden">New Project</span>
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <input
              type="text"
              placeholder="Enter project name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCreate()}
              className="flex-1 px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm md:text-base"
            />
            <button
              onClick={handleCreate}
              disabled={loading || !newName.trim()}
              className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm md:text-base"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">{loading ? "Creating..." : "Create"}</span>
              <span className="sm:hidden">{loading ? "..." : "Create"}</span>
            </button>
          </div>
        </div>

        {/* Projects Grid - Responsive */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Your Projects ({projects.length})</h2>
          {projects.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-8 md:p-12 text-center">
              <FolderPlus size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-base md:text-lg">No projects yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/project/${p.id}`)}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden border border-gray-100 group"
                >
                  <div className="h-24 bg-gradient-to-r from-blue-400 to-indigo-600 group-hover:scale-105 transition-transform" />
                  <div className="p-4 md:p-6">
                    <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 truncate">{p.name}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-xs md:text-sm text-gray-500">
                        {p.memberIds.length} member{p.memberIds.length !== 1 ? "s" : ""}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/project/${p.id}`);
                        }}
                        className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-200 transition"
                      >
                        Open →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}