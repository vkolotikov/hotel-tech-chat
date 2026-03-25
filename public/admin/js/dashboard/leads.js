const createLeadsModule = (context) => {
  const { state, elements, fetchJson, formatDate, loadChats } = context;

  const openLeadEditor = (lead) => {
    if (!elements.leadEditor || !elements.leadEditorForm) {
      return;
    }
    elements.leadEditorForm.dataset.leadId = String(lead.id || "");
    elements.leadEditName.value = lead.name || "";
    elements.leadEditEmail.value = lead.email || "";
    elements.leadEditCompany.value = lead.company || "";
    elements.leadEditPhone.value = lead.phone || "";
    elements.leadEditNotes.value = lead.notes || "";
    elements.leadEditImportant.checked = Number(lead.is_important || 0) === 1;
    elements.leadEditor.hidden = false;
  };

  const closeLeadEditor = () => {
    if (!elements.leadEditor || !elements.leadEditorForm) {
      return;
    }
    elements.leadEditor.hidden = true;
    elements.leadEditorForm.dataset.leadId = "";
  };

  const saveLead = async (event) => {
    event.preventDefault();
    if (!elements.leadEditorForm) {
      return;
    }
    const leadId = Number(elements.leadEditorForm.dataset.leadId || 0);
    if (!leadId) {
      return;
    }
    const payload = {
      name: elements.leadEditName.value.trim(),
      email: elements.leadEditEmail.value.trim(),
      company: elements.leadEditCompany.value.trim(),
      phone: elements.leadEditPhone.value.trim(),
      notes: elements.leadEditNotes.value.trim(),
      is_important: elements.leadEditImportant.checked
    };
    try {
      await fetchJson(`${API_BASE}/admin/leads/${leadId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      closeLeadEditor();
      await loadLeads();
      if (typeof loadChats === "function") {
        await loadChats();
      }
    } catch (err) {
      window.alert(err.message);
    }
  };

  const getLeadDateRange = (filterValue) => {
    if (!filterValue || filterValue === "all") {
      return null;
    }
    const now = new Date();
    const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
    const startOfWeek = (date) => {
      const day = (date.getDay() + 6) % 7; // Monday = 0
      return addDays(startOfDay(date), -day);
    };
    const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
    const startOfYear = (date) => new Date(date.getFullYear(), 0, 1);

    switch (filterValue) {
      case "today": {
        const start = startOfDay(now);
        return { start, end: addDays(start, 1) };
      }
      case "yesterday": {
        const end = startOfDay(now);
        return { start: addDays(end, -1), end };
      }
      case "this_week": {
        const start = startOfWeek(now);
        return { start, end: addDays(start, 7) };
      }
      case "last_week": {
        const end = startOfWeek(now);
        return { start: addDays(end, -7), end };
      }
      case "this_month": {
        const start = startOfMonth(now);
        return { start, end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
      }
      case "last_month": {
        const end = startOfMonth(now);
        return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end };
      }
      case "this_year": {
        const start = startOfYear(now);
        return { start, end: new Date(now.getFullYear() + 1, 0, 1) };
      }
      case "last_year": {
        const end = startOfYear(now);
        return { start: new Date(now.getFullYear() - 1, 0, 1), end };
      }
      default:
        return null;
    }
  };

  const normalizeLeadSearch = (lead) =>
    [
      lead.name,
      lead.email,
      lead.company,
      lead.phone,
      lead.notes
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

  const filterLeads = (leads) => {
    const query = elements.leadsSearch ? elements.leadsSearch.value.trim().toLowerCase() : "";
    const dateFilter = elements.leadsDate ? elements.leadsDate.value : "all";
    const importance = elements.leadsImportance ? elements.leadsImportance.value : "all";
    const range = getLeadDateRange(dateFilter);

    return (leads || []).filter((lead) => {
      if (importance === "important" && Number(lead.is_important || 0) !== 1) {
        return false;
      }
      if (importance === "not_important" && Number(lead.is_important || 0) === 1) {
        return false;
      }
      if (range) {
        const created = new Date(lead.created_at);
        if (Number.isNaN(created.getTime())) {
          return false;
        }
        if (created < range.start || created >= range.end) {
          return false;
        }
      }
      if (query) {
        const haystack = normalizeLeadSearch(lead);
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    });
  };

  const renderLeads = (leads) => {
    elements.leadsBody.innerHTML = "";
    (leads || []).forEach((lead) => {
      const row = document.createElement("tr");
      const importantCell = document.createElement("td");
      importantCell.className = "lead-importance";
      const important = Number(lead.is_important || 0) === 1;
      if (important) {
        const badge = document.createElement("span");
        badge.className = "badge important";
        badge.textContent = "Important";
        importantCell.appendChild(badge);
      } else {
        const empty = document.createElement("span");
        empty.className = "chat-meta";
        empty.textContent = "-";
        importantCell.appendChild(empty);
      }

      const nameCell = document.createElement("td");
      nameCell.textContent = lead.name || "-";

      const emailCell = document.createElement("td");
      emailCell.textContent = lead.email || "-";

      const companyCell = document.createElement("td");
      companyCell.textContent = lead.company || "-";

      const phoneCell = document.createElement("td");
      phoneCell.className = "lead-mobile";
      phoneCell.textContent = lead.phone || "-";

      const notesCell = document.createElement("td");
      notesCell.className = "lead-notes";
      notesCell.textContent = lead.notes || "-";
      notesCell.title = lead.notes || "";

      const dateCell = document.createElement("td");
      dateCell.textContent = formatDate(lead.created_at);

      const actionsCell = document.createElement("td");
      actionsCell.className = "lead-actions";
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "lead-action-btn";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => openLeadEditor(lead));
      actionsCell.appendChild(editBtn);

      row.appendChild(importantCell);
      row.appendChild(nameCell);
      row.appendChild(emailCell);
      row.appendChild(companyCell);
      row.appendChild(phoneCell);
      row.appendChild(notesCell);
      row.appendChild(dateCell);
      row.appendChild(actionsCell);
      elements.leadsBody.appendChild(row);
    });
  };

  const loadLeads = async () => {
    const data = await fetchJson(`${API_BASE}/admin/leads`);
    state.leads = data.leads || [];
    renderLeads(filterLeads(state.leads));
  };

  return {
    openLeadEditor,
    closeLeadEditor,
    saveLead,
    getLeadDateRange,
    normalizeLeadSearch,
    filterLeads,
    renderLeads,
    loadLeads
  };
};
