//frontend/src/pages/StatisticsPage.jsx

import { useEffect, useMemo, useState } from "react";
import { Dumbbell, Droplets, Flame, Scale, Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api/axiosConfig";

const formatValue = (value, suffix) => {
  const safeValue = Number(value || 0);
  return `${Math.round(safeValue * 10) / 10} ${suffix}`;
};

const average = (values) => {
  const validValues = values.filter((value) => value !== null && value !== undefined);

  if (validValues.length === 0) {
    return null;
  }

  const total = validValues.reduce((sum, value) => sum + Number(value || 0), 0);
  return Math.round((total / validValues.length) * 10) / 10;
};

const sum = (items, selector) => {
  return items.reduce((total, item) => total + Number(selector(item) || 0), 0);
};

const formatDuration = (totalMinutes) => {
  if (!totalMinutes || totalMinutes <= 0) {
    return "0 min";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}min`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}min`;
};

const nutrientOptions = [
  { key: "protein", labelKey: "protein" },
  { key: "fiber", labelKey: "fiber" },
  { key: "fat", labelKey: "fat" },
  { key: "saturatedFat", labelKey: "saturatedFat" },
  { key: "unsaturatedFat", labelKey: "unsaturatedFat" },
  { key: "carbs", labelKey: "carbs" },
  { key: "sugar", labelKey: "sugar" },
  { key: "addedSugar", labelKey: "addedSugar" },
];

const StatisticsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [overview, setOverview] = useState([]);
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [selectedNutrients, setSelectedNutrients] = useState(["protein", "fiber"]);

  const fetchStatistics = async (selectedDays = days) => {
    try {
      setLoading(true);

      const response = await api.get(`/statistics/overview?days=${selectedDays}`);
      setOverview(response.data.overview || []);
    } catch (error) {
      console.error("Failed to fetch statistics", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics(days);
  }, []);

  const chartData = useMemo(() => {
    return overview.map((item) => ({
      ...item,
      shortDate: item.date.slice(5),
    }));
  }, [overview]);

  const periodSummary = useMemo(() => {
    const totalRemainingCalories = sum(overview, (item) => item.remainingCalories);
    const totalConsumedCalories = sum(overview, (item) => item.consumedCalories);
    const totalCaloriesBurned = sum(overview, (item) => item.caloriesBurned);
    const totalSportDuration = sum(overview, (item) => item.sportDurationMinutes);
    const totalWater = sum(overview, (item) => item.waterConsumedMl);
    const averageWater =
      overview.length > 0 ? Math.round((totalWater / overview.length) * 10) / 10 : 0;
    const averageWeight = average(overview.map((item) => item.weightKg));
    const fastCount = sum(overview, (item) => item.fastCount);
    const totalFastDuration = sum(overview, (item) => item.fastDurationMinutes);
    const averageFastDuration =
      fastCount > 0 ? Math.round((totalFastDuration / fastCount) * 10) / 10 : 0;

    return {
      totalRemainingCalories,
      averageRemainingCalories:
        overview.length > 0
          ? Math.round((totalRemainingCalories / overview.length) * 10) / 10
          : 0,
      totalConsumedCalories,
      averageConsumedCalories:
        overview.length > 0
          ? Math.round((totalConsumedCalories / overview.length) * 10) / 10
          : 0,
      totalCaloriesBurned,
      totalSportDuration,
      averageWeight,
      totalWater,
      averageWater,
      fastCount,
      totalFastDuration,
      averageFastDuration,
    };
  }, [overview]);

  const handleDaysChange = async (event) => {
    const newDays = Number(event.target.value);
    setDays(newDays);
    await fetchStatistics(newDays);
  };

  const handleNutrientToggle = (nutrientKey) => {
    setSelectedNutrients((currentNutrients) => {
      if (currentNutrients.includes(nutrientKey)) {
        return currentNutrients.filter((key) => key !== nutrientKey);
      }

      return [...currentNutrients, nutrientKey];
    });
  };

  return (
    <section className="page">
      <div className="page-header statistics-page-header">
        <div>
          <p className="eyebrow">{t("statistics")}</p>
          <h1>{t("statistics")}</h1>
        </div>

        <div className="page-header-actions inline-actions">
          <button
            type="button"
            className="secondary-button compact"
            onClick={() => navigate("/meals")}
          >
            <Utensils size={15} />
            {t("editMeals")}
          </button>

          <button
            type="button"
            className="secondary-button compact"
            onClick={() => navigate("/sport")}
          >
            <Dumbbell size={15} />
            {t("editSport")}
          </button>
        </div>
      </div>

      <div className="content-card statistics-filter-card">
        <div className="statistics-filter-grid one-field">
          <label>
            {t("statisticsPeriod")}
            <select className="form-select" value={days} onChange={handleDaysChange}>
              <option value={7}>{t("last7Days")}</option>
              <option value={14}>{t("last14Days")}</option>
              <option value={30}>{t("last30Days")}</option>
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="content-card">
          <p>{t("loading")}</p>
        </div>
      ) : (
        <>
          <div className="statistics-summary-grid">
            <article className="summary-card highlight-card">
              <span>{t("caloriesRemaining")}</span>
              <strong>{formatValue(periodSummary.totalRemainingCalories, "kcal")}</strong>
              <p>
                {t("averagePerDay")}: {formatValue(periodSummary.averageRemainingCalories, "kcal")}
              </p>
            </article>

            <article className="summary-card">
              <span>{t("consumedCalories")}</span>
              <strong>{formatValue(periodSummary.totalConsumedCalories, "kcal")}</strong>
              <p>
                {t("averagePerDay")}: {formatValue(periodSummary.averageConsumedCalories, "kcal")}
              </p>
            </article>

            <article className="summary-card">
              <span>{t("burnedCalories")}</span>
              <strong>{formatValue(periodSummary.totalCaloriesBurned, "kcal")}</strong>
              <p>
                {t("movementDuration")}: {formatValue(periodSummary.totalSportDuration, "min")}
              </p>
            </article>

            <article className="summary-card">
              <span>{t("averageWeight")}</span>
              <strong>
                {periodSummary.averageWeight
                  ? formatValue(periodSummary.averageWeight, "kg")
                  : t("notRecorded")}
              </strong>
              <p>{t("selectedPeriod")}: {days} {t("days")}</p>
            </article>

            <article className="summary-card">
              <span>{t("waterConsumedTitle")}</span>
              <strong>{formatValue(periodSummary.totalWater, "ml")}</strong>
              <p>
                {t("averagePerDay")}: {formatValue(periodSummary.averageWater, "ml")}
              </p>
            </article>

            <article className="summary-card">
              <span>{t("fasting")}</span>
              <strong>{periodSummary.fastCount} {t("fasts")}</strong>
              <p>
                {t("total")}: {formatDuration(periodSummary.totalFastDuration)} · {t("average")}: {formatDuration(periodSummary.averageFastDuration)}
              </p>
            </article>
          </div>

          <div className="statistics-chart-grid">
            <article className="content-card chart-card">
              <div className="chart-title">
                <Flame size={19} />
                <h2>{t("calorieEvolution")}</h2>
              </div>

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shortDate" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="consumedCalories" name={t("consumedCalories")} />
                    <Bar dataKey="remainingCalories" name={t("caloriesRemaining")} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="content-card chart-card">
              <div className="chart-title">
                <Scale size={19} />
                <h2>{t("weightEvolution")}</h2>
              </div>

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shortDate" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="weightKg" name={t("weight")} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="content-card chart-card">
              <div className="chart-title">
                <Utensils size={19} />
                <h2>{t("nutrientEvolution")}</h2>
              </div>

              <div className="nutrient-selector">
                {nutrientOptions.map((nutrient) => (
                  <button
                    key={nutrient.key}
                    type="button"
                    className={selectedNutrients.includes(nutrient.key) ? "active" : ""}
                    onClick={() => handleNutrientToggle(nutrient.key)}
                  >
                    {t(nutrient.labelKey)}
                  </button>
                ))}
              </div>

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shortDate" />
                    <YAxis />
                    <Tooltip />

                    {selectedNutrients.map((nutrientKey) => {
                      const nutrient = nutrientOptions.find((item) => item.key === nutrientKey);

                      return (
                        <Line
                          key={nutrientKey}
                          type="monotone"
                          dataKey={nutrientKey}
                          name={t(nutrient?.labelKey || nutrientKey)}
                          strokeWidth={2}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="content-card chart-card">
              <div className="chart-title">
                <Droplets size={19} />
                <h2>{t("waterEvolution")}</h2>
              </div>

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shortDate" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="waterConsumedMl" name={t("waterConsumedTitle")} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="content-card chart-card full-chart-card">
              <div className="chart-title">
                <Dumbbell size={19} />
                <h2>{t("sportEvolution")}</h2>
              </div>

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shortDate" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="caloriesBurned" name={t("burnedCalories")} />
                    <Bar dataKey="sportDurationMinutes" name={t("movementDuration")} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>
        </>
      )}
    </section>
  );
};

export default StatisticsPage;
