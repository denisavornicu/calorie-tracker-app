import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../api/axiosConfig";

const getToday = () => new Date().toISOString().slice(0, 10);

const getCurrentTime = () => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

const roundValue = (value) => Math.round(Number(value || 0) * 10) / 10;

const mealTypes = ["Breakfast", "Lunch", "Snack", "Dinner", "Drink"];

const emptyMealForm = {
  date: getToday(),
  time: getCurrentTime(),
  mealType: "Breakfast",
};

const MealsPage = () => {
  const { t } = useTranslation();

  const [foods, setFoods] = useState([]);
  const [meals, setMeals] = useState([]);
  const [formData, setFormData] = useState(emptyMealForm);
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [quantityGrams, setQuantityGrams] = useState("");
  const [mealItems, setMealItems] = useState([]);
  const [editingMealId, setEditingMealId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchFoods = async () => {
    const response = await api.get("/foods");
    setFoods(response.data);
  };

  const fetchMeals = async (date = formData.date) => {
    const response = await api.get(`/meals?date=${date}`);
    setMeals(response.data);
  };

  const fetchInitialData = async () => {
    try {
      await Promise.all([fetchFoods(), fetchMeals(getToday())]);
    } catch (error) {
      console.error("Failed to fetch meals page data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

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
        acc.calories += item.calories;
        acc.protein += item.protein;
        acc.fiber += item.fiber;
        acc.fat += item.fat;
        acc.saturatedFat += item.saturatedFat;
        acc.unsaturatedFat += item.unsaturatedFat;
        acc.carbs += item.carbs;
        acc.sugar += item.sugar;
        acc.addedSugar += item.addedSugar;

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

  const handleAddFoodToMeal = () => {
    if (!selectedFoodId || !quantityGrams || Number(quantityGrams) <= 0) {
      return;
    }

    const selectedFood = foods.find((food) => food._id === selectedFoodId);

    if (!selectedFood) {
      return;
    }

    const nutrition = calculateItemNutrition(selectedFood, quantityGrams);

    const newItem = {
      localId: crypto.randomUUID(),
      foodId: selectedFood._id,
      foodName: selectedFood.name,
      quantityGrams: Number(quantityGrams),
      ...nutrition,
    };

    setMealItems((currentItems) => [...currentItems, newItem]);
    setSelectedFoodId("");
    setQuantityGrams("");
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
  setQuantityGrams("");
  setMealItems([]);
  setEditingMealId(null);
};

  const handleSubmitMeal = async (event) => {
  event.preventDefault();

  if (mealItems.length === 0) {
    return;
  }

  try {
    setSaving(true);

    const payload = {
      date: formData.date,
      time: formData.time,
      mealType: formData.mealType,
      items: mealItems.map((item) => ({
        foodId: item.foodId,
        quantityGrams: item.quantityGrams,
      })),
    };

    if (editingMealId) {
      await api.put(`/meals/${editingMealId}`, payload);
    } else {
      await api.post("/meals", payload);
    }

    await fetchMeals(formData.date);
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

  const editableItems = meal.items.map((item) => ({
    localId: crypto.randomUUID(),
    foodId: item.food || item.foodId,
    foodName: item.foodName,
    quantityGrams: item.quantityGrams,
    calories: item.calories || 0,
    protein: item.protein || 0,
    fiber: item.fiber || 0,
    fat: item.fat || 0,
    saturatedFat: item.saturatedFat || 0,
    unsaturatedFat: item.unsaturatedFat || 0,
    carbs: item.carbs || 0,
    sugar: item.sugar || 0,
    addedSugar: item.addedSugar || 0,
  }));

  setMealItems(editableItems);

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

  const handleDeleteMeal = async (mealId) => {
    const confirmed = window.confirm(t("confirmDeleteMeal"));

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/meals/${mealId}`);
      await fetchMeals(formData.date);
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

          <div className="add-food-row">
            <label>
              {t("selectFood")}
              <select
                className="form-select"
                value={selectedFoodId}
                onChange={(event) => setSelectedFoodId(event.target.value)}
              >
                <option value="">{t("chooseFood")}</option>

                {foods.map((food) => (
                  <option key={food._id} value={food._id}>
                    {food.name} - {food.calories || 0} kcal / 100g
                  </option>
                ))}
              </select>
            </label>

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
                      <p>{item.quantityGrams} g</p>
                    </div>

                    <div className="meal-item-values">
                      <span>{item.calories} kcal</span>
                      <span>{item.protein}g {t("proteinShort")}</span>
                      <span>{item.fiber}g {t("fiberShort")}</span>
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
                  <span>{roundValue(totals.carbs)}g {t("carbsShort")}</span>
                  <span>{roundValue(totals.sugar)}g {t("sugarShort")}</span>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
  type="button"
  className="secondary-button"
  onClick={resetMealForm}
>
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
                      {item.foodName} · {item.quantityGrams} g
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