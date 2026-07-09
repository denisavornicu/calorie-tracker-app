import { useEffect, useMemo, useState } from "react";
import { Dumbbell, Edit3, Flame, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../api/axiosConfig";

const getToday = () => new Date().toISOString().slice(0, 10);

const emptySportForm = {
  date: getToday(),
  activityName: "",
  durationMinutes: "",
  caloriesBurned: "",
  notes: "",
};

const SportPage = () => {
  const { t } = useTranslation();

  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState(emptySportForm);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const totalCaloriesBurned = useMemo(() => {
    return entries.reduce(
      (total, entry) => total + Number(entry.caloriesBurned || 0),
      0
    );
  }, [entries]);

  const totalDurationMinutes = useMemo(() => {
    return entries.reduce(
      (total, entry) => total + Number(entry.durationMinutes || 0),
      0
    );
  }, [entries]);

  const fetchSportEntries = async (date = formData.date) => {
    try {
      const response = await api.get(`/sport?date=${date}`);
      setEntries(response.data);
    } catch (error) {
      console.error("Failed to fetch sport entries", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSportEntries(getToday());
  }, []);

  const handleChange = async (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    if (name === "date") {
      await fetchSportEntries(value);
    }
  };

  const resetForm = () => {
    setFormData({
      date: formData.date || getToday(),
      activityName: "",
      durationMinutes: "",
      caloriesBurned: "",
      notes: "",
    });

    setEditingEntryId(null);
  };

  const buildPayload = () => {
    return {
      date: formData.date,
      activityName: formData.activityName,
      durationMinutes: Number(formData.durationMinutes || 0),
      caloriesBurned: Number(formData.caloriesBurned || 0),
      notes: formData.notes,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.activityName.trim() || formData.caloriesBurned === "") {
      return;
    }

    try {
      setSaving(true);

      const payload = buildPayload();

      if (editingEntryId) {
        await api.put(`/sport/${editingEntryId}`, payload);
      } else {
        await api.post("/sport", payload);
      }

      await fetchSportEntries(formData.date);
      resetForm();
    } catch (error) {
      console.error("Failed to save sport entry", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntryId(entry._id);

    setFormData({
      date: entry.date || getToday(),
      activityName: entry.activityName || "",
      durationMinutes: entry.durationMinutes ?? "",
      caloriesBurned: entry.caloriesBurned ?? "",
      notes: entry.notes || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (entryId) => {
    const confirmed = window.confirm(t("confirmDeleteSportEntry"));

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/sport/${entryId}`);
      await fetchSportEntries(formData.date);
    } catch (error) {
      console.error("Failed to delete sport entry", error);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("sport")}</p>
          <h1>{t("sport")}</h1>
        </div>
      </div>

      <div className="sport-summary-grid">
        <article className="summary-card highlight-card">
          <span>{t("burnedCalories")}</span>
          <strong>{totalCaloriesBurned} kcal</strong>
          <p>{t("selectedDay")}: {formData.date}</p>
        </article>

        <article className="summary-card">
          <span>{t("movementDuration")}</span>
          <strong>{totalDurationMinutes} min</strong>
          <p>{t("sportEntries")}: {entries.length}</p>
        </article>
      </div>

      <div className={`content-card form-card ${editingEntryId ? "meal-form-editing" : ""}`}>
        <div className="section-title">
          <div>
            <h2>{editingEntryId ? t("editSportEntry") : t("addSportEntry")}</h2>
            <p>{t("sportPageSubtitle")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="sport-form">
          <div className="form-grid">
            <label>
              {t("date")}
              <input
                className="form-input"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
              />
            </label>

            <label>
              {t("activityName")}
              <input
                className="form-input"
                type="text"
                name="activityName"
                value={formData.activityName}
                onChange={handleChange}
                placeholder={t("activityNamePlaceholder")}
                required
              />
            </label>

            <label>
              {t("durationMinutes")}
              <input
                className="form-input"
                type="number"
                step="1"
                name="durationMinutes"
                value={formData.durationMinutes}
                onChange={handleChange}
                placeholder="30"
              />
            </label>

            <label>
              {t("caloriesBurned")}
              <input
                className="form-input"
                type="number"
                step="1"
                name="caloriesBurned"
                value={formData.caloriesBurned}
                onChange={handleChange}
                placeholder="100"
                required
              />
            </label>
          </div>

          <label className="full-label">
            {t("notes")}
            <textarea
              className="form-textarea"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder={t("optional")}
              rows="3"
            />
          </label>

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={resetForm}>
              {editingEntryId ? t("cancelEdit") : t("cancel")}
            </button>

            <button type="submit" className="primary-button" disabled={saving}>
              {saving
                ? t("loading")
                : editingEntryId
                  ? t("updateSportEntry")
                  : t("saveSportEntry")}
            </button>
          </div>
        </form>
      </div>

      <div className="content-card">
        <div className="section-title">
          <div>
            <h2>{t("sportForSelectedDay")}</h2>
            <p>{formData.date}</p>
          </div>
        </div>

        {loading ? (
          <p>{t("loading")}</p>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <Dumbbell size={28} />
            <p>{t("noSportEntriesForDay")}</p>
          </div>
        ) : (
          <div className="sport-entry-list">
            {entries.map((entry) => (
              <article key={entry._id} className="sport-entry-card">
                <div className="sport-entry-main">
                  <div className="sport-entry-icon">
                    <Flame size={19} />
                  </div>

                  <div>
                    <h3>{entry.activityName}</h3>
                    <p>
                      {entry.durationMinutes || 0} min · {entry.caloriesBurned || 0} kcal
                    </p>

                    {entry.notes && <p className="sport-entry-notes">{entry.notes}</p>}
                  </div>
                </div>

                <div className="saved-meal-actions">
                  <button
                    type="button"
                    className="small-icon-button"
                    onClick={() => handleEdit(entry)}
                  >
                    <Edit3 size={16} />
                  </button>

                  <button
                    type="button"
                    className="small-icon-button danger"
                    onClick={() => handleDelete(entry._id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SportPage;