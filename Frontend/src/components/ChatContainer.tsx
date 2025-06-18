import React, { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";

// Message type
interface Message {
  _id?: string;
  senderId: string;
  text?: string;
  image?: string;
  createdAt: string;
}

// AuthUser with profilePic
interface AuthUser {
  _id: string;
  fullName: string;
  email: string;
  profilePic?: string;
}

// Selected user type (adjust as needed)
interface User {
  _id: string;
  fullName: string;
  profilePic?: string;
}

const ChatContainer: React.FC = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  // Cast selectedUser to User | null to get typings
  const user = selectedUser as User | null;

  const { authUser } = useAuthStore();
  const auth = authUser as AuthUser | null;

  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user?._id) return;

    getMessages(user._id);
    subscribeToMessages();

    return () => {
      unsubscribeFromMessages();
    };
  }, [user?._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 mt-8">Start a conversation...</p>
        ) : (
          messages.map((message: Message, index: number) => (
            <div
              key={message._id || index}
              className={`chat ${
                auth && message.senderId === auth._id
                  ? "chat-end"
                  : message.senderId === "bot"
                  ? "chat-start"
                  : "chat-start"
              }`}
              ref={index === messages.length - 1 ? messageEndRef : null}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      auth && message.senderId === auth._id
                        ? auth.profilePic || "/avatar.png"
                        : message.senderId === "bot"
                        ? "/bot-avatar.png"
                        : user?.profilePic || "/avatar.png"
                    }
                    alt="profile"
                  />
                </div>
              </div>

              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>

              <div className="chat-bubble flex flex-col">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {message.text && <p>{message.text}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
