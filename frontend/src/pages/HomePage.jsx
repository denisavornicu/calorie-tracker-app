//frontend/src/pages/HomePage.jsx

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../api/axiosConfig";

const getToday = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

const formatTodayDate = (language) => {
  const locale = language === "en" ? "en-US" : "ro-RO";

  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
};

const formatValue = (value, suffix) => {
  const safeValue = Number(value || 0);
  return `${Math.round(safeValue * 10) / 10} ${suffix}`;
};

const formatDuration = (totalMinutes, language) => {
  if (!totalMinutes || totalMinutes <= 0) {
    return language === "en" ? "0 minutes" : "0 minute";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (language === "en") {
    if (hours > 0 && minutes > 0) return `${hours} hours and ${minutes} minutes`;
    if (hours > 0) return `${hours} hours`;
    return `${minutes} minutes`;
  }

  if (hours > 0 && minutes > 0) return `${hours} ore și ${minutes} minute`;
  if (hours > 0) return `${hours} ore`;
  return `${minutes} minute`;
};

const getFastElapsedMinutes = (activeFast) => {
  if (!activeFast?.startTime) return 0;

  const startedAt = new Date(activeFast.startTime).getTime();
  const now = Date.now();

  return Math.max(0, Math.floor((now - startedAt) / 60000));
};

const HomePage = () => {
  const { t, i18n } = useTranslation();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const [fastLoading, setFastLoading] = useState(false);
  const [activeFastElapsedMinutes, setActiveFastElapsedMinutes] = useState(0);
  const [lastFastMessage, setLastFastMessage] = useState("");

  const [showWaterForm, setShowWaterForm] = useState(false);
  const [waterForm, setWaterForm] = useState({ amountMl: "" });
  const [savingWater, setSavingWater] = useState(false);

  const [weightForm, setWeightForm] = useState({
    weightKg: "",
    notes: "",
  });
  const [savingWeight, setSavingWeight] = useState(false);

  const fetchDashboard = async () => {
    try {
      const response = await api.get("/dashboard/today");
      setDashboard(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartFast = async () => {
    try {
      setFastLoading(true);
      setLastFastMessage("");

      await api.post("/fasts/start", {
        startTime: new Date().toISOString(),
      });

      await fetchDashboard();
    } catch (error) {
      console.error("Failed to start fast", error);
    } finally {
      setFastLoading(false);
    }
  };

  const handleStopFast = async () => {
    if (!dashboard?.activeFast?._id) return;

    try {
      setFastLoading(true);

      const response = await api.put(`/fasts/stop/${dashboard.activeFast._id}`);
      const stoppedFast = response.data.fast || response.data;
      const fastNumber = response.data.fastNumber;

      setLastFastMessage(
        t("fastSavedMessage", {
          number: fastNumber || "-",
          duration: formatDuration(stoppedFast.durationMinutes, i18n.language),
        })
      );

      await fetchDashboard();
    } catch (error) {
      console.error("Failed to stop fast", error);
    } finally {
      setFastLoading(false);
    }
  };

  const handleWaterChange = (event) => {
    const { value } = event.target;
    setWaterForm({ amountMl: value });
  };

  const handleSaveWater = async (event) => {
    event.preventDefault();

    if (!waterForm.amountMl || Number(waterForm.amountMl) <= 0) return;

    try {
      setSavingWater(true);

      await api.post("/water", {
        date: getToday(),
        amountMl: Number(waterForm.amountMl),
        type: "Water",
      });

      setWaterForm({ amountMl: "" });
      setShowWaterForm(false);
      await fetchDashboard();
    } catch (error) {
      console.error("Failed to save water", error);
    } finally {
      setSavingWater(false);
    }
  };

  const handleWeightChange = (event) => {
    const { name, value } = event.target;

    setWeightForm((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSaveWeight = async (event) => {
    event.preventDefault();

    if (!weightForm.weightKg) return;

    try {
      setSavingWeight(true);

      await api.post("/weight", {
        date: getToday(),
        time: getCurrentTime(),
        weightKg: Number(weightForm.weightKg),
        notes: weightForm.notes,
      });

      setWeightForm({
        weightKg: "",
        notes: "",
      });

      await fetchDashboard();
    } catch (error) {
      console.error("Failed to save weight", error);
    } finally {
      setSavingWeight(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    const activeFast = dashboard?.activeFast;

    if (!activeFast) {
      setActiveFastElapsedMinutes(0);
      return undefined;
    }

    setActiveFastElapsedMinutes(getFastElapsedMinutes(activeFast));

    const intervalId = window.setInterval(() => {
      setActiveFastElapsedMinutes(getFastElapsedMinutes(activeFast));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [dashboard?.activeFast]);

  const calories = dashboard?.calories;
  const nutrients = dashboard?.nutrients;
  const water = dashboard?.water;
  const activeFast = dashboard?.activeFast;
  const yesterdayFast = dashboard?.yesterdayFast;
  const latestWeight = dashboard?.weight;

  if (loading) {
    return (
      <section className="page">
        <div className="content-card">
          <p>{t("loading")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header compact-header">
        <div>
          <p className="eyebrow">{formatTodayDate(i18n.language)}</p>
          <h1>{t("home")}</h1>
        </div>
      </div>

      <div className="home-card-grid">
        <article className="summary-card highlight-card">
          <span>{t("caloriesRemaining")}</span>
          <strong>{formatValue(calories?.remainingCalories, "kcal")}</strong>
          <p>
            {t("consumed")}: {formatValue(calories?.consumedCalories, "kcal")}
          </p>
        </article>

        <article className="summary-card">
          <span>{t("burnedCalories")}</span>
          <strong>{formatValue(calories?.caloriesBurned, "kcal")}</strong>
          <p>{t("sport")}</p>
        </article>

        <article className="summary-card">
          <span>{t("proteinRemaining")}</span>
          <strong>{formatValue(nutrients?.protein?.remaining, "g")}</strong>
          <p>
            {formatValue(nutrients?.protein?.consumed, "g")} /{" "}
            {formatValue(nutrients?.protein?.target, "g")}
          </p>
        </article>

        <article className="summary-card">
          <span>{t("fiberRemaining")}</span>
          <strong>{formatValue(nutrients?.fiber?.remaining, "g")}</strong>
          <p>
            {formatValue(nutrients?.fiber?.consumed, "g")} /{" "}
            {formatValue(nutrients?.fiber?.target, "g")}
          </p>
        </article>

        <article className="summary-card detail-card">
          <span>{t("fatRemaining")}</span>
          <strong>{formatValue(nutrients?.fat?.remaining, "g")}</strong>

          <div className="mini-details">
            <p>
              {t("consumed")}: {formatValue(nutrients?.fat?.consumed, "g")} /{" "}
              {formatValue(nutrients?.fat?.target, "g")}
            </p>
            <p>
              {t("saturatedFatShort")}: {" "}
              {formatValue(nutrients?.saturatedFat?.consumed, "g")} /{" "}
              {formatValue(nutrients?.saturatedFat?.target, "g")}
            </p>
            <p>
              {t("unsaturatedFatShort")}: {" "}
              {formatValue(nutrients?.unsaturatedFat?.consumed, "g")} /{" "}
              {formatValue(nutrients?.unsaturatedFat?.target, "g")}
            </p>
          </div>
        </article>

        <article className="summary-card detail-card">
          <span>{t("carbsRemaining")}</span>
          <strong>{formatValue(nutrients?.carbs?.remaining, "g")}</strong>

          <div className="mini-details">
            <p>
              {t("consumed")}: {formatValue(nutrients?.carbs?.consumed, "g")} /{" "}
              {formatValue(nutrients?.carbs?.target, "g")}
            </p>
            <p>
              {t("sugarShort")}: {formatValue(nutrients?.sugar?.consumed, "g")} /{" "}
              {formatValue(nutrients?.sugar?.target, "g")}
            </p>
            <p>
              {t("addedSugarShort")}: {" "}
              {formatValue(nutrients?.addedSugar?.consumed, "g")} /{" "}
              {formatValue(nutrients?.addedSugar?.target, "g")}
            </p>
          </div>
        </article>

        <article className="summary-card water-card">
          <span>{t("waterConsumedTitle")}</span>
          <strong>{formatValue(water?.waterConsumedMl, "ml")}</strong>
          <p>
            {formatValue(water?.waterConsumedMl, "ml")} /{" "}
            {formatValue(water?.waterTargetMl, "ml")}
          </p>

          <button
            type="button"
            className="secondary-button compact"
            onClick={() => setShowWaterForm((currentValue) => !currentValue)}
          >
            {showWaterForm ? t("cancel") : t("addWater")}
          </button>

          {showWaterForm && (
            <form onSubmit={handleSaveWater} className="inline-card-form">
              <input
                className="form-input"
                type="number"
                step="1"
                value={waterForm.amountMl}
                onChange={handleWaterChange}
                placeholder="250 ml"
              />

              <button
                type="submit"
                className="primary-button small"
                disabled={savingWater}
              >
                {savingWater ? t("loading") : t("save")}
              </button>
            </form>
          )}
        </article>

        <article className="summary-card fasting-card">
          <span>{activeFast ? t("fastStarted") : t("yesterdayFast")}</span>

          {activeFast ? (
            <>
              <strong>{formatDuration(activeFastElapsedMinutes, i18n.language)}</strong>
              <p>{t("fastingInProgress")}</p>
              <button
                type="button"
                className="secondary-button compact"
                onClick={handleStopFast}
                disabled={fastLoading}
              >
                {fastLoading ? t("loading") : t("stopFast")}
              </button>
            </>
          ) : (
            <>
              {lastFastMessage ? (
                <strong className="small-strong">{lastFastMessage}</strong>
              ) : yesterdayFast ? (
                <strong>
                  {formatDuration(yesterdayFast.durationMinutes, i18n.language)}
                </strong>
              ) : (
                <strong className="small-strong">{t("noYesterdayFast")}</strong>
              )}

              <button
                type="button"
                className="secondary-button compact"
                onClick={handleStartFast}
                disabled={fastLoading}
              >
                {fastLoading ? t("loading") : t("startFast")}
              </button>
            </>
          )}
        </article>
      </div>

      <div className="content-card weight-entry-card">
        <div className="section-title">
          <div>
            <h2>{t("recordWeight")}</h2>
            <p>{t("recordWeightSubtitle")}</p>
          </div>
        </div>

        {latestWeight && (
          <div className="info-box weight-latest-box">
            <p>
              {t("latestWeight")}: <strong>{latestWeight.weightKg} kg</strong> ·{" "}
              {t("loggedAt")}: {latestWeight.date} {latestWeight.time || ""}
            </p>
          </div>
        )}

        <form onSubmit={handleSaveWeight} className="weight-form">
          <label>
            {t("weight")}
            <input
              className="form-input"
              type="number"
              step="0.1"
              name="weightKg"
              value={weightForm.weightKg}
              onChange={handleWeightChange}
              placeholder="44.0"
            />
          </label>

          <label>
            {t("notes")}
            <input
              className="form-input"
              type="text"
              name="notes"
              value={weightForm.notes}
              onChange={handleWeightChange}
              placeholder={t("optional")}
            />
          </label>

          <button type="submit" className="primary-button" disabled={savingWeight}>
            {savingWeight ? t("loading") : t("saveWeight")}
          </button>
        </form>
      </div>
    </section>
  );
};

export default HomePage;
