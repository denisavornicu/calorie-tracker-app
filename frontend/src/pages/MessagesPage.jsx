//frontend/src/pages/MessagesPage.jsx

import { useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

const conversationList = [
  {
    id: "assistant",
    nameKey: "assistant",
    avatar: "AI",
    statusKey: "online",
  },
  {
    id: "nutrition",
    nameKey: "nutritionCoach",
    avatar: "N",
    statusKey: "online",
  },
  {
    id: "friend",
    nameKey: "friend",
    avatar: "♡",
    statusKey: "online",
  },
];

const defaultMessages = {
  assistant: [
    {
      id: "a1",
      sender: "them",
      text: "Pot să te ajut să verifici mesele, sportul sau statisticile zilei.",
      time: "09:00",
    },
  ],
  nutrition: [
    {
      id: "n1",
      sender: "them",
      text: "Poți salva aici idei de mese sau observații despre aportul zilnic.",
      time: "09:05",
    },
  ],
  friend: [
    {
      id: "f1",
      sender: "them",
      text: "Trimite-mi o idee de masă când vrei să o salvezi rapid.",
      time: "09:10",
    },
  ],
};

const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

const MessagesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [activeConversationId, setActiveConversationId] = useState("assistant");
  const [messageText, setMessageText] = useState("");
  const [messagesByConversation, setMessagesByConversation] = useState(() => {
    const storedMessages = localStorage.getItem("calorieTrackerMessages");
    return storedMessages ? JSON.parse(storedMessages) : defaultMessages;
  });

  useEffect(() => {
    localStorage.setItem(
      "calorieTrackerMessages",
      JSON.stringify(messagesByConversation)
    );
  }, [messagesByConversation]);

  const activeConversation = useMemo(() => {
    return conversationList.find((item) => item.id === activeConversationId);
  }, [activeConversationId]);

  const activeMessages = messagesByConversation[activeConversationId] || [];

  const handleSendMessage = (event) => {
    event.preventDefault();

    if (!messageText.trim()) {
      return;
    }

    const newMessage = {
      id: crypto.randomUUID(),
      sender: "me",
      text: messageText.trim(),
      time: getCurrentTime(),
    };

    setMessagesByConversation((currentMessages) => ({
      ...currentMessages,
      [activeConversationId]: [
        ...(currentMessages[activeConversationId] || []),
        newMessage,
      ],
    }));

    setMessageText("");
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("messages")}</p>
          <h1>{t("messages")}</h1>
        </div>
      </div>

      <div className="messages-shell content-card">
        <aside className="conversation-list">
          {conversationList.map((conversation) => {
            const conversationMessages = messagesByConversation[conversation.id] || [];
            const lastMessage = conversationMessages[conversationMessages.length - 1];

            return (
              <button
                key={conversation.id}
                type="button"
                className={`conversation-card ${
                  activeConversationId === conversation.id ? "active" : ""
                }`}
                onClick={() => setActiveConversationId(conversation.id)}
              >
                <span className="conversation-avatar">{conversation.avatar}</span>

                <span>
                  <strong>{t(conversation.nameKey)}</strong>
                  <small>{lastMessage?.text || t("messagesPlaceholder")}</small>
                </span>
              </button>
            );
          })}
        </aside>

        <div className="chat-panel">
          <div className="chat-header">
            <div className="conversation-avatar large">
              {activeConversation?.avatar}
            </div>

            <div>
              <h2>{t(activeConversation?.nameKey || "conversation")}</h2>
              <p>{t(activeConversation?.statusKey || "online")}</p>
            </div>
          </div>

          <div className="chat-messages">
            {activeMessages.map((message) => (
              <div
                key={message.id}
                className={`message-bubble ${message.sender === "me" ? "mine" : "theirs"}`}
              >
                <p>{message.text}</p>
                <span>
                  {message.sender === "me" ? user?.username || "Me" : t(activeConversation?.nameKey || "conversation")} · {message.time}
                </span>
              </div>
            ))}
          </div>

          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <input
              className="form-input"
              type="text"
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder={t("typeMessage")}
            />

            <button type="submit" className="primary-button send-button">
              <Send size={17} />
              {t("send")}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default MessagesPage;
