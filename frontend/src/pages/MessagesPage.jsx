//frontend/src/pages/MessagesPage.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, NotebookPen, Search, Send, Trash2, UserRound } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import api from "../api/axiosConfig";

const getContactIcon = (type) => {
  if (type === "assistant") return <Bot size={20} />;
  if (type === "journal") return <NotebookPen size={20} />;
  return <UserRound size={20} />;
};

const getMessageAuthor = (message, activeContact, currentUser, t) => {
  if (message.role === "assistant") return t("aiAssistant");
  if (message.sender?._id === currentUser?._id || message.sender === currentUser?._id) {
    return currentUser?.username || t("me");
  }
  return activeContact?.name || t("conversation");
};

const quickPrompts = [
  "quickMealRecommendation",
  "quickExerciseRecommendation",
  "quickFoodIdeas",
  "quickTodayReview",
];

const MessagesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef(null);

  const [contacts, setContacts] = useState([]);
  const [activeContactId, setActiveContactId] = useState("assistant");
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const activeContact = useMemo(() => {
    return contacts.find((contact) => contact.id === activeContactId) || null;
  }, [contacts, activeContactId]);

  const filteredContacts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return contacts;
    }

    return contacts.filter((contact) => {
      return (
        contact.name.toLowerCase().includes(normalizedSearch) ||
        contact.subtitle.toLowerCase().includes(normalizedSearch) ||
        contact.lastMessage?.content?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [contacts, searchTerm]);

  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      const response = await api.get("/messages/contacts");
      setContacts(response.data);

      if (!response.data.some((contact) => contact.id === activeContactId)) {
        setActiveContactId(response.data[0]?.id || "assistant");
      }
    } catch (error) {
      console.error("Failed to fetch contacts", error);
      setError(t("messagesLoadFailed"));
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchThread = async (contact = activeContact) => {
    if (!contact) return;

    try {
      setLoadingThread(true);
      setError("");

      const params = new URLSearchParams({ type: contact.type });
      if (contact.type === "user") {
        params.set("contactId", contact.id);
      }

      const response = await api.get(`/messages/thread?${params.toString()}`);
      setMessages(response.data);

      if (contact.type === "user" && contact.unreadCount > 0) {
        await fetchContacts();
      }
    } catch (error) {
      console.error("Failed to fetch thread", error);
      setError(t("messagesLoadFailed"));
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (contacts.length === 0) return;

    const type = searchParams.get("type");
    const contactId = searchParams.get("contactId");

    if (type === "assistant") {
      setActiveContactId("assistant");
      return;
    }

    if (type === "journal") {
      setActiveContactId("journal");
      return;
    }

    if (type === "user" && contactId) {
      const contactExists = contacts.some((contact) => contact.id === contactId);

      if (contactExists) {
        setActiveContactId(contactId);
      }
    }
  }, [contacts, searchParams]);

  useEffect(() => {
    if (activeContact) {
      fetchThread(activeContact);
    }
  }, [activeContactId, activeContact?.type]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectContact = (contact) => {
    setActiveContactId(contact.id);
    setError("");
  };

  const handleQuickPrompt = (promptKey) => {
    setMessageText(t(promptKey));
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const cleanMessage = messageText.trim();

    if (!cleanMessage || !activeContact) {
      return;
    }

    try {
      setSending(true);
      setError("");

      if (activeContact.type === "assistant") {
        const response = await api.post("/messages/assistant", {
          content: cleanMessage,
        });

        setMessages((currentMessages) => [
          ...currentMessages,
          response.data.userMessage,
          response.data.assistantMessage,
        ]);
      } else {
        const response = await api.post("/messages", {
          content: cleanMessage,
          channelType: activeContact.type,
          recipientId: activeContact.type === "user" ? activeContact.id : undefined,
        });

        setMessages((currentMessages) => [...currentMessages, response.data]);
      }

      setMessageText("");
      await fetchContacts();
    } catch (error) {
      console.error("Failed to send message", error);
      setError(error.response?.data?.message || t("messageSendFailed"));
    } finally {
      setSending(false);
    }
  };

  const handleClearThread = async () => {
    if (!activeContact) return;

    const confirmed = window.confirm(t("confirmClearConversation"));

    if (!confirmed) return;

    try {
      const params = new URLSearchParams({ type: activeContact.type });
      if (activeContact.type === "user") {
        params.set("contactId", activeContact.id);
      }

      await api.delete(`/messages/thread?${params.toString()}`);
      setMessages([]);
      await fetchContacts();
    } catch (error) {
      console.error("Failed to clear conversation", error);
      setError(t("messagesClearFailed"));
    }
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
        <aside className="conversation-list modern-conversation-list">
          <div className="conversation-search">
            <Search size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t("searchConversation")}
            />
          </div>

          {loadingContacts ? (
            <p className="messages-muted-text">{t("loading")}</p>
          ) : (
            filteredContacts.map((contact) => (
              <button
                key={`${contact.type}-${contact.id}`}
                type="button"
                className={`conversation-card ${
                  activeContactId === contact.id ? "active" : ""
                }`}
                onClick={() => handleSelectContact(contact)}
              >
                <span className="conversation-avatar">
                  {getContactIcon(contact.type)}
                </span>

                <span>
                  <strong>{contact.name}</strong>
                  <small>
                    {contact.lastMessage?.content || contact.subtitle || t("messagesPlaceholder")}
                  </small>
                </span>

                {contact.unreadCount > 0 && (
                  <em className="conversation-unread-badge">
                    {contact.unreadCount > 9 ? "9+" : contact.unreadCount}
                  </em>
                )}
              </button>
            ))
          )}
        </aside>

        <div className="chat-panel">
          <div className="chat-header">
            <div className="conversation-avatar large">
              {activeContact ? getContactIcon(activeContact.type) : <UserRound size={20} />}
            </div>

            <div>
              <h2>{activeContact?.name || t("conversation")}</h2>
              <p>{activeContact?.subtitle || t("online")}</p>
            </div>

            <button
              type="button"
              className="small-icon-button chat-clear-button"
              onClick={handleClearThread}
              title={t("clearConversation")}
            >
              <Trash2 size={16} />
            </button>
          </div>

          {activeContact?.type === "assistant" && (
            <div className="ai-suggestion-row">
              {quickPrompts.map((promptKey) => (
                <button
                  key={promptKey}
                  type="button"
                  onClick={() => handleQuickPrompt(promptKey)}
                >
                  {t(promptKey)}
                </button>
              ))}
            </div>
          )}

          {activeContact?.type === "journal" && (
            <div className="journal-note">
              <strong>{t("nutritionJournal")}</strong>
              <p>{t("nutritionJournalDescription")}</p>
            </div>
          )}

          {error && <div className="error-message chat-error">{error}</div>}

          <div className="chat-messages">
            {loadingThread ? (
              <p className="messages-muted-text">{t("loading")}</p>
            ) : messages.length === 0 ? (
              <div className="empty-chat-state">
                <span className="conversation-avatar large">
                  {activeContact ? getContactIcon(activeContact.type) : <UserRound size={20} />}
                </span>
                <h3>{t("noMessagesYet")}</h3>
                <p>{t("startConversationHint")}</p>
              </div>
            ) : (
              messages.map((message) => {
                const isMine =
                  message.role !== "assistant" &&
                  (message.sender?._id === user?._id || message.sender === user?._id);

                return (
                  <div
                    key={message._id}
                    className={`message-bubble ${isMine ? "mine" : "theirs"}`}
                  >
                    <p>{message.content}</p>
                    <span>
                      {getMessageAuthor(message, activeContact, user, t)} · {message.time}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <input
              className="form-input"
              type="text"
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder={
                activeContact?.type === "assistant"
                  ? t("typeAiMessage")
                  : activeContact?.type === "journal"
                    ? t("typeJournalMessage")
                    : t("typeMessage")
              }
              disabled={sending}
            />

            <button
              type="submit"
              className="primary-button send-button"
              disabled={sending || !messageText.trim()}
            >
              <Send size={17} />
              {sending ? t("loading") : t("send")}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default MessagesPage;
