import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../utils/apiFetch";
import { listEvents } from "../services/serviceEvent";
import { OpalSelect } from "../components/componentMenus";
import "./pageBudgetManagement.css";
import "./tabs/workspaceTabShell.css";
import "../components/componentTheme.css";
import { GlassPanel, icons, P } from "../components/componentTheme";

function BudgetStatCard({ label, value, icon, accent, className = "" }) {
  const colors = {
    teal: { bg: "rgba(77, 231, 227, 0.1)", color: "#4de7e3", border: "rgba(77, 231, 227, 0.28)" },
    blue: { bg: "rgba(59, 130, 246, 0.14)", color: P.blue, border: "rgba(59, 130, 246, 0.32)" },
    violet: { bg: "rgba(139, 109, 255, 0.14)", color: "#9b7cff", border: "rgba(139, 109, 255, 0.28)" },
  };
  const style = colors[accent] || colors.violet;

  return (
    <GlassPanel className={`workspace-stat-card ${className}`.trim()}>
      <span
        className="workspace-stat-icon"
        style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
      >
        {icon}
      </span>
      <span>{label}</span>
      <p>{value}</p>
    </GlassPanel>
  );
}

function BudgetManagement({ eventId: propEventId }) {
  const { eventId: routeEventId } = useParams();
  const eventId = propEventId || routeEventId;
  const isStandalone = !propEventId;
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(eventId || "");
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditingPlannedBudget, setIsEditingPlannedBudget] = useState(false);
  const [plannedTotalInput, setPlannedTotalInput] = useState("");
  const [breakdownInputs, setBreakdownInputs] = useState([]);

  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    category: "",
    description: "",
    amount: "",
    paymentDate: "",
  });

  const [editingExpenseId, setEditingExpenseId] = useState(null);

  const [editExpenseForm, setEditExpenseForm] = useState({
    category: "",
    description: "",
    amount: "",
    paymentDate: "",
  });


  useEffect(() => {
    if (!isStandalone) return;
    listEvents()
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch((error) => console.error("Load events error:", error));
  }, [isStandalone]);

  useEffect(() => {
    if (eventId) {
      setSelectedEventId(eventId);
    }
  }, [eventId]);

  useEffect(() => {
    async function loadBudgetForEvent() {
        const targetEventId = propEventId || routeEventId || selectedEventId;
        if (!targetEventId) {
        setBudgetData(null);
        return;
        }

        try {
        setLoading(true);

        const data = await apiFetch(`/budget/event/${targetEventId}`);

        setBudgetData(data);
        setSelectedEventId(targetEventId);
        setPlannedTotalInput(data.plannedTotal || 0);
        setBreakdownInputs(data.plannedBreakdown || []);
        } catch (error) {
        console.error("Load budget error:", error);
        alert(error.message || "Something went wrong while loading budget.");
        } finally {
        setLoading(false);
        }
    }

    loadBudgetForEvent();
    }, [propEventId, routeEventId, selectedEventId]);

  function formatMoney(amount) {
    if (!budgetData) {
      return amount;
    }

    return `${Number(amount).toLocaleString()} ${budgetData.currency}`;
  }

    function updateBreakdownItem(index, field, value) {
    setBreakdownInputs((currentBreakdown) =>
        currentBreakdown.map((item, itemIndex) =>
        itemIndex === index
            ? {
                ...item,
                [field]: value,
            }
            : item
        )
    );
    }

    function addBreakdownItem() {
    setBreakdownInputs((currentBreakdown) => [
        ...currentBreakdown,
        {
        category: "",
        plannedAmount: 0,
        },
    ]);
    }

    function removeBreakdownItem(index) {
    setBreakdownInputs((currentBreakdown) =>
        currentBreakdown.filter((_, itemIndex) => itemIndex !== index)
    );
    }

    async function savePlannedBudget() {
    try {
        if (!selectedEventId) {
        alert("Please select an event first.");
        return;
        }

        const cleanedBreakdown = breakdownInputs
        .filter((item) => item.category.trim() !== "")
        .map((item) => ({
            category: item.category.trim(),
            plannedAmount: Number(item.plannedAmount || 0),
        }));

        const finalPlannedTotal =
        Number(plannedTotalInput) > 0
            ? Number(plannedTotalInput)
            : cleanedBreakdown.reduce(
                (total, item) => total + item.plannedAmount,
                0
            );

        await apiFetch(`/budget/event/${selectedEventId}/planned`, {
            method: "PATCH",
            body: JSON.stringify({
            plannedTotal: finalPlannedTotal,
            currency: budgetData?.currency || "EGP",
            plannedBreakdown: cleanedBreakdown,
            }),
        });

        const refreshedData = await apiFetch(`/budget/event/${selectedEventId}`);

        setBudgetData(refreshedData);
        setPlannedTotalInput(refreshedData.plannedTotal || 0);
        setBreakdownInputs(refreshedData.plannedBreakdown || []);
        setIsEditingPlannedBudget(false);

        alert("Planned budget saved successfully.");
    } catch (error) {
        console.error("Save planned budget error:", error);
        alert(error.message || "Something went wrong while saving planned budget.");
    }
    }

    const breakdownTotal = breakdownInputs.reduce((total, item) => {
        return total + Number(item.plannedAmount || 0);
    }, 0);

    function updateExpenseForm(field, value) {
    setExpenseForm((currentForm) => ({
        ...currentForm,
        [field]: value,
    }));
    }

    async function saveActualExpense() {
    try {
        if (!selectedEventId) {
        alert("Please select an event first.");
        return;
        }

        if (!expenseForm.category || !expenseForm.description || !expenseForm.amount) {
        alert("Please fill category, description, and amount.");
        return;
        }

        await apiFetch(`/budget/event/${selectedEventId}/expenses`, {
            method: "POST",
            body: JSON.stringify({
            category: expenseForm.category,
            description: expenseForm.description,
            amount: Number(expenseForm.amount),
            currency: budgetData?.currency || "EGP",
            paymentDate: expenseForm.paymentDate,
            }),
        });

        const refreshedData = await apiFetch(`/budget/event/${selectedEventId}`);

        setBudgetData(refreshedData);
        setPlannedTotalInput(refreshedData.plannedTotal || 0);
        setBreakdownInputs(refreshedData.plannedBreakdown || []);

        setExpenseForm({
        category: "",
        description: "",
        amount: "",
        paymentDate: "",
        });

        setShowExpenseForm(false);

        alert("Actual expense saved successfully.");
    } catch (error) {
        console.error("Save actual expense error:", error);
        alert(error.message || "Something went wrong while saving the actual expense.");
    }
    }

    function startEditingExpense(expense) {
  setEditingExpenseId(expense._id);

  setEditExpenseForm({
    category: expense.category || "",
    description: expense.description || "",
    amount: expense.amount || "",
    paymentDate: expense.paymentDate
      ? new Date(expense.paymentDate).toISOString().split("T")[0]
      : "",
  });
}

function cancelEditingExpense() {
  setEditingExpenseId(null);

  setEditExpenseForm({
    category: "",
    description: "",
    amount: "",
    paymentDate: "",
  });
}

function updateEditExpenseForm(field, value) {
  setEditExpenseForm((currentForm) => ({
    ...currentForm,
    [field]: value,
  }));
}

async function saveEditedExpense() {
  try {
    if (!editingExpenseId) {
      return;
    }

    if (
      !editExpenseForm.category ||
      !editExpenseForm.description ||
      !editExpenseForm.amount
    ) {
      alert("Please fill category, description, and amount.");
      return;
    }

    await apiFetch(`/budget/expenses/${editingExpenseId}`, {
      method: "PATCH",
      body: JSON.stringify({
        category: editExpenseForm.category,
        description: editExpenseForm.description,
        amount: Number(editExpenseForm.amount),
        currency: budgetData?.currency || "EGP",
        paymentDate: editExpenseForm.paymentDate,
      }),
    });

    const refreshedData = await apiFetch(`/budget/event/${selectedEventId}`);

    setBudgetData(refreshedData);
    setEditingExpenseId(null);

    setEditExpenseForm({
      category: "",
      description: "",
      amount: "",
      paymentDate: "",
    });

    alert("Expense updated successfully.");
  } catch (error) {
    console.error("Update expense error:", error);
    alert(error.message || "Something went wrong while updating the expense.");
  }
}


  return (
    <div className="workspace-tab-shell budget-page">
      <div className="budget-header">
        <div>
          <h1>Budget Management</h1>
          <p>View planned budget, actual expenses, and remaining budget for this event.</p>
        </div>
      </div>

      {loading && (
        <GlassPanel className="budget-state-card">
          <p className="budget-loading">Loading budget...</p>
        </GlassPanel>
      )}

      {!loading && !budgetData && (
        <GlassPanel className="budget-state-card">
          {isStandalone ? (
            <div className="budget-event-picker">
              <p className="budget-empty">Select an event to view its budget.</p>
              <OpalSelect
                value={selectedEventId}
                onChange={setSelectedEventId}
                placeholder="Choose an event"
                options={events.map((event) => ({
                  value: event._id,
                  label: event.title || "Untitled event",
                }))}
              />
            </div>
          ) : (
            <p className="budget-empty">Select an event to view its budget.</p>
          )}
        </GlassPanel>
      )}

      {!loading && budgetData && (
        <>
          <div className="workspace-stat-grid budget-summary-cards">
            <BudgetStatCard
              label="Planned Total"
              value={formatMoney(budgetData.plannedTotal)}
              icon={icons.budget}
              accent="violet"
            />
            <BudgetStatCard
              label="Actual Total"
              value={formatMoney(budgetData.actualTotal)}
              icon={icons.barChart}
              accent="blue"
            />
            <BudgetStatCard
              label="Remaining / Difference"
              value={formatMoney(budgetData.difference)}
              icon={icons.check}
              accent="teal"
              className={
                budgetData.difference >= 0
                  ? "positive-difference-card"
                  : "negative-difference-card"
              }
            />
          </div>

          <div className="budget-sections">
            <GlassPanel className="budget-section">
              <div className="budget-section-header">
                <div>
                  <h2>Planned Budget Breakdown</h2>
                  <p>Manage the planned budget categories for this event.</p>
                </div>

                <button
                  className="edit-budget-button"
                  onClick={() => setIsEditingPlannedBudget(!isEditingPlannedBudget)}
                >
                  {isEditingPlannedBudget ? "Cancel" : "Edit Planned Budget"}
                </button>
              </div>

              <div className="budget-section-body">
              {!isEditingPlannedBudget && (
                <>
                  {budgetData.plannedBreakdown.length === 0 && (
                    <p className="budget-empty">No planned breakdown found.</p>
                  )}

                  <div className="budget-list">
                    {budgetData.plannedBreakdown.map((item, index) => (
                      <div className="budget-list-row" key={index}>
                        <span>{item.category}</span>
                        <strong>{formatMoney(item.plannedAmount)}</strong>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {isEditingPlannedBudget && (
                <div className="planned-budget-form">
                  <label>Planned Total Budget</label>

                  <input
                    type="number"
                    value={plannedTotalInput}
                    onChange={(event) => setPlannedTotalInput(event.target.value)}
                  />

                  <p className="breakdown-total">
                    Categories Total: {Number(breakdownTotal).toLocaleString()}{" "}
                    {budgetData?.currency || "EGP"}
                  </p>

                  <h3>Budget Categories</h3>

                  {breakdownInputs.map((item, index) => (
                    <div className="breakdown-edit-row" key={index}>
                      <input
                        type="text"
                        placeholder="Category"
                        value={item.category}
                        onChange={(event) =>
                          updateBreakdownItem(index, "category", event.target.value)
                        }
                      />

                      <input
                        type="number"
                        placeholder="Amount"
                        value={item.plannedAmount}
                        onChange={(event) =>
                          updateBreakdownItem(
                            index,
                            "plannedAmount",
                            event.target.value
                          )
                        }
                      />

                      <button
                        className="remove-breakdown-button"
                        onClick={() => removeBreakdownItem(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <div className="planned-budget-actions">
                    <button className="add-breakdown-button" onClick={addBreakdownItem}>
                      Add Category
                    </button>

                    <button className="save-budget-button" onClick={savePlannedBudget}>
                      Save Planned Budget
                    </button>
                  </div>
                </div>
              )}
              </div>
            </GlassPanel>

            <GlassPanel className="budget-section">
              <div className="budget-section-header">
                <div>
                  <h2>Actual Expense Records</h2>
                  <p>Track and edit the expenses already paid for this event.</p>
                </div>

                <button
                  className="edit-budget-button"
                  onClick={() => setShowExpenseForm(!showExpenseForm)}
                >
                  {showExpenseForm ? "Cancel" : "Add Expense"}
                </button>
              </div>

              <div className="budget-section-body">
              {showExpenseForm && (
                <div className="expense-form">
                  <input
                    type="text"
                    placeholder="Category"
                    value={expenseForm.category}
                    onChange={(event) =>
                      updateExpenseForm("category", event.target.value)
                    }
                  />

                  <input
                    type="text"
                    placeholder="Description"
                    value={expenseForm.description}
                    onChange={(event) =>
                      updateExpenseForm("description", event.target.value)
                    }
                  />

                  <input
                    type="number"
                    placeholder="Amount"
                    value={expenseForm.amount}
                    onChange={(event) =>
                      updateExpenseForm("amount", event.target.value)
                    }
                  />

                  <input
                    type="date"
                    className="opal-date-field"
                    value={expenseForm.paymentDate}
                    onChange={(event) =>
                      updateExpenseForm("paymentDate", event.target.value)
                    }
                  />

                  <button className="save-budget-button" onClick={saveActualExpense}>
                    Save Expense
                  </button>
                </div>
              )}

              {budgetData.actualExpenses.length === 0 && (
                <p className="budget-empty">No actual expenses found.</p>
              )}

              <div className="budget-list">
                {budgetData.actualExpenses.map((expense) => (
                  <div className="expense-row" key={expense._id}>
                    {editingExpenseId === expense._id ? (
                      <div className="expense-edit-form">
                        <input
                          type="text"
                          value={editExpenseForm.category}
                          onChange={(event) =>
                            updateEditExpenseForm("category", event.target.value)
                          }
                          placeholder="Category"
                        />

                        <input
                          type="text"
                          value={editExpenseForm.description}
                          onChange={(event) =>
                            updateEditExpenseForm("description", event.target.value)
                          }
                          placeholder="Description"
                        />

                        <input
                          type="number"
                          value={editExpenseForm.amount}
                          onChange={(event) =>
                            updateEditExpenseForm("amount", event.target.value)
                          }
                          placeholder="Amount"
                        />

                        <input
                          type="date"
                          className="opal-date-field"
                          value={editExpenseForm.paymentDate}
                          onChange={(event) =>
                            updateEditExpenseForm("paymentDate", event.target.value)
                          }
                        />

                        <button className="save-budget-button" onClick={saveEditedExpense}>
                          Save
                        </button>

                        <button
                          className="remove-breakdown-button"
                          onClick={cancelEditingExpense}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <h3>{expense.category}</h3>
                          <p>{expense.description}</p>
                          <small>
                            {expense.paymentDate
                              ? new Date(expense.paymentDate).toLocaleDateString()
                              : "No payment date"}
                          </small>
                        </div>

                        <div className="expense-actions">
                          <strong>{formatMoney(expense.amount)}</strong>

                          <button
                            className="edit-expense-button"
                            onClick={() => startEditingExpense(expense)}
                          >
                            Edit
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              </div>
            </GlassPanel>
          </div>

          <GlassPanel className="budget-comparison-section">
            <h2>Planned vs Actual by Category</h2>

            {budgetData.categoryComparison?.length === 0 && (
              <p className="budget-empty">No category comparison available.</p>
            )}

            <div className="comparison-list">
              {budgetData.categoryComparison?.map((item, index) => (
                <div className="comparison-row" key={index}>
                  <div>
                    <h3>{item.category}</h3>
                    <p>
                      Planned: {formatMoney(item.plannedAmount)} | Actual:{" "}
                      {formatMoney(item.actualAmount)}
                    </p>
                  </div>

                  <strong
                    className={
                      item.difference >= 0
                        ? "positive-difference"
                        : "negative-difference"
                    }
                  >
                    {formatMoney(item.difference)}
                  </strong>
                </div>
              ))}
            </div>
          </GlassPanel>
        </>
      )}
    </div>
  );
}

export default BudgetManagement;