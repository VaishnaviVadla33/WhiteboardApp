import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useProjects } from "../hooks/useProjects";
import { WhiteboardCanvas } from "../components/whiteboard/WhiteboardCanvas";
import { MembersList } from "../components/project/MembersList";
import { ChevronLeft, Users } from "lucide-react";
import { useState, useEffect } from "react";

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { projects } = useProjects(user?.uid ?? "");
  const navigate = useNavigate();
  const [showMembers, setShowMembers] = useState(false);
  const [removedAlert, setRemovedAlert] = useState(false);

  if (!projectId || !user) return null;

  const project = projects.find((p: any) => p.id === projectId);

  // Check if user is still a member - if removed, redirect
  useEffect(() => {
    if (project && !project.memberIds.includes(user.uid)) {
      setRemovedAlert(true);
      // Redirect after 3 seconds
      const timer = setTimeout(() => {
        navigate("/");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [project, user.uid, navigate]);

  // If project not found, redirect
  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">Project not found</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // If user was removed, show alert
  if (removedAlert) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <p className="text-lg text-red-600 font-semibold mb-2">Access Denied</p>
          <p className="text-gray-600 mb-4">You have been removed from this project</p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header - Responsive */}
      <div className="h-16 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between px-4 md:px-6 shadow-lg">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 md:gap-2 hover:bg-gray-700 px-2 md:px-3 py-2 rounded-lg transition whitespace-nowrap"
          >
            <ChevronLeft size={20} />
            <span className="font-medium hidden sm:inline">Back</span>
          </button>

          <div className="border-l border-gray-600 pl-2 md:pl-4 min-w-0">
            <h1 className="text-lg md:text-xl font-bold truncate">
              {project?.name ?? projectId}
            </h1>
            <p className="text-xs md:text-sm text-gray-300 hidden sm:block">
              {project?.memberIds.length ?? 0} members
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="md:hidden flex items-center gap-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            <Users size={18} />
            <span className="text-sm">({project?.memberIds.length ?? 0})</span>
          </button>
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-300">
            <Users size={18} />
            <span className="truncate">{user.displayName ?? user.email}</span>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col md:flex-row gap-2 md:gap-4 p-2 md:p-4">
        {/* Mobile backdrop - click to close */}
        {showMembers && (
          <div
            className="absolute inset-0 md:hidden bg-black bg-opacity-30 z-40"
            onClick={() => setShowMembers(false)}
          />
        )}

        {/* Whiteboard Canvas */}
        <div className="flex-1 min-h-0 bg-white rounded-lg shadow-md overflow-hidden">
          <WhiteboardCanvas
            projectId={projectId}
            uid={user.uid}
            displayName={user.displayName ?? user.email ?? "User"}
          />
        </div>

        {/* Members Sidebar - Hidden on mobile, visible toggle */}
        <div className={`${
          showMembers ? "absolute inset-0 z-50 md:static" : "hidden md:flex"
        } md:w-80 bg-white rounded-lg shadow-md flex flex-col overflow-hidden`}>
          <MembersList
            projectId={projectId}
            currentUid={user.uid}
            onClose={() => setShowMembers(false)}
          />
        </div>
      </div>
    </div>
  );
}