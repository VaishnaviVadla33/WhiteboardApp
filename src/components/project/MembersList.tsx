import { useState, useEffect } from "react";
import { useProjects } from "../../hooks/useProjects";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Search, Plus, Check, Trash2, X } from "lucide-react";

interface Props {
  projectId: string;
  currentUid: string;
  onClose?: () => void;
}

interface UserResult {
  uid: string;
  email: string;
  displayName: string;
}

export function MembersList({ projectId, currentUid, onClose }: Props) {
  const { projects, addMember, removeMember } = useProjects(currentUid);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [projectMembers, setProjectMembers] = useState<string[]>([]);
  const [memberUIDs, setMemberUIDs] = useState<{ [email: string]: string }>({});
  const [addedMembers, setAddedMembers] = useState<Set<string>>(new Set());
  const [removingMembers, setRemovingMembers] = useState<Set<string>>(new Set());

  const project = projects.find((p: any) => p.id === projectId);

  // Fetch current project members with their UIDs
  useEffect(() => {
    if (!project) return;
    const fetchMembers = async () => {
      const memberEmails = project.memberEmails || [];
      setProjectMembers(memberEmails);
      
      // Map emails to UIDs
      const uidMap: { [email: string]: string } = {};
      project.memberIds?.forEach((uid: string, idx: number) => {
        if (project.memberEmails?.[idx]) {
          uidMap[project.memberEmails[idx]] = uid;
        }
      });
      setMemberUIDs(uidMap);
    };
    fetchMembers();
  }, [project]);

  // Search for users
  const handleSearch = async (searchTerm: string) => {
    setSearchQuery(searchTerm);
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const snap = await getDocs(collection(db, "users"));
      const term = searchTerm.toLowerCase();
      const results: UserResult[] = [];

      snap.docs.forEach((d) => {
        const data = d.data();
        const emailMatch = data.email?.toLowerCase().includes(term);
        const nameMatch = data.displayName?.toLowerCase().includes(term);

        if (
          d.id !== currentUid &&
          !projectMembers.includes(data.email) &&
          (emailMatch || nameMatch)
        ) {
          results.push({
            uid: d.id,
            email: data.email,
            displayName: data.displayName || data.email,
          });
        }
      });

      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  // Add member to project
  const handleAddMember = async (memberUid: string, memberEmail: string) => {
    try {
      await addMember(projectId, memberUid, memberEmail);
      setAddedMembers(new Set([...addedMembers, memberUid]));
      setProjectMembers([...projectMembers, memberEmail]);
      setMemberUIDs({ ...memberUIDs, [memberEmail]: memberUid });
      // Remove from search results
      setSearchResults(searchResults.filter((u) => u.uid !== memberUid));

      setTimeout(() => {
        setAddedMembers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(memberUid);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error("Error adding member:", error);
    }
  };

  // Remove member from project
  const handleRemoveMember = async (email: string) => {
    const uid = memberUIDs[email];
    if (!uid) return;
    
    try {
      setRemovingMembers(new Set([...removingMembers, uid]));
      await removeMember(projectId, uid, email);
      setProjectMembers(projectMembers.filter((e) => e !== email));
      const newUIDs = { ...memberUIDs };
      delete newUIDs[email];
      setMemberUIDs(newUIDs);
    } catch (error) {
      console.error("Error removing member:", error);
    } finally {
      setRemovingMembers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(uid);
        return newSet;
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Sticky Search Header - Always visible */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-3 md:p-4 space-y-2 md:space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base md:text-lg text-gray-900">Team Members</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={20} className="text-gray-600" />
            </button>
          )}
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Search Results - Add Members Section */}
        {searchQuery && searchResults.length > 0 && (
          <div className="border-b border-gray-200 p-3 md:p-4 bg-blue-50">
            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Add Members</p>
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.uid}
                  className="flex items-center justify-between p-2 md:p-3 bg-white rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-base font-medium text-gray-900 truncate">{user.displayName}</p>
                    <p className="text-xs md:text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => handleAddMember(user.uid, user.email)}
                    disabled={addedMembers.has(user.uid)}
                    className={`ml-2 p-2 md:p-2.5 rounded-lg transition flex-shrink-0 ${
                      addedMembers.has(user.uid)
                        ? "bg-green-100 text-green-600"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    {addedMembers.has(user.uid) ? <Check size={18} /> : <Plus size={18} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Members List */}
        <div className="p-3 md:p-4">
          <p className="text-xs font-semibold text-gray-600 mb-3 uppercase">
            Members ({projectMembers.length})
          </p>
          {projectMembers.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500">No members yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projectMembers.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs md:text-sm font-bold flex-shrink-0">
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm md:text-base font-medium text-gray-900 truncate">{email}</p>
                    </div>
                  </div>

                  {/* Remove button - hide for owner */}
                  <button
                    onClick={() => handleRemoveMember(email)}
                    disabled={removingMembers.has(memberUIDs[email])}
                    className="p-2 md:p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove member"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Empty State - No search, no results */}
        {!searchQuery && searchResults.length === 0 && projectMembers.length === 0 && (
          <div className="flex items-center justify-center py-8 px-4 text-center">
            <div>
              <Search size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Search for members to add</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
