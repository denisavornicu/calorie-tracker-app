import { useEffect, useState } from "react";
import { Edit3, Plus, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../api/axiosConfig";

const emptyFoodForm = {
  name: "",
  brand: "",
  category: "",
  calories: "",
  protein: "",
  fiber: "",
  fat: "",
  saturatedFat: "",
  unsaturatedFat: "",
  carbs: "",
  sugar: "",
  addedSugar: "",
  notes: "",
};

const numericFields = [
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

const FoodsPage = () => {
  const { t } = useTranslation();

  const [foods, setFoods] = useState([]);
  const [formData, setFormData] = useState(emptyFoodForm);
  const [showForm, setShowForm] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchFoods = async () => {
    try {
      const response = await api.get("/foods");
      setFoods(response.data);
    } catch (error) {
      console.error("Failed to fetch foods", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const resetForm = () => {
    setFormData(emptyFoodForm);
    setEditingFoodId(null);
    setShowForm(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const buildPayload = () => {
    const payload = {
      ...formData,
      category: formData.category || "Other",
    };

    numericFields.forEach((field) => {
      payload[field] = Number(payload[field] || 0);
    });

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    try {
      setSaving(true);

      const payload = buildPayload();

      if (editingFoodId) {
        await api.put(`/foods/${editingFoodId}`, payload);
      } else {
        await api.post("/foods", payload);
      }

      await fetchFoods();
      resetForm();
    } catch (error) {
      console.error("Failed to save food", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (food) => {
    setEditingFoodId(food._id);

    setFormData({
      name: food.name || "",
      brand: food.brand || "",
      category: food.category || "",
      calories: food.calories ?? "",
      protein: food.protein ?? "",
      fiber: food.fiber ?? "",
      fat: food.fat ?? "",
      saturatedFat: food.saturatedFat ?? "",
      unsaturatedFat: food.unsaturatedFat ?? "",
      carbs: food.carbs ?? "",
      sugar: food.sugar ?? "",
      addedSugar: food.addedSugar ?? "",
      notes: food.notes || "",
    });

    setShowForm(true);
  };

  const handleDelete = async (foodId) => {
    const confirmed = window.confirm(t("confirmDeleteFood"));

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/foods/${foodId}`);
      await fetchFoods();
    } catch (error) {
      console.error("Failed to delete food", error);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("foods")}</p>
          <h1>{t("foods")}</h1>
        </div>

        <button
          type="button"
          className="primary-button small"
          onClick={() => setShowForm((currentValue) => !currentValue)}
        >
          {showForm ? <X size={17} /> : <Plus size={17} />}
          {showForm ? t("close") : t("addFood")}
        </button>
      </div>

      {showForm && (
        <div className="content-card form-card">
          <div className="section-title">
            <div>
              <h2>{editingFoodId ? t("editFood") : t("addFood")}</h2>
              <p>{t("nutritionPer100g")}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="food-form">
            <div className="form-grid">
              <label>
                {t("foodName")}
                <input
                  className="form-input"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t("foodNamePlaceholder")}
                  required
                />
              </label>

              <label>
                {t("brand")}
                <input
                  className="form-input"
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder={t("optional")}
                />
              </label>

              <label>
                {t("category")}
                <input
                  className="form-input"
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Fruit, Dairy, Protein..."
                />
              </label>

              <label>
                {t("calories")}
                <input
                  className="form-input"
                  type="number"
                  step="0.1"
                  name="calories"
                  value={formData.calories}
                  onChange={handleChange}
                  placeholder="0"
                />
              </label>

              <label>
                {t("protein")}
                <input
                  className="form-input"
                  type="number"
                  step="0.1"
                  name="protein"
                  value={formData.protein}
                  onChange={handleChange}
                  placeholder="0"
                />
              </label>

              <label>
                {t("fiber")}
                <input
                  className="form-input"
                  type="number"
                  step="0.1"
                  name="fiber"
                  value={formData.fiber}
                  onChange={handleChange}
                  placeholder="0"
                />
              </label>

              <label>
                {t("fat")}
                <input
                  className="form-input"
                  type="number"
                  step="0.1"
                  name="fat"
                  value={formData.fat}
                  onChange={handleChange}
                  placeholder="0"
                />
              </label>

              <label>
                {t("saturatedFat")}
                <input
                  className="form-input"
                  type="number"
                  step="0.1"
                  name="saturatedFat"
                  value={formData.saturatedFat}
                  onChange={handleChange}
                  placeholder="0"
                />
              </label>

              <label>
                {t("unsaturatedFat")}
                <input
                  className="form-input"
                  type="number"
                  step="0.1"
                  name="unsaturatedFat"
                  value={formData.unsaturatedFat}
                  onChange={handleChange}
                  placeholder="0"
                />
              </label>

              <label>
                {t("carbs")}
                <input
                  className="form-input"
                  type="number"
                  step="0.1"
                  name="carbs"
                  value={formData.carbs}
                  onChange={handleChange}
                  placeholder="0"
                />
              </label>

              <label>
                {t("sugar")}
                <input
                  className="form-input"
                  type="number"
                  step="0.1"
                  name="sugar"
                  value={formData.sugar}
                  onChange={handleChange}
                  placeholder="0"
                />
              </label>

              <label>
                {t("addedSugar")}
                <input
                  className="form-input"
                  type="number"
                  step="0.1"
                  name="addedSugar"
                  value={formData.addedSugar}
                  onChange={handleChange}
                  placeholder="0"
                />
              </label>
            </div>

            <label>
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
                {t("cancel")}
              </button>

              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? t("loading") : t("save")}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="content-card">
        <div className="section-title">
          <div>
            <h2>{t("foodDatabase")}</h2>
            <p>{t("foodDatabaseSubtitle")}</p>
          </div>
        </div>

        {loading ? (
          <p>{t("loading")}</p>
        ) : foods.length === 0 ? (
          <div className="empty-state">
            <p>{t("noFoodsYet")}</p>
            <button
              type="button"
              className="primary-button small"
              onClick={() => setShowForm(true)}
            >
              + {t("addFood")}
            </button>
          </div>
        ) : (
          <>
            <div className="food-card-list">
              {foods.map((food) => (
                <article key={food._id} className="food-item-card">
                  <div className="food-item-header">
                    <div>
                      <h3>{food.name}</h3>
                      <p>
                        {food.brand || t("noBrand")} · {food.category || "Other"}
                      </p>
                    </div>

                    <div className="food-actions">
                      <button
                        type="button"
                        className="small-icon-button"
                        onClick={() => handleEdit(food)}
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        type="button"
                        className="small-icon-button danger"
                        onClick={() => handleDelete(food._id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="nutrition-pills">
                    <span>{food.calories || 0} kcal</span>
                    <span>{food.protein || 0}g {t("proteinShort")}</span>
                    <span>{food.fiber || 0}g {t("fiberShort")}</span>
                    <span>{food.fat || 0}g {t("fatShort")}</span>
                    <span>{food.carbs || 0}g {t("carbsShort")}</span>
                    <span>{food.sugar || 0}g {t("sugarShort")}</span>
                  </div>
                </article>
              ))}
            </div>

            <div className="table-wrapper desktop-food-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t("food")}</th>
                    <th>kcal</th>
                    <th>{t("proteinShort")}</th>
                    <th>{t("fiberShort")}</th>
                    <th>{t("fatShort")}</th>
                    <th>{t("carbsShort")}</th>
                    <th>{t("sugarShort")}</th>
                    <th>{t("actions")}</th>
                  </tr>
                </thead>

                <tbody>
                  {foods.map((food) => (
                    <tr key={food._id}>
                      <td>
                        <strong>{food.name}</strong>
                        <span>{food.brand || t("noBrand")}</span>
                      </td>
                      <td>{food.calories || 0}</td>
                      <td>{food.protein || 0}</td>
                      <td>{food.fiber || 0}</td>
                      <td>{food.fat || 0}</td>
                      <td>{food.carbs || 0}</td>
                      <td>{food.sugar || 0}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="small-icon-button"
                            onClick={() => handleEdit(food)}
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            type="button"
                            className="small-icon-button danger"
                            onClick={() => handleDelete(food._id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default FoodsPage;