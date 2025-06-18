import React, { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";

interface User {
  _id: string;
  name?: string;
  fullName?: string;
  profilePic?: string;
  email?: string;
}


const Sidebar: React.FC = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // Filter users by online status if toggle is on
  const filteredUsers: User[] = showOnlineOnly
    ? users.filter((user: User) => onlineUsers.includes(user._id))
    : users as User[];

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      {/* Header */}
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>

        {/* Online Filter Toggle */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">({onlineUsers.length} online)</span>
        </div>
      </div>

      {/* User List */}
      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.length === 0 ? (
          <div className="text-center text-zinc-500 py-4">
            {showOnlineOnly ? "No online users" : "No users found"}
          </div>
        ) : (
          filteredUsers.map(user => (
            <button
              onClick={() => setSelectedUser({ 
                _id: user._id, 
                name: user.name || user.fullName || "Unknown User", 
                email: user.email || "" 
              })}
              className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${selectedUser?._id === user._id ? "bg-base-200" : ""}`}
            >
              {/* Avatar */}
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.name || "User"}
                  className="size-12 object-cover rounded-full"
                />
                {/* Online indicator */}
                <span
                  className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white ${
                    onlineUsers.includes(user._id) ? "bg-green-500" : "bg-zinc-400"
                  }`}
                ></span>
              </div>
              {/* User Info (only on lg screens) */}
              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{user.fullName || user.name || "Unknown User"}</div>
                <div className="text-sm text-zinc-400">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
