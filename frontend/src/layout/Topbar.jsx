//frontend/src/layout/Topbar.jsx

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Menu, MessageCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageToggle from "../components/LanguageToggle";
import ThemeToggle from "../components/ThemeToggle";
import api from "../api/axiosConfig";

const formatTodayDate = (language) => {
  const locale = language === "en" ? "en-US" : "ro-RO";

  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());
};

const Topbar = ({ onMenuClick }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const notificationRef = useRef(null);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState({
    totalUnread: 0,
    conversations: [],
  });
  const [clearingNotifications, setClearingNotifications] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get("/messages/notifications");
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to fetch message notifications", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const clearNotifications = async (contactId = null) => {
    try {
      setClearingNotifications(true);

      const query = contactId ? `?contactId=${contactId}` : "";
      await api.delete(`/messages/notifications${query}`);
      await fetchNotifications();
    } catch (error) {
      console.error("Failed to clear notifications", error);
    } finally {
      setClearingNotifications(false);
    }
  };

  const handleOpenConversation = async (contactId) => {
    await clearNotifications(contactId);
    setIsNotificationsOpen(false);
    navigate(`/messages?type=user&contactId=${contactId}`);
  };

  const handleClearSingleNotification = async (event, contactId) => {
    event.stopPropagation();
    await clearNotifications(contactId);
  };

  const handleClearAllNotifications = async () => {
    await clearNotifications();
  };

  const handleOpenMessages = () => {
    setIsNotificationsOpen(false);
    navigate("/messages");
  };

  const unreadCount = Number(notifications.totalUnread || 0);

  return (
    <header className="topbar">
      <button type="button" className="topbar-icon-button" onClick={onMenuClick}>
        <Menu size={22} />
      </button>

      <div className="topbar-title">
        <h1>{t("appName")}</h1>
        <p>{formatTodayDate(i18n.language)}</p>
      </div>

      <div className="topbar-actions">
        <LanguageToggle />
        <ThemeToggle />

        <div className="notification-wrapper" ref={notificationRef}>
          <button
            type="button"
            className={`topbar-icon-button notification-button ${
              unreadCount > 0 ? "has-unread" : ""
            }`}
            title={t("notifications")}
            onClick={() =>
              setIsNotificationsOpen((currentValue) => !currentValue)
            }
          >
            <Bell size={19} />

            {unreadCount > 0 && (
              <span className="notification-count">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <div>
                  <h3>{t("notifications")}</h3>
                  <p>
                    {unreadCount > 0
                      ? `${unreadCount} ${t("unreadMessages")}`
                      : t("noNewMessages")}
                  </p>
                </div>

                <div className="notification-header-actions">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="notification-clear-all-button"
                      onClick={handleClearAllNotifications}
                      disabled={clearingNotifications}
                      title={t("clearNotifications")}
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}

                  <MessageCircle size={19} />
                </div>
              </div>

              {notifications.conversations?.length > 0 ? (
                <div className="notification-list">
                  {notifications.conversations.map((notification) => (
                    <div
                      key={notification.contactId}
                      className="notification-row"
                    >
                      <button
                        type="button"
                        className="notification-item"
                        onClick={() => handleOpenConversation(notification.contactId)}
                      >
                        <span className="notification-avatar">
                          {notification.contactName?.slice(0, 2).toUpperCase() || "ME"}
                        </span>

                        <span>
                          <strong>
                            {t("newMessageFrom")} {notification.contactName}
                          </strong>
                          <small>{notification.lastMessage?.content}</small>
                        </span>

                        <em>{notification.unreadCount}</em>
                      </button>

                      <button
                        type="button"
                        className="notification-dismiss-button"
                        onClick={(event) =>
                          handleClearSingleNotification(event, notification.contactId)
                        }
                        disabled={clearingNotifications}
                        title={t("clearNotification")}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="notification-empty">{t("noNewMessages")}</p>
              )}

              <div className="notification-footer-actions">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="secondary-button compact notification-clear-button"
                    onClick={handleClearAllNotifications}
                    disabled={clearingNotifications}
                  >
                    {t("clearNotifications")}
                  </button>
                )}

                <button
                  type="button"
                  className="secondary-button compact notification-open-button"
                  onClick={handleOpenMessages}
                >
                  {t("openMessages")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
