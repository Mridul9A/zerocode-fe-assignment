import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import type { AuthUser } from "./useAuthStore";

export interface Message {
  _id?: string;
  senderId: string;
  text: string;
  createdAt: string;
  isLoading?: boolean;
}

interface ChatState {
  messages: Message[];
  users: AuthUser[];
  selectedUser: AuthUser | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;

  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (messageData: { text: string }) => Promise<void>;
  sendBotMessage: (text: string) => Promise<void>;

  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  setSelectedUser: (user: AuthUser | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId: string) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) return;

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Send failed");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage: Message) => {
      const isFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isFromSelectedUser) return;

      set({ messages: [...get().messages, newMessage] });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("newMessage");
  },

  sendBotMessage: async (text: string) => {
    const { messages } = get();
    const authUser = useAuthStore.getState().authUser;
    if (!authUser) return;

    const userMsg: Message = {
      senderId: authUser._id,
      text,
      createdAt: new Date().toISOString(),
    };

    const loadingMsg: Message = {
      senderId: "bot",
      text: "Typing...",
      createdAt: new Date().toISOString(),
      isLoading: true,
    };

    set({ messages: [...messages, userMsg, loadingMsg] });

    try {
      const res = await axiosInstance.post("/bot/chat", { message: text });
      const withoutLoading = get().messages.filter(m => !m.isLoading);
      set({ messages: [...withoutLoading, res.data] });
    } catch {
      toast.error("Bot request failed");
      const filtered = get().messages.filter(m => !m.isLoading);
      set({ messages: filtered });
    }
  },

  setSelectedUser: (user) => set({ selectedUser: user }),
}));
