import { useRef, useState } from "react";
import type { KeyboardEvent, ChangeEvent, FormEvent } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Mic, Download } from "lucide-react";
import toast from "react-hot-toast";

declare global {
  // Add SpeechRecognitionEvent type to the global scope
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    readonly length: number;
    [index: number]: SpeechRecognitionAlternative;
    readonly isFinal: boolean;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  // Add SpeechRecognition type to the global scope
  interface SpeechRecognition extends EventTarget {
    lang: string;
    start(): void;
    stop(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    // Add other properties/methods as needed
  }

  interface Window {
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
      prototype: SpeechRecognition;
    };
  }
}

type SendMessageArgs = {
  text: string;
  image?: string | null;
};

const MessageInput: React.FC = () => {
  const [text, setText] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { sendMessage, sendBotMessage, messages } = useChatStore();

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type?.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    const payload: SendMessageArgs = {
      text: text.trim(),
      image: imagePreview,
    };

    try {
      await sendMessage(payload);

      if (text.trim().length > 0) {
        await sendBotMessage(text.trim());
        setHistory((prev) => [...prev, text.trim()]);
      }

      setText("");
      setImagePreview(null);
      setHistoryIndex(-1);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "ArrowUp" && history.length && historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setText(history[history.length - 1 - newIndex]);
    }
    if (e.key === "ArrowDown" && historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setText(history[history.length - 1 - newIndex]);
    }
  };

  const startVoiceInput = () => {
    try {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = "en-US";
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        setText(event.results[0][0].transcript);
      };
      recognition.start();
    } catch {
      toast.error("Voice recognition not supported on this browser.");
    }
  };

  const exportChat = () => {
    const blob = new Blob([JSON.stringify(messages, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chat_history.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
              aria-label="Remove image preview"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} onKeyDown={handleKeyDown} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Message input"
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload image"
          >
            <Image size={20} />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={startVoiceInput}
            className="btn btn-sm btn-circle text-blue-500"
            title="Voice input"
            aria-label="Start voice input"
          >
            <Mic size={20} />
          </button>

          <button
            type="button"
            onClick={exportChat}
            className="btn btn-sm btn-circle text-green-600"
            title="Export chat"
            aria-label="Export chat history"
          >
            <Download size={20} />
          </button>

          <button
            type="submit"
            className="btn btn-sm btn-circle"
            disabled={!text.trim() && !imagePreview}
            aria-label="Send message"
          >
            <Send size={22} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
