//backend/routes/messageRoutes.js

const express = require("express");
const Message = require("../models/Message");
const User = require("../models/User");
const Meal = require("../models/Meal");
const Food = require("../models/Food");
const SportEntry = require("../models/SportEntry");
const WaterEntry = require("../models/WaterEntry");
const WeightEntry = require("../models/WeightEntry");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const getToday = () => new Date().toISOString().slice(0, 10);

const formatTime = (date) => {
  if (!date) return "";
  return new Date(date).toTimeString().slice(0, 5);
};

const normalizeUser = (user) => {
  if (!user) return null;

  return {
    _id: user._id,
    username: user.username,
  };
};

const normalizeMessage = (message) => ({
  _id: message._id,
  channelType: message.channelType,
  sender: normalizeUser(message.sender) || message.sender,
  recipient: normalizeUser(message.recipient) || message.recipient,
  role: message.role,
  content: message.content,
  readAt: message.readAt,
  metadata: message.metadata,
  createdAt: message.createdAt,
  time: formatTime(message.createdAt),
});

const getConversationFilter = (userId, type, contactId) => {
  if (type === "assistant") {
    return {
      owner: userId,
      channelType: "assistant",
    };
  }

  if (type === "journal") {
    return {
      owner: userId,
      channelType: "journal",
    };
  }

  return {
    channelType: "user",
    $or: [
      { sender: userId, recipient: contactId },
      { sender: contactId, recipient: userId },
    ],
  };
};

const getUnreadFilter = (userId, contactId = null) => {
  const filter = {
    channelType: "user",
    recipient: userId,
    readAt: null,
  };

  if (contactId) {
    filter.sender = contactId;
  }

  return filter;
};

const buildUserContext = async (user) => {
  const today = getToday();

  const [recentMeals, recentFoods, recentSport, todayWater, recentWeights] =
    await Promise.all([
      Meal.find({ user: user._id }).sort({ date: -1, time: -1 }).limit(8),
      Food.find({ user: user._id }).sort({ updatedAt: -1 }).limit(18),
      SportEntry.find({ user: user._id })
        .sort({ date: -1, createdAt: -1 })
        .limit(8),
      WaterEntry.find({ user: user._id, date: today }).sort({ time: 1 }),
      WeightEntry.find({ user: user._id })
        .sort({ date: -1, createdAt: -1 })
        .limit(5),
    ]);

  const profile = user.profile || {};
  const preferences = user.preferences || {};

  const mealsText = recentMeals.length
    ? recentMeals
        .map((meal) => {
          const totals = meal.totals || {};
          return `${meal.date} ${meal.time} ${meal.mealType}: ${totals.calories || 0} kcal, proteine ${totals.protein || 0}g, fibre ${totals.fiber || 0}g, grăsimi ${totals.fat || 0}g, glucide ${totals.carbs || 0}g.`;
        })
        .join("\n")
    : "Nu există mese recente.";

  const foodsText = recentFoods.length
    ? recentFoods
        .map((food) => {
          return `${food.name}${food.brand ? ` (${food.brand})` : ""}: ${food.calories || 0} kcal/100g, proteine ${food.protein || 0}g, fibre ${food.fiber || 0}g, grăsimi ${food.fat || 0}g, glucide ${food.carbs || 0}g.`;
        })
        .join("\n")
    : "Nu există alimente salvate.";

  const sportText = recentSport.length
    ? recentSport
        .map((entry) => {
          return `${entry.date}: ${entry.activityName}, ${entry.durationMinutes || 0} min, ${entry.caloriesBurned || 0} kcal.`;
        })
        .join("\n")
    : "Nu există activități sportive recente.";

  const waterTotal = todayWater.reduce(
    (total, entry) => total + Number(entry.amountMl || 0),
    0
  );

  const weightText = recentWeights.length
    ? recentWeights
        .map((entry) => `${entry.date}: ${entry.weightKg} kg`)
        .join("\n")
    : "Nu există greutăți înregistrate.";

  return `
Persoană conectată: ${user.username}
Preferințe: limbă=${preferences.language || "ro"}, temă=${preferences.themeStyle || "pink-purple"}.
Profil: sex=${profile.gender || "female"}, vârstă=${profile.age || 22}, înălțime=${profile.heightCm || 150} cm, greutate profil=${profile.weightKg || 44} kg.
Targeturi: menținere=${profile.maintenanceCalories || 1360} kcal, proteine=${profile.proteinTarget || 80}g, fibre=${profile.fiberTarget || 25}g, grăsimi=${profile.fatTarget || 45}g, glucide=${profile.carbsTarget || 170}g, apă=${profile.waterTargetMl || 2500}ml.

Mese recente:
${mealsText}

Alimente salvate recent:
${foodsText}

Sport recent:
${sportText}

Apă azi (${today}): ${waterTotal} ml.

Greutate recentă:
${weightText}
`.trim();
};

const extractGeminiText = (data) => {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts
    .map((part) => part.text || "")
    .filter(Boolean)
    .join("\n")
    .trim();

  return text || "Nu am primit un răspuns text de la asistent.";
};

const callGemini = async ({ user, userMessage, history }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";

  if (!apiKey) {
    return {
      text:
        "Cheia GEMINI_API_KEY nu este configurată încă în backend. Adaug-o în fișierul .env, repornește serverul și încearcă din nou.",
      model,
      error: true,
    };
  }

  const appContext = await buildUserContext(user);

  const systemPrompt = `
Ești asistentul AI integrat într-o aplicație personală de monitorizare calorii, mese, alimente, apă, greutate, fasting și sport.
Răspunde în română, cu ton cald, clar și practic, dacă persoana nu cere explicit engleză.
Folosește contextul din aplicație pentru recomandări de mese, alimente, idei de combinații, exerciții fizice ușoare/moderate și interpretarea jurnalului.
Nu inventa date care nu există în context. Dacă informațiile sunt incomplete, spune ce lipsește.
Nu oferi diagnostice medicale și nu recomanda restricții extreme, post prelungit sau comportamente nesigure. Pentru simptome medicale, recomandă consult specializat.
Ține răspunsurile utile, scurte și ușor de aplicat.
`.trim();

  const recentConversation = history
    .slice(-12)
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

  const contents = [
    ...recentConversation,
    {
      role: "user",
      parts: [
        {
          text: `Context din aplicație:\n${appContext}\n\nMesajul persoanei:\n${userMessage}`,
        },
      ],
    },
  ];

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 900,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.error?.message || "Nu am putut contacta Gemini în acest moment.";
    throw new Error(message);
  }

  return {
    text: extractGeminiText(data),
    model,
    error: false,
  };
};

router.get("/contacts", protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("username profile preferences createdAt")
      .sort({ username: 1 });

    const assistantLastMessage = await Message.findOne({
      owner: req.user._id,
      channelType: "assistant",
    }).sort({ createdAt: -1 });

    const journalLastMessage = await Message.findOne({
      owner: req.user._id,
      channelType: "journal",
    }).sort({ createdAt: -1 });

    const userContacts = await Promise.all(
      users.map(async (contact) => {
        const lastMessage = await Message.findOne(
          getConversationFilter(req.user._id, "user", contact._id)
        )
          .populate("sender", "username")
          .populate("recipient", "username")
          .sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments(
          getUnreadFilter(req.user._id, contact._id)
        );

        return {
          id: contact._id,
          type: "user",
          name: contact.username,
          avatar: contact.username.slice(0, 2).toUpperCase(),
          subtitle: "Conversație cu utilizator",
          unreadCount,
          lastMessage: lastMessage ? normalizeMessage(lastMessage) : null,
        };
      })
    );

    res.json([
      {
        id: "assistant",
        type: "assistant",
        name: "Asistent AI",
        avatar: "AI",
        subtitle: "Recomandări de mese, alimente și sport",
        unreadCount: 0,
        lastMessage: assistantLastMessage
          ? normalizeMessage(assistantLastMessage)
          : null,
      },
      {
        id: "journal",
        type: "journal",
        name: "Jurnal de nutriție",
        avatar: "JN",
        subtitle: "Mesaje private către tine",
        unreadCount: 0,
        lastMessage: journalLastMessage ? normalizeMessage(journalLastMessage) : null,
      },
      ...userContacts,
    ]);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch message contacts",
      error: error.message,
    });
  }
});

router.get("/notifications", protect, async (req, res) => {
  try {
    const unreadMessages = await Message.find(getUnreadFilter(req.user._id))
      .populate("sender", "username")
      .sort({ createdAt: -1 })
      .limit(50);

    const conversationsMap = new Map();

    unreadMessages.forEach((message) => {
      const senderId = String(message.sender?._id || message.sender);

      if (!senderId || senderId === "null") {
        return;
      }

      const current = conversationsMap.get(senderId) || {
        contactId: senderId,
        contactName: message.sender?.username || "Utilizator",
        unreadCount: 0,
        lastMessage: normalizeMessage(message),
      };

      current.unreadCount += 1;

      if (new Date(message.createdAt) > new Date(current.lastMessage.createdAt)) {
        current.lastMessage = normalizeMessage(message);
      }

      conversationsMap.set(senderId, current);
    });

    const conversations = Array.from(conversationsMap.values()).sort(
      (a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
    );

    const totalUnread = conversations.reduce(
      (total, conversation) => total + conversation.unreadCount,
      0
    );

    res.json({
      totalUnread,
      conversations,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
});

const clearMessageNotifications = async (req, res) => {
  try {
    const contactId = req.query.contactId || req.body?.contactId || null;

    const result = await Message.updateMany(
      getUnreadFilter(req.user._id, contactId),
      { readAt: new Date() }
    );

    res.json({
      message: "Notifications cleared",
      clearedCount: result.modifiedCount || 0,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to clear notifications",
      error: error.message,
    });
  }
};

router.patch("/notifications/read", protect, clearMessageNotifications);
router.delete("/notifications", protect, clearMessageNotifications);

router.get("/thread", protect, async (req, res) => {
  try {
    const { type = "assistant", contactId } = req.query;

    if (type === "user" && !contactId) {
      return res.status(400).json({ message: "Contact id is required" });
    }

    if (type === "user") {
      await Message.updateMany(getUnreadFilter(req.user._id, contactId), {
        readAt: new Date(),
      });
    }

    const messages = await Message.find(
      getConversationFilter(req.user._id, type, contactId)
    )
      .populate("sender", "username")
      .populate("recipient", "username")
      .sort({ createdAt: 1 });

    res.json(messages.map(normalizeMessage));
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch conversation",
      error: error.message,
    });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const { content, channelType = "user", recipientId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    if (channelType === "user" && !recipientId) {
      return res.status(400).json({ message: "Recipient is required" });
    }

    const recipient =
      channelType === "journal" ? req.user._id : recipientId || null;

    const message = await Message.create({
      owner: req.user._id,
      channelType,
      sender: req.user._id,
      recipient,
      role: "user",
      content: content.trim(),
      readAt: channelType === "journal" ? new Date() : null,
    });

    const hydratedMessage = await Message.findById(message._id)
      .populate("sender", "username")
      .populate("recipient", "username");

    res.status(201).json(normalizeMessage(hydratedMessage));
  } catch (error) {
    res.status(500).json({
      message: "Failed to send message",
      error: error.message,
    });
  }
});

router.post("/assistant", protect, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const userMessage = await Message.create({
      owner: req.user._id,
      channelType: "assistant",
      sender: req.user._id,
      recipient: null,
      role: "user",
      content: content.trim(),
      readAt: new Date(),
    });

    const previousMessages = await Message.find({
      owner: req.user._id,
      channelType: "assistant",
      _id: { $ne: userMessage._id },
    })
      .sort({ createdAt: -1 })
      .limit(12);

    let aiResult;

    try {
      aiResult = await callGemini({
        user: req.user,
        userMessage: content.trim(),
        history: previousMessages.reverse(),
      });
    } catch (error) {
      aiResult = {
        text: `Nu am putut obține răspuns de la Gemini: ${error.message}`,
        model: process.env.GEMINI_MODEL || "gemini-flash-latest",
        error: true,
      };
    }

    const assistantMessage = await Message.create({
      owner: req.user._id,
      channelType: "assistant",
      sender: null,
      recipient: req.user._id,
      role: "assistant",
      content: aiResult.text,
      readAt: new Date(),
      metadata: {
        model: aiResult.model,
        error: aiResult.error,
      },
    });

    const hydratedUserMessage = await Message.findById(userMessage._id)
      .populate("sender", "username")
      .populate("recipient", "username");

    const hydratedAssistantMessage = await Message.findById(assistantMessage._id)
      .populate("sender", "username")
      .populate("recipient", "username");

    res.status(201).json({
      userMessage: normalizeMessage(hydratedUserMessage),
      assistantMessage: normalizeMessage(hydratedAssistantMessage),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to send assistant message",
      error: error.message,
    });
  }
});

router.delete("/thread", protect, async (req, res) => {
  try {
    const { type = "assistant", contactId } = req.query;

    if (type === "user" && !contactId) {
      return res.status(400).json({ message: "Contact id is required" });
    }

    await Message.deleteMany(getConversationFilter(req.user._id, type, contactId));

    res.json({ message: "Conversation cleared" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to clear conversation",
      error: error.message,
    });
  }
});

module.exports = router;
