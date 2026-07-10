//frontend/src/pages/MealsPage.jsx

import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../api/axiosConfig";

const getToday = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

const roundValue = (value) => Math.round(Number(value || 0) * 10) / 10;

const mealTypes = ["Breakfast", "Lunch", "Snack", "Dinner", "Drink"];

const emptyMealForm = {
  date: getToday(),
  time: getCurrentTime(),
  mealType: "Breakfast",
};

const nutritionKeys = [
  "calories",
  "protein",
  "fiber",
  "fat",
  "saturatedFat",
  "unsaturatedFat",
  "carbs",
  "sugar",
  "addedSugar",
];

const emptyManualForm = {
  foodName: "",
  calories: "",
  protein: "",
  fiber: "",
  fat: "",
  saturatedFat: "",
  unsaturatedFat: "",
  carbs: "",
  sugar: "",
  addedSugar: "",
};

const buildLocalItemFromSavedItem = (item) => {
  const foodId =
    typeof item.food === "object" && item.food !== null
      ? item.food._id
      : item.food || item.foodId || "";

  return {
    localId: crypto.randomUUID(),
    foodId,
    source: item.source || (foodId ? "food" : "manual"),
    foodName: item.foodName,
    quantityGrams: item.quantityGrams || 0,
    calories: item.calories || 0,
    protein: item.protein || 0,
    fiber: item.fiber || 0,
    fat: item.fat || 0,
    saturatedFat: item.saturatedFat || 0,
    unsaturatedFat: item.unsaturatedFat || 0,
    carbs: item.carbs || 0,
    sugar: item.sugar || 0,
    addedSugar: item.addedSugar || 0,
  };
};

const MealsPage = () => {
  const { t } = useTranslation();

  const [foods, setFoods] = useState([]);
  const [meals, setMeals] = useState([]);
  const [mealHistory, setMealHistory] = useState([]);
  const [formData, setFormData] = useState(emptyMealForm);
  const [foodSearch, setFoodSearch] = useState("");
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [quantityGrams, setQuantityGrams] = useState("");
  const [manualForm, setManualForm] = useState(emptyManualForm);
  const [mealItems, setMealItems] = useState([]);
  const [editingMealId, setEditingMealId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({
    search: "",
    mealType: "",
    date: "",
  });

  const fetchFoods = async () => {
    const response = await api.get("/foods");
    setFoods(response.data);
  };

  const fetchMeals = async (date = formData.date) => {
    const response = await api.get(`/meals?date=${date}`);
    setMeals(response.data);
  };

  const fetchMealHistory = async (filters = historyFilters) => {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.mealType) params.append("mealType", filters.mealType);
    if (filters.date) params.append("date", filters.date);

    const response = await api.get(`/meals/history?${params.toString()}`);
    setMealHistory(response.data);
  };

  const fetchInitialData = async () => {
    try {
      await Promise.all([fetchFoods(), fetchMeals(getToday()), fetchMealHistory()]);
    } catch (error) {
      console.error("Failed to fetch meals page data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const filteredFoodSuggestions = useMemo(() => {
    const search = foodSearch.trim().toLowerCase();

    if (!search) return [];

    return foods
      .filter((food) => {
        const name = food.name?.toLowerCase() || "";
        const brand = food.brand?.toLowerCase() || "";
        const category = food.category?.toLowerCase() || "";
        return name.includes(search) || brand.includes(search) || category.includes(search);
      })
      .slice(0, 8);
  }, [foods, foodSearch]);

  const calculateItemNutrition = (food, quantity) => {
    const factor = Number(quantity || 0) / 100;

    return {
      calories: roundValue(food.calories * factor),
      protein: roundValue(food.protein * factor),
      fiber: roundValue(food.fiber * factor),
      fat: roundValue(food.fat * factor),
      saturatedFat: roundValue((food.saturatedFat || 0) * factor),
      unsaturatedFat: roundValue((food.unsaturatedFat || 0) * factor),
      carbs: roundValue(food.carbs * factor),
      sugar: roundValue(food.sugar * factor),
      addedSugar: roundValue(food.addedSugar * factor),
    };
  };

  const totals = useMemo(() => {
    return mealItems.reduce(
      (acc, item) => {
        nutritionKeys.forEach((key) => {
          acc[key] += Number(item[key] || 0);
        });

        return acc;
      },
      {
        calories: 0,
        protein: 0,
        fiber: 0,
        fat: 0,
        saturatedFat: 0,
        unsaturatedFat: 0,
        carbs: 0,
        sugar: 0,
        addedSugar: 0,
      }
    );
  }, [mealItems]);

  const handleFormChange = async (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    if (name === "date") {
      try {
        await fetchMeals(value);
      } catch (error) {
        console.error("Failed to fetch meals by date", error);
      }
    }
  };

  const handleFoodSearchChange = (event) => {
    setFoodSearch(event.target.value);
    setSelectedFoodId("");
  };

  const handleSelectFoodSuggestion = (food) => {
    setSelectedFoodId(food._id);
    setFoodSearch(`${food.name}${food.brand ? ` · ${food.brand}` : ""}`);
  };

  const handleManualChange = (event) => {
    const { name, value } = event.target;

    setManualForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleHistoryFilterChange = (event) => {
    const { name, value } = event.target;

    const nextFilters = {
      ...historyFilters,
      [name]: value,
    };

    setHistoryFilters(nextFilters);
    fetchMealHistory(nextFilters).catch((error) => {
      console.error("Failed to fetch meal history", error);
    });
  };

  const clearHistoryFilters = () => {
    const clearedFilters = { search: "", mealType: "", date: "" };

    setHistoryFilters(clearedFilters);
    fetchMealHistory(clearedFilters).catch((error) => {
      console.error("Failed to fetch meal history", error);
    });
  };

  const handleAddFoodToMeal = () => {
    if (!quantityGrams || Number(quantityGrams) <= 0) return;

    const selectedFood =
      foods.find((food) => food._id === selectedFoodId) || filteredFoodSuggestions[0];

    if (!selectedFood) return;

    const nutrition = calculateItemNutrition(selectedFood, quantityGrams);

    const newItem = {
      localId: crypto.randomUUID(),
      foodId: selectedFood._id,
      source: "food",
      foodName: selectedFood.name,
      quantityGrams: Number(quantityGrams),
      ...nutrition,
    };

    setMealItems((currentItems) => [...currentItems, newItem]);
    setSelectedFoodId("");
    setFoodSearch("");
    setQuantityGrams("");
  };

  const handleAddManualEstimate = () => {
    const hasNutritionValue = nutritionKeys.some(
      (key) => Number(manualForm[key] || 0) > 0
    );

    if (!manualForm.foodName.trim() && !hasNutritionValue) return;

    const newItem = {
      localId: crypto.randomUUID(),
      foodId: "",
      source: "manual",
      foodName: manualForm.foodName.trim() || t("manualMealName"),
      quantityGrams: 0,
      ...Object.fromEntries(
        nutritionKeys.map((key) => [key, roundValue(manualForm[key])])
      ),
    };

    setMealItems((currentItems) => [...currentItems, newItem]);
    setManualForm(emptyManualForm);
  };

  const handleRemoveItem = (localId) => {
    setMealItems((currentItems) =>
      currentItems.filter((item) => item.localId !== localId)
    );
  };

  const resetMealForm = () => {
    setFormData({
      date: getToday(),
      time: getCurrentTime(),
      mealType: "Breakfast",
    });

    setSelectedFoodId("");
    setFoodSearch("");
    setQuantityGrams("");
    setManualForm(emptyManualForm);
    setMealItems([]);
    setEditingMealId(null);
  };

  const buildPayloadItem = (item) => {
    if (item.foodId) {
      return {
        foodId: item.foodId,
        quantityGrams: item.quantityGrams,
      };
    }

    return {
      foodName: item.foodName,
      quantityGrams: item.quantityGrams,
      calories: item.calories,
      protein: item.protein,
      fiber: item.fiber,
      fat: item.fat,
      saturatedFat: item.saturatedFat,
      unsaturatedFat: item.unsaturatedFat,
      carbs: item.carbs,
      sugar: item.sugar,
      addedSugar: item.addedSugar,
    };
  };

  const handleSubmitMeal = async (event) => {
    event.preventDefault();

    if (mealItems.length === 0) return;

    try {
      setSaving(true);

      const payload = {
        date: formData.date,
        time: formData.time,
        mealType: formData.mealType,
        items: mealItems.map(buildPayloadItem),
      };

      if (editingMealId) {
        await api.put(`/meals/${editingMealId}`, payload);
      } else {
        await api.post("/meals", payload);
      }

      await Promise.all([fetchMeals(formData.date), fetchMealHistory()]);
      resetMealForm();
    } catch (error) {
      console.error("Failed to save meal", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditMeal = (meal) => {
    setEditingMealId(meal._id);

    setFormData({
      date: meal.date,
      time: meal.time,
      mealType: meal.mealType,
    });

    setMealItems(meal.items.map(buildLocalItemFromSavedItem));

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUseAgain = async (meal) => {
    setEditingMealId(null);
    setFormData((currentForm) => ({
      ...currentForm,
      mealType: meal.mealType,
      time: getCurrentTime(),
    }));
    setMealItems(meal.items.map(buildLocalItemFromSavedItem));

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteMeal = async (mealId) => {
    const confirmed = window.confirm(t("confirmDeleteMeal"));

    if (!confirmed) return;

    try {
      await api.delete(`/meals/${mealId}`);
      await Promise.all([fetchMeals(formData.date), fetchMealHistory()]);
    } catch (error) {
      console.error("Failed to delete meal", error);
    }
  };

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
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("meals")}</p>
          <h1>{t("meals")}</h1>
        </div>
      </div>

      <div className={`content-card form-card ${editingMealId ? "meal-form-editing" : ""}`}>
        <div className="section-title">
          <div>
            <h2>{editingMealId ? t("editMeal") : t("addMeal")}</h2>
            <p>{t("addMealSubtitle")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmitMeal} className="meal-form">
          <div className="form-grid">
            <label>
              {t("date")}
              <input
                className="form-input"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleFormChange}
              />
            </label>

            <label>
              {t("time")}
              <input
                className="form-input"
                type="time"
                name="time"
                value={formData.time}
                onChange={handleFormChange}
              />
            </label>

            <label>
              {t("mealType")}
              <select
                className="form-select"
                name="mealType"
                value={formData.mealType}
                onChange={handleFormChange}
              >
                {mealTypes.map((type) => (
                  <option key={type} value={type}>
                    {t(type)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="meal-entry-panels">
            <div className="add-food-row food-search-panel">
              <div className="panel-heading">
                <h3>{t("addFoodFromDatabase")}</h3>
                <p>{t("foodSearchMealHint")}</p>
              </div>

              <label className="food-search-label">
                {t("searchFood")}
                <div className="search-input-wrap">
                  <Search size={17} />
                  <input
                    className="form-input"
                    type="text"
                    value={foodSearch}
                    onChange={handleFoodSearchChange}
                    placeholder={t("searchFoodPlaceholder")}
                  />
                </div>
              </label>

              {filteredFoodSuggestions.length > 0 && !selectedFoodId && (
                <div className="food-suggestion-list">
                  {filteredFoodSuggestions.map((food) => (
                    <button
                      key={food._id}
                      type="button"
                      className="food-suggestion-button"
                      onClick={() => handleSelectFoodSuggestion(food)}
                    >
                      <span>{food.name}</span>
                      <small>
                        {food.brand || t("noBrand")} · {food.calories || 0} kcal / 100g
                      </small>
                    </button>
                  ))}
                </div>
              )}

              <label>
                {t("quantityGrams")}
                <input
                  className="form-input"
                  type="number"
                  step="0.1"
                  value={quantityGrams}
                  onChange={(event) => setQuantityGrams(event.target.value)}
                  placeholder="100"
                />
              </label>

              <button
                type="button"
                className="secondary-button add-item-button"
                onClick={handleAddFoodToMeal}
              >
                <Plus size={17} />
                {t("add")}
              </button>
            </div>

            <div className="manual-entry-card">
              <div className="panel-heading">
                <h3>{t("addManualEstimate")}</h3>
                <p>{t("manualMealSubtitle")}</p>
              </div>

              <div className="manual-entry-grid full-nutrition-grid">
                <label>
                  {t("manualMealName")}
                  <input
                    className="form-input"
                    type="text"
                    name="foodName"
                    value={manualForm.foodName}
                    onChange={handleManualChange}
                    placeholder={t("manualMealNamePlaceholder")}
                  />
                </label>

                {nutritionKeys.map((key) => (
                  <label key={key}>
                    {t(key)}
                    <input
                      className="form-input"
                      type="number"
                      step="0.1"
                      name={key}
                      value={manualForm[key]}
                      onChange={handleManualChange}
                      placeholder="0"
                    />
                  </label>
                ))}
              </div>

              <button
                type="button"
                className="secondary-button add-item-button"
                onClick={handleAddManualEstimate}
              >
                <Plus size={17} />
                {t("addManualEstimate")}
              </button>
            </div>
          </div>

          {foods.length === 0 && (
            <div className="info-box">
              <p>{t("noFoodsForMeal")}</p>
            </div>
          )}

          {mealItems.length > 0 && (
            <div className="meal-preview">
              <h3>{t("mealPreview")}</h3>

              <div className="meal-items-list">
                {mealItems.map((item) => (
                  <article key={item.localId} className="meal-item-card">
                    <div>
                      <h4>{item.foodName}</h4>
                      <p>
                        {item.source === "manual"
                          ? t("addManualEstimate")
                          : `${item.quantityGrams} g`}
                      </p>
                    </div>

                    <div className="meal-item-values">
                      <span>{item.calories} kcal</span>
                      <span>{item.protein}g {t("proteinShort")}</span>
                      <span>{item.fiber}g {t("fiberShort")}</span>
                      <span>{item.fat}g {t("fatShort")}</span>
                      <span>{item.carbs}g {t("carbsShort")}</span>
                    </div>

                    <button
                      type="button"
                      className="small-icon-button danger"
                      onClick={() => handleRemoveItem(item.localId)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))}
              </div>

              <div className="meal-total-card">
                <span>{t("mealTotals")}</span>

                <div className="nutrition-pills">
                  <span>{roundValue(totals.calories)} kcal</span>
                  <span>{roundValue(totals.protein)}g {t("proteinShort")}</span>
                  <span>{roundValue(totals.fiber)}g {t("fiberShort")}</span>
                  <span>{roundValue(totals.fat)}g {t("fatShort")}</span>
                  <span>{roundValue(totals.saturatedFat)}g {t("saturatedFatShort")}</span>
                  <span>{roundValue(totals.unsaturatedFat)}g {t("unsaturatedFatShort")}</span>
                  <span>{roundValue(totals.carbs)}g {t("carbsShort")}</span>
                  <span>{roundValue(totals.sugar)}g {t("sugarShort")}</span>
                  <span>{roundValue(totals.addedSugar)}g {t("addedSugarShort")}</span>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={resetMealForm}>
              {editingMealId ? t("cancelEdit") : t("cancel")}
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving || mealItems.length === 0}
            >
              {saving ? t("loading") : editingMealId ? t("updateMeal") : t("saveMeal")}
            </button>
          </div>
        </form>
      </div>

      <div className="content-card">
        <div className="section-title">
          <div>
            <h2>{t("mealsForSelectedDay")}</h2>
            <p>{formData.date}</p>
          </div>
        </div>

        {meals.length === 0 ? (
          <div className="empty-state">
            <p>{t("noMealsForDay")}</p>
          </div>
        ) : (
          <div className="saved-meals-list">
            {meals.map((meal) => (
              <article key={meal._id} className="saved-meal-card">
                <div className="saved-meal-header">
                  <div>
                    <h3>{t(meal.mealType)}</h3>
                    <p>
                      {meal.time} · {t("nextMeal")}: {meal.nextMealTime}
                    </p>
                  </div>

                  <div className="saved-meal-actions">
                    <button
                      type="button"
                      className="small-icon-button"
                      onClick={() => handleEditMeal(meal)}
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      type="button"
                      className="small-icon-button danger"
                      onClick={() => handleDeleteMeal(meal._id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="nutrition-pills">
                  <span>{meal.totals.calories} kcal</span>
                  <span>{meal.totals.protein}g {t("proteinShort")}</span>
                  <span>{meal.totals.fiber}g {t("fiberShort")}</span>
                  <span>{meal.totals.fat}g {t("fatShort")}</span>
                  <span>{meal.totals.carbs}g {t("carbsShort")}</span>
                  <span>{meal.totals.sugar}g {t("sugarShort")}</span>
                </div>

                <div className="saved-meal-foods">
                  {meal.items.map((item, index) => (
                    <p key={`${meal._id}-${index}`}>
                      {item.foodName} · {item.source === "manual" ? t("addManualEstimate") : `${item.quantityGrams} g`}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="content-card history-card">
        <div className="section-title">
          <div>
            <h2>{t("mealHistory")}</h2>
            <p>{t("mealHistorySubtitle")}</p>
          </div>
        </div>

        <div className="filter-grid history-filter-grid">
          <label>
            {t("search")}
            <input
              className="form-input"
              type="text"
              name="search"
              value={historyFilters.search}
              onChange={handleHistoryFilterChange}
              placeholder={t("searchPlaceholder")}
            />
          </label>

          <label>
            {t("mealType")}
            <select
              className="form-select"
              name="mealType"
              value={historyFilters.mealType}
              onChange={handleHistoryFilterChange}
            >
              <option value="">{t("all")}</option>
              {mealTypes.map((type) => (
                <option key={type} value={type}>
                  {t(type)}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t("date")}
            <input
              className="form-input"
              type="date"
              name="date"
              value={historyFilters.date}
              onChange={handleHistoryFilterChange}
            />
          </label>

          <button type="button" className="secondary-button" onClick={clearHistoryFilters}>
            {t("clearFilters")}
          </button>
        </div>

        {mealHistory.length === 0 ? (
          <div className="empty-state">
            <p>{t("noMealHistory")}</p>
          </div>
        ) : (
          <div className="saved-meals-list history-list">
            {mealHistory.map((meal) => (
              <article key={meal._id} className="saved-meal-card">
                <div className="saved-meal-header">
                  <div>
                    <h3>{t(meal.mealType)}</h3>
                    <p>{meal.date} · {meal.time}</p>
                  </div>

                  <button
                    type="button"
                    className="small-action-button"
                    onClick={() => handleUseAgain(meal)}
                  >
                    <RotateCcw size={15} />
                    {t("useAgain")}
                  </button>
                </div>

                <div className="nutrition-pills">
                  <span>{meal.totals.calories} kcal</span>
                  <span>{meal.totals.protein}g {t("proteinShort")}</span>
                  <span>{meal.totals.fiber}g {t("fiberShort")}</span>
                  <span>{meal.totals.fat}g {t("fatShort")}</span>
                  <span>{meal.totals.carbs}g {t("carbsShort")}</span>
                </div>

                <div className="saved-meal-foods">
                  {meal.items.map((item, index) => (
                    <p key={`${meal._id}-history-${index}`}>
                      {item.foodName} · {item.source === "manual" ? t("addManualEstimate") : `${item.quantityGrams} g`}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default MealsPage;
