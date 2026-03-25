const createAiModule = (context) => {
  const {
    state,
    elements,
    fetchJson,
    clampNumber,
    formatFileSize,
    formatUnixDate,
    truncateText,
    loadSettings,
    escapeHtml
  } = context;

  const safe = (value) => (escapeHtml ? escapeHtml(value) : String(value || ""));

  let behaviorInitialized = false;
  let behaviorHydrating = false;
  let knowledgeInitialized = false;
  let knowledgeHydrating = false;
  let settingsTrackingInitialized = false;

  const MARKERS = {
    behaviorStart: "[AI_BEHAVIOR]",
    behaviorEnd: "[/AI_BEHAVIOR]",
    instructionsStart: "[ASSISTANT_INSTRUCTIONS]",
    instructionsEnd: "[/ASSISTANT_INSTRUCTIONS]",
    advancedStart: "[ADVANCED_OVERRIDE]",
    advancedEnd: "[/ADVANCED_OVERRIDE]"
  };

  const getRadioValue = (list, fallback) => {
    if (!list) {
      return fallback;
    }
    const inputs = Array.from(list);
    const match = inputs.find((input) => input.checked);
    return match ? match.value : fallback;
  };

  const setRadioValue = (list, value) => {
    if (!list || !value) {
      return;
    }
    Array.from(list).forEach((input) => {
      input.checked = input.value === value;
    });
  };

  const extractBlock = (text, start, end) => {
    if (!text) {
      return "";
    }
    const startIndex = text.indexOf(start);
    const endIndex = text.indexOf(end);
    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
      return "";
    }
    return text.slice(startIndex + start.length, endIndex).trim();
  };

  const removeBlock = (text, start, end) => {
    if (!text) {
      return "";
    }
    const startIndex = text.indexOf(start);
    const endIndex = text.indexOf(end);
    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
      return text;
    }
    const before = text.slice(0, startIndex).trim();
    const after = text.slice(endIndex + end.length).trim();
    return [before, after].filter(Boolean).join("\n\n");
  };

  const getBehaviorValue = (block, key) => {
    if (!block) {
      return "";
    }
    const regex = new RegExp(`${key}\\s*:\\s*([^\\n]+)`, "i");
    const match = block.match(regex);
    return match ? match[1].trim() : "";
  };

  const parseBehaviorBlock = (block) => {
    if (!block) {
      return {};
    }
    const goal = getBehaviorValue(block, "goal");
    const tone = getBehaviorValue(block, "tone");
    const length = getBehaviorValue(block, "length");
    const languageMode = getBehaviorValue(block, "language_mode");
    const languageFixed = getBehaviorValue(block, "language_fixed");
    const escalation = getBehaviorValue(block, "escalation");
    const salesStyle = getBehaviorValue(block, "sales_style");
    const salesPreferContact = getBehaviorValue(block, "sales_prefer_contact");
    const rulesLine = getBehaviorValue(block, "rules");
    const rules = rulesLine
      ? rulesLine
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
    return {
      goal,
      tone,
      length,
      languageMode,
      languageFixed,
      escalation,
      salesStyle,
      salesPreferContact: salesPreferContact === "true",
      rules: {
        oneQuestion: rules.includes("one_question"),
        askUnclear: rules.includes("ask_unclear"),
        noMarkdown: rules.includes("no_markdown"),
        captureContact: rules.includes("capture_contact")
      }
    };
  };

  const getBehaviorState = () => ({
    goal: getRadioValue(elements.aiGoalInputs, "support"),
    tone: getRadioValue(elements.aiToneInputs, "professional"),
    length: getRadioValue(elements.aiLengthInputs, "short"),
    languageMode: getRadioValue(elements.aiLanguageModeInputs, "auto"),
    languageFixed: elements.aiLanguageSelect?.value || "English",
    rules: {
      oneQuestion: Boolean(elements.aiRuleOneQuestion?.checked),
      askUnclear: Boolean(elements.aiRuleAskUnclear?.checked),
      noMarkdown: Boolean(elements.aiRuleNoMarkdown?.checked),
      captureContact: Boolean(elements.aiRuleCaptureContact?.checked)
    },
    salesStyle: getRadioValue(elements.aiSalesStyleInputs, "soft"),
    salesPreferContact: Boolean(elements.aiSalesPreferContact?.checked),
    escalation: elements.aiEscalationPolicy?.value || "unsure",
    instructions: elements.aiInstructions?.value.trim() || ""
  });

  const updateLanguageVisibility = (mode) => {
    if (!elements.aiLanguageSelect) {
      return;
    }
    elements.aiLanguageSelect.hidden = mode !== "fixed";
  };

  const updateSalesVisibility = (goal) => {
    const show = goal === "sales" || goal === "mixed";
    if (elements.aiSalesStyleRow) {
      elements.aiSalesStyleRow.hidden = !show;
      elements.aiSalesStyleRow.classList.toggle("is-hidden", !show);
    }
    if (elements.aiSalesPreferContactRow) {
      elements.aiSalesPreferContactRow.hidden = !show;
      elements.aiSalesPreferContactRow.classList.toggle("is-hidden", !show);
    }
  };

  const applyBehaviorState = (data) => {
    if (!data) {
      return;
    }
    if (data.goal) {
      setRadioValue(elements.aiGoalInputs, data.goal);
      updateSalesVisibility(data.goal);
    }
    if (data.tone) {
      setRadioValue(elements.aiToneInputs, data.tone);
    }
    if (data.length) {
      setRadioValue(elements.aiLengthInputs, data.length);
    }
    if (data.languageMode) {
      setRadioValue(elements.aiLanguageModeInputs, data.languageMode);
      updateLanguageVisibility(data.languageMode);
    }
    if (elements.aiLanguageSelect && data.languageFixed) {
      elements.aiLanguageSelect.value = data.languageFixed;
    }
    if (elements.aiEscalationPolicy && data.escalation) {
      elements.aiEscalationPolicy.value = data.escalation;
    }
    if (data.salesStyle) {
      setRadioValue(elements.aiSalesStyleInputs, data.salesStyle);
    }
    if (elements.aiSalesPreferContact && data.salesPreferContact !== undefined) {
      elements.aiSalesPreferContact.checked = Boolean(data.salesPreferContact);
    }
    if (data.rules) {
      if (elements.aiRuleOneQuestion && data.rules.oneQuestion !== undefined) {
        elements.aiRuleOneQuestion.checked = Boolean(data.rules.oneQuestion);
      }
      if (elements.aiRuleAskUnclear && data.rules.askUnclear !== undefined) {
        elements.aiRuleAskUnclear.checked = Boolean(data.rules.askUnclear);
      }
      if (elements.aiRuleNoMarkdown && data.rules.noMarkdown !== undefined) {
        elements.aiRuleNoMarkdown.checked = Boolean(data.rules.noMarkdown);
      }
      if (elements.aiRuleCaptureContact && data.rules.captureContact !== undefined) {
        elements.aiRuleCaptureContact.checked = Boolean(data.rules.captureContact);
      }
    }
  };

  const buildCompiledBehavior = (data) => {
    const rules = [];
    if (data.rules.oneQuestion) {
      rules.push("one_question");
    }
    if (data.rules.askUnclear) {
      rules.push("ask_unclear");
    }
    if (data.rules.noMarkdown) {
      rules.push("no_markdown");
    }
    if (data.rules.captureContact) {
      rules.push("capture_contact");
    }
    const lines = [
      MARKERS.behaviorStart,
      "settings:",
      `goal: ${data.goal}`,
      `tone: ${data.tone}`,
      `length: ${data.length}`,
      `language_mode: ${data.languageMode}`,
      data.languageMode === "fixed" ? `language_fixed: ${data.languageFixed}` : null,
      `escalation: ${data.escalation}`,
      data.goal === "sales" || data.goal === "mixed"
        ? `sales_style: ${data.salesStyle}`
        : null,
      data.goal === "sales" || data.goal === "mixed"
        ? `sales_prefer_contact: ${data.salesPreferContact}`
        : null,
      `rules: ${rules.length ? rules.join(", ") : "none"}`,
      "guidelines:",
      data.rules.oneQuestion ? "- Ask one question at a time." : null,
      data.rules.askUnclear ? "- If unsure, ask instead of guessing." : null,
      data.rules.noMarkdown ? "- Use plain text, no markdown formatting." : null,
      data.rules.captureContact ? "- Capture contact details when appropriate." : null,
      data.goal === "sales" || data.goal === "mixed"
        ? `- Sales style: ${data.salesStyle}.`
        : null,
      data.goal === "sales" || data.goal === "mixed"
        ? data.salesPreferContact
          ? "- Prefer WhatsApp or email for contact."
          : null
        : null,
      MARKERS.behaviorEnd
    ].filter(Boolean);

    const compiled = [lines.join("\n")];
    compiled.push(`${MARKERS.instructionsStart}\n${data.instructions}\n${MARKERS.instructionsEnd}`);
    return compiled.join("\n\n");
  };

  const updateBehaviorStatus = () => {
    const dirty = Boolean(state.aiSettingsDirty);
    if (elements.aiBehaviorStatus) {
      elements.aiBehaviorStatus.textContent = dirty ? "Draft" : "Published";
      elements.aiBehaviorStatus.classList.toggle("is-online", !dirty);
    }
    if (elements.aiSaveBtn) {
      elements.aiSaveBtn.disabled = !dirty;
    }
  };

  const markBehaviorDirty = () => {
    if (behaviorHydrating) {
      return;
    }
    state.aiSettingsDirty = true;
    updateBehaviorStatus();
  };

  const hydrateBehaviorFromPrompt = () => {
    if (!elements.aiSystemPrompt) {
      return;
    }
    behaviorHydrating = true;
    const raw = elements.aiSystemPrompt.value || "";
    const behaviorBlock = extractBlock(raw, MARKERS.behaviorStart, MARKERS.behaviorEnd);
    const instructionsBlock = extractBlock(raw, MARKERS.instructionsStart, MARKERS.instructionsEnd);
    applyBehaviorState(parseBehaviorBlock(behaviorBlock));

    let instructions = instructionsBlock;
    if (!instructions) {
      let cleaned = raw;
      cleaned = removeBlock(cleaned, MARKERS.behaviorStart, MARKERS.behaviorEnd);
      cleaned = removeBlock(cleaned, MARKERS.advancedStart, MARKERS.advancedEnd);
      cleaned = removeBlock(cleaned, "[GUIDED_BEHAVIOR]", "[/GUIDED_BEHAVIOR]");
      instructions = cleaned.trim();
    }
    if (elements.aiInstructions) {
      elements.aiInstructions.value = instructions;
    }
    const goal = getRadioValue(elements.aiGoalInputs, "support");
    updateSalesVisibility(goal);
    updateLanguageVisibility(getRadioValue(elements.aiLanguageModeInputs, "auto"));
    behaviorHydrating = false;
    state.aiSettingsDirty = false;
    updateBehaviorStatus();
  };

  const initAiBehavior = () => {
    if (behaviorInitialized) {
      return;
    }
    behaviorInitialized = true;
    const watched = [
      ...Array.from(elements.aiGoalInputs || []),
      ...Array.from(elements.aiToneInputs || []),
      ...Array.from(elements.aiLengthInputs || []),
      ...Array.from(elements.aiLanguageModeInputs || []),
      elements.aiLanguageSelect,
      elements.aiRuleOneQuestion,
      elements.aiRuleAskUnclear,
      elements.aiRuleNoMarkdown,
      elements.aiRuleCaptureContact,
      ...Array.from(elements.aiSalesStyleInputs || []),
      elements.aiSalesPreferContact,
      elements.aiEscalationPolicy,
      elements.aiInstructions
    ].filter(Boolean);

    watched.forEach((control) => {
      control.addEventListener("input", markBehaviorDirty);
      control.addEventListener("change", (event) => {
        if (event.target && event.target.name === "ai-goal") {
          updateSalesVisibility(event.target.value);
        }
        if (event.target && event.target.name === "ai-language-mode") {
          updateLanguageVisibility(event.target.value);
        }
        markBehaviorDirty();
      });
    });

    if (elements.aiCompiledOpen && elements.aiCompiledModal && elements.aiCompiledText) {
      elements.aiCompiledOpen.addEventListener("click", () => {
        elements.aiCompiledText.textContent = buildCompiledBehavior(getBehaviorState());
        elements.aiCompiledModal.hidden = false;
      });
    }
    if (elements.aiCompiledClose && elements.aiCompiledModal) {
      elements.aiCompiledClose.addEventListener("click", () => {
        elements.aiCompiledModal.hidden = true;
      });
      elements.aiCompiledModal.addEventListener("click", (event) => {
        if (event.target === elements.aiCompiledModal) {
          elements.aiCompiledModal.hidden = true;
        }
      });
    }

    updateSalesVisibility(getRadioValue(elements.aiGoalInputs, "support"));
    updateLanguageVisibility(getRadioValue(elements.aiLanguageModeInputs, "auto"));
    updateBehaviorStatus();
  };

  const loadAiBehaviorState = () => {
    hydrateBehaviorFromPrompt();
  };

  const getAiLocalKey = (suffix) => {
    const companyId = Number(state.currentCompanyId || 0);
    const websiteId = Number(state.currentWebsiteId || 0);
    if (!companyId) {
      return `oc_ai_${suffix}`;
    }
    const sitePart = websiteId ? `_${websiteId}` : "";
    return `oc_ai_${companyId}${sitePart}_${suffix}`;
  };

  const getFaqMetaStorageKey = () => getAiLocalKey("faq_meta_v1");
  const getAnswerStrictnessKey = () => getAiLocalKey("answer_strictness");
  const getKnowledgeStorageKey = () => getAiLocalKey("knowledge_data_v1");

  const readStoredJson = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  };

  const writeStoredJson = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      return;
    }
  };

  const getFaqMetaMap = () => readStoredJson(getFaqMetaStorageKey(), {});

  const setFaqMeta = (id, patch) => {
    const key = String(id || "");
    if (!key) {
      return null;
    }
    const meta = getFaqMetaMap();
    meta[key] = { ...(meta[key] || {}), ...(patch || {}) };
    writeStoredJson(getFaqMetaStorageKey(), meta);
    return meta[key];
  };

  const getFaqMeta = (id) => {
    const meta = getFaqMetaMap();
    return meta[String(id || "")] || null;
  };

  const FAQ_CATEGORY_LABELS = {
    company: "Company",
    contact: "Contact",
    products: "Products",
    pricing: "Pricing",
    delivery: "Delivery",
    policies: "Policies",
    next: "Next step"
  };

  const FAQ_CATEGORY_KEYS = Object.keys(FAQ_CATEGORY_LABELS);

  const getCategoryLabel = (key) => FAQ_CATEGORY_LABELS[key] || "Products";

  const normalizeFaqIntent = (value) => {
    const raw = String(value || "").toLowerCase().trim();
    if (!raw) {
      return "";
    }
    const normalized = raw.replace(/[^a-z]/g, "");
    if (FAQ_CATEGORY_KEYS.includes(raw)) {
      return raw;
    }
    if (normalized.startsWith("product") || normalized.startsWith("service")) {
      return "products";
    }
    if (normalized.startsWith("policy") || normalized.startsWith("return") || normalized.startsWith("guarantee")) {
      return "policies";
    }
    if (normalized.startsWith("deliver") || normalized.startsWith("ship")) {
      return "delivery";
    }
    if (normalized.startsWith("price") || normalized.startsWith("cost") || normalized.startsWith("quote")) {
      return "pricing";
    }
    if (normalized.startsWith("contact") || normalized.startsWith("support")) {
      return "contact";
    }
    if (normalized.startsWith("company") || normalized.startsWith("about")) {
      return "company";
    }
    if (normalized.startsWith("next") || normalized.startsWith("step")) {
      return "next";
    }
    return "";
  };

  const detectFaqIntent = (faq) => {
    const text = `${faq.question || ""} ${faq.answer || ""}`.toLowerCase();
    if (text.match(/price|pricing|cost|quote|vat|tax|gst/)) {
      return "pricing";
    }
    if (text.match(/delivery|shipping|ship|lead time|turnaround/)) {
      return "delivery";
    }
    if (text.match(/return|refund|warranty|guarantee|policy|terms/)) {
      return "policies";
    }
    if (text.match(/contact|email|phone|whatsapp|call/)) {
      return "contact";
    }
    if (text.match(/next step|get started|how to proceed|what happens next/)) {
      return "next";
    }
    if (text.match(/company|about|who are you|overview/)) {
      return "company";
    }
    return "products";
  };

  const FAQ_TEMPLATES = [
    { id: "company_overview", category: "company", question: "What does your company do?" },
    { id: "contact_details", category: "contact", question: "How can we contact you?" },
    { id: "products_services", category: "products", question: "What products or services do you offer?" },
    { id: "pricing_model", category: "pricing", question: "How does pricing work?" },
    { id: "delivery_time", category: "delivery", question: "What is your typical delivery or turnaround time?" },
    { id: "policies", category: "policies", question: "What is your guarantee or return policy?" },
    { id: "next_step", category: "next", question: "What is the next step to get started?" }
  ];

  const ensureFaqMeta = (faq) => {
    if (!faq || !faq.id) {
      return { intent: "product", pinned: false, source: "manual" };
    }
    const meta = getFaqMeta(faq.id) || {};
    const intent = normalizeFaqIntent(meta.intent || detectFaqIntent(faq));
    const source = meta.source || (getFaqSource(faq) === "AUTO" ? "auto" : "manual");
    const pinned = Boolean(meta.pinned);
    if (!meta.intent || meta.source !== source || meta.pinned !== pinned) {
      setFaqMeta(faq.id, { intent, source, pinned });
    }
    return { intent, source, pinned };
  };

  const getPricingModelLabel = (value) => {
    const modelMap = {
      quote: "Quote-based (depends on requirements).",
      fixed: "Fixed pricing.",
      tiered: "Tiered by quantity or plan.",
      subscription: "Subscription / recurring pricing.",
      mixed: "Mixed / depends on the request."
    };
    return modelMap[value] || "";
  };

  const getTaxSummary = (data) => {
    const localText = `${data?.pricingNotes || ""} ${data?.pricingModel || ""}`.toLowerCase();
    if (localText.includes("vat") || localText.includes("tax") || localText.includes("gst")) {
      return data.pricingNotes || "";
    }
    if (!state.aiFaqs || !state.aiFaqs.length) {
      return "";
    }
    const match = state.aiFaqs.find((faq) => {
      const text = `${faq.question || ""} ${faq.answer || ""}`.toLowerCase();
      return text.includes("vat") || text.includes("tax") || text.includes("gst");
    });
    if (!match) {
      return "";
    }
    return match.answer || match.question || "";
  };

  const collectKnowledgeData = () => {
    return {
      company: elements.aiKnowledgeCompany?.value.trim() || "",
      productLine: elements.aiKnowledgeProductLine?.value.trim() || "",
      description: elements.aiKnowledgeDescription?.value.trim() || "",
      usp: elements.aiKnowledgeUsp?.value.trim() || "",
      audience: elements.aiKnowledgeAudience?.value.trim() || "",
      products: elements.aiKnowledgeProducts?.value.trim() || "",
      pricingModel: elements.aiKnowledgePricingModel?.value || "",
      pricingNotes: elements.aiKnowledgePricingNotes?.value.trim() || "",
      moq: elements.aiKnowledgeMoq?.value.trim() || "",
      leadTime: elements.aiKnowledgeLeadTime?.value.trim() || "",
      payments: elements.aiKnowledgePayments?.value.trim() || "",
      addons: elements.aiKnowledgeAddons?.value.trim() || "",
      contact: elements.aiKnowledgeContact?.value.trim() || "",
      sustainability: elements.aiKnowledgeSustainability?.value.trim() || "",
      guarantee: elements.aiKnowledgeGuarantee?.value.trim() || ""
    };
  };

  const applyKnowledgeData = (data) => {
    if (!data) {
      return;
    }
    if (elements.aiKnowledgeCompany && data.company !== undefined) {
      elements.aiKnowledgeCompany.value = data.company;
    }
    if (elements.aiKnowledgeProductLine && data.productLine !== undefined) {
      elements.aiKnowledgeProductLine.value = data.productLine;
    }
    if (elements.aiKnowledgeDescription && data.description !== undefined) {
      elements.aiKnowledgeDescription.value = data.description;
    }
    if (elements.aiKnowledgeUsp && data.usp !== undefined) {
      elements.aiKnowledgeUsp.value = data.usp;
    }
    if (elements.aiKnowledgeAudience && data.audience !== undefined) {
      elements.aiKnowledgeAudience.value = data.audience;
    }
    if (elements.aiKnowledgeProducts && data.products !== undefined) {
      elements.aiKnowledgeProducts.value = data.products;
    }
    if (elements.aiKnowledgePricingModel && data.pricingModel !== undefined) {
      const value = data.pricingModel || "quote";
      elements.aiKnowledgePricingModel.value = value;
      elements.aiKnowledgePricingModel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (elements.aiKnowledgePricingNotes && data.pricingNotes !== undefined) {
      elements.aiKnowledgePricingNotes.value = data.pricingNotes;
    }
    if (elements.aiKnowledgeMoq && data.moq !== undefined) {
      elements.aiKnowledgeMoq.value = data.moq;
    }
    if (elements.aiKnowledgeLeadTime && data.leadTime !== undefined) {
      elements.aiKnowledgeLeadTime.value = data.leadTime;
    }
    if (elements.aiKnowledgePayments && data.payments !== undefined) {
      elements.aiKnowledgePayments.value = data.payments;
    }
    if (elements.aiKnowledgeAddons && data.addons !== undefined) {
      elements.aiKnowledgeAddons.value = data.addons;
    }
    if (elements.aiKnowledgeContact && data.contact !== undefined) {
      elements.aiKnowledgeContact.value = data.contact;
    }
    if (elements.aiKnowledgeSustainability && data.sustainability !== undefined) {
      elements.aiKnowledgeSustainability.value = data.sustainability;
    }
    if (elements.aiKnowledgeGuarantee && data.guarantee !== undefined) {
      elements.aiKnowledgeGuarantee.value = data.guarantee;
    }
  };

  const loadKnowledgeData = () => readStoredJson(getKnowledgeStorageKey(), null);

  const persistKnowledgeData = (data) => {
    writeStoredJson(getKnowledgeStorageKey(), data);
  };

  let faqDrafts = [];

  const normalizeQuestion = (value) => {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  };

  const getFaqItems = () => [...state.aiFaqs, ...faqDrafts];

  const getFaqCategoryKey = (faq, fallback) => {
    const fromProduct = normalizeFaqIntent(faq.product_line || "");
    if (fromProduct) {
      return fromProduct;
    }
    if (fallback) {
      return fallback;
    }
    return detectFaqIntent(faq);
  };

  const buildDuplicateMap = (items) => {
    const map = new Map();
    items.forEach((item) => {
      const key = normalizeQuestion(item.question);
      if (!key) {
        return;
      }
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  };

  const getFaqFilters = () => ({
    query: (elements.aiFaqSearch?.value || "").trim().toLowerCase(),
    category: elements.aiFaqFilterCategory?.value || "all",
    pinnedOnly: Boolean(elements.aiFaqFilterPinned?.checked)
  });

  const matchesFaqFilters = (faq, meta, categoryKey, filters) => {
    if (filters.category !== "all" && categoryKey !== filters.category) {
      return false;
    }
    if (filters.pinnedOnly && !meta.pinned) {
      return false;
    }
    if (!filters.query) {
      return true;
    }
    const hay = `${faq.question || ""} ${faq.answer || ""}`.toLowerCase();
    return hay.includes(filters.query);
  };

  const renderFaqCoverage = (items) => {
    if (!elements.aiFaqCoverage) {
      return;
    }
    const required = [
      { key: "pricing", label: "Pricing" },
      { key: "delivery", label: "Delivery" },
      { key: "contact", label: "Contact" },
      { key: "policies", label: "Policies" },
      { key: "products", label: "Services" }
    ];
    const coverage = new Set();
    items.forEach((faq) => {
      if (!faq.is_active) {
        return;
      }
      if (!(faq.answer || "").trim()) {
        return;
      }
      coverage.add(getFaqCategoryKey(faq));
    });
    elements.aiFaqCoverage.innerHTML = required
      .map((item) => {
        const ok = coverage.has(item.key);
        return `
          <div class="faq-coverage-item ${ok ? "is-complete" : "is-missing"}">
            <span>${item.label}</span>
            <strong>${ok ? "Filled" : "Missing"}</strong>
          </div>
        `;
      })
      .join("");
  };

  const findTemplateMatch = (template, items) => {
    const key = normalizeQuestion(template.question);
    return items.find((faq) => normalizeQuestion(faq.question) === key) || null;
  };

  const buildFaqCard = ({ faq, template, categoryKey, duplicates, meta, isDraft }) => {
    const card = document.createElement("div");
    card.className = "faq-card";
    const statusLabel = faq.is_active ? "Published" : "Draft";
    const duplicateKey = normalizeQuestion(faq.question);
    const isDuplicate = duplicateKey && duplicates.get(duplicateKey) > 1;
    const pinned = Boolean(meta.pinned);
    const canPin = Boolean(faq.id) && !isDraft;
    const categoryLabel = getCategoryLabel(categoryKey);
    const questionValue = faq.question || template?.question || "";
    const answerValue = faq.answer || "";
    const statusValue = faq.is_active ? "published" : "draft";
    const duplicateAttr = isDuplicate ? "" : "hidden";

    card.innerHTML = `
      <div class="faq-card-header">
        <div class="faq-card-meta">
          <span class="badge neutral">${safe(categoryLabel)}</span>
          <span class="badge ${faq.is_active ? "success" : "warning"}">${statusLabel}</span>
          <span class="badge warning" ${duplicateAttr}>Duplicate</span>
        </div>
        <button type="button" class="ghost-btn small faq-pin" ${canPin ? "" : "disabled"}>
          ${pinned ? "Pinned" : "Pin"}
        </button>
      </div>
      <label class="faq-field">
        <span>Question</span>
        <input type="text" value="${safe(questionValue)}" ${template ? "readonly" : ""} />
      </label>
      <label class="faq-field">
        <span>Answer</span>
        <textarea rows="3">${safe(answerValue)}</textarea>
      </label>
      <div class="faq-card-actions">
        <div class="faq-action-group">
          <label>
            Status
            <select class="faq-status">
              <option value="draft" ${statusValue === "draft" ? "selected" : ""}>Draft</option>
              <option value="published" ${statusValue === "published" ? "selected" : ""}>Published</option>
            </select>
          </label>
          <label>
            Category
            <select class="faq-category" ${template ? "disabled" : ""}>
              ${FAQ_CATEGORY_KEYS.map((key) => {
                const selected = key === categoryKey ? "selected" : "";
                return `<option value="${key}" ${selected}>${safe(getCategoryLabel(key))}</option>`;
              }).join("")}
            </select>
          </label>
        </div>
        <div class="faq-action-buttons">
          <button type="button" data-action="save">Save</button>
          ${isDraft ? `<button type="button" data-action="discard" class="ghost-btn">Discard</button>` : `<button type="button" data-action="delete" class="danger">Delete</button>`}
        </div>
      </div>
    `;

    const pinBtn = card.querySelector(".faq-pin");
    if (pinBtn && canPin) {
      pinBtn.addEventListener("click", () => {
        const nextPinned = !meta.pinned;
        meta.pinned = nextPinned;
        setFaqMeta(faq.id, { pinned: nextPinned });
        pinBtn.textContent = nextPinned ? "Pinned" : "Pin";
      });
    }

    const saveBtn = card.querySelector("[data-action='save']");
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        const question = card.querySelector(".faq-field input").value.trim();
        const answer = card.querySelector(".faq-field textarea").value.trim();
        const status = card.querySelector(".faq-status").value;
        const category = card.querySelector(".faq-category").value;
        if (!question || !answer) {
          window.alert("Question and answer are required.");
          return;
        }
        const payload = {
          product_line: category,
          question,
          answer,
          is_active: status === "published" ? 1 : 0
        };
        if (faq.id && !isDraft) {
          await fetchJson(`${API_BASE}/admin/ai/faq/${faq.id}`, {
            method: "PUT",
            body: JSON.stringify(payload)
          });
        } else {
          await fetchJson(`${API_BASE}/admin/ai/faq`, {
            method: "POST",
            body: JSON.stringify(payload)
          });
          faqDrafts = faqDrafts.filter((item) => item.id !== faq.id);
        }
        await loadAiFaqs();
      });
    }

    const deleteBtn = card.querySelector("[data-action='delete']");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        if (!window.confirm("Delete this FAQ?")) {
          return;
        }
        await fetchJson(`${API_BASE}/admin/ai/faq/${faq.id}`, { method: "DELETE" });
        await loadAiFaqs();
      });
    }

    const discardBtn = card.querySelector("[data-action='discard']");
    if (discardBtn) {
      discardBtn.addEventListener("click", () => {
        faqDrafts = faqDrafts.filter((item) => item.id !== faq.id);
        renderAiFaqs();
      });
    }

    return card;
  };

  const renderFaqTemplates = (items, duplicates, filters) => {
    if (!elements.aiFaqTemplates) {
      return;
    }
    elements.aiFaqTemplates.innerHTML = "";
    const grouped = FAQ_CATEGORY_KEYS.reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {});
    FAQ_TEMPLATES.forEach((template) => {
      grouped[template.category].push(template);
    });

    FAQ_CATEGORY_KEYS.forEach((categoryKey) => {
      const templates = grouped[categoryKey] || [];
      if (!templates.length) {
        return;
      }
      const group = document.createElement("div");
      group.className = "faq-template-group";
      group.innerHTML = `<h5>${safe(getCategoryLabel(categoryKey))}</h5>`;
      const list = document.createElement("div");
      list.className = "faq-list";
      templates.forEach((template) => {
        const existing = findTemplateMatch(template, items);
        const faq = existing || { id: null, question: template.question, answer: "", product_line: categoryKey, is_active: 0 };
        const meta = existing ? ensureFaqMeta(existing) : { pinned: false };
        const matches = matchesFaqFilters(faq, meta, categoryKey, filters);
        if (!matches) {
          return;
        }
        const card = buildFaqCard({
          faq,
          template,
          categoryKey,
          duplicates,
          meta,
          isDraft: false
        });
        list.appendChild(card);
      });
      if (list.children.length) {
        group.appendChild(list);
        elements.aiFaqTemplates.appendChild(group);
      }
    });
  };

  const renderFaqCustoms = (items, duplicates, filters, templateMatchIds) => {
    if (!elements.aiFaqList) {
      return;
    }
    elements.aiFaqList.innerHTML = "";
    const customs = items.filter((faq) => !templateMatchIds.has(faq.id));
    if (!customs.length) {
      elements.aiFaqList.innerHTML = "<p class='chat-meta'>No custom FAQs yet.</p>";
      return;
    }
    customs.forEach((faq) => {
      const meta = faq.id && !String(faq.id).startsWith("draft-") ? ensureFaqMeta(faq) : { pinned: false };
      const categoryKey = getFaqCategoryKey(faq, "products");
      if (!matchesFaqFilters(faq, meta, categoryKey, filters)) {
        return;
      }
      const card = buildFaqCard({
        faq,
        template: null,
        categoryKey,
        duplicates,
        meta,
        isDraft: String(faq.id || "").startsWith("draft-")
      });
      elements.aiFaqList.appendChild(card);
    });
  };

  const renderFaqLibrary = () => {
    const items = getFaqItems();
    const duplicates = buildDuplicateMap(items);
    const filters = getFaqFilters();
    const templateMatchIds = new Set();
    FAQ_TEMPLATES.forEach((template) => {
      const match = findTemplateMatch(template, items);
      if (match && match.id) {
        templateMatchIds.add(match.id);
      }
    });
    renderFaqCoverage(items);
    renderFaqTemplates(items, duplicates, filters);
    renderFaqCustoms(items, duplicates, filters, templateMatchIds);
  };

  const loadAiKnowledge = async () => {
    renderAiFaqs();
  };

  const initAiKnowledgeBuilder = () => {
    if (knowledgeInitialized) {
      return;
    }
    knowledgeInitialized = true;
    const suggestionList = document.getElementById("ai-faq-suggestion-list");
    if (suggestionList) {
      const onChipClick = (event) => {
        const btn = event.target.closest("button");
        if (!btn) {
          return;
        }
        const question = btn.getAttribute("data-question") || "";
        if (elements.aiFaqQuestion && question) {
          elements.aiFaqQuestion.value = question;
        }
        if (elements.aiFaqAnswer) {
          elements.aiFaqAnswer.focus();
        }
      };
      suggestionList.addEventListener("click", onChipClick);
      const parent = suggestionList.closest(".faq-suggestions");
      if (parent) {
        parent.addEventListener("click", onChipClick);
      }
    }
    if (elements.aiDocDrop && elements.aiDocFile && elements.aiDocBrowse) {
      const drop = elements.aiDocDrop;
      const fileInput = elements.aiDocFile;
      const selectedLabel = elements.aiDocSelected;
      const renderSelectedFileName = (name = "") => {
        if (!selectedLabel) {
          return;
        }
        const file = !name && fileInput.files ? fileInput.files[0] : null;
        const nextName = name || (file ? file.name : "");
        if (!nextName) {
          selectedLabel.textContent = "No file selected";
          selectedLabel.hidden = true;
          return;
        }
        selectedLabel.textContent = `Selected: ${nextName}`;
        selectedLabel.hidden = false;
      };
      const setFiles = (files) => {
        if (!files || !files.length) {
          renderSelectedFileName();
          return;
        }
        const firstFileName = files[0] ? files[0].name : "";
        // Show dropped file name immediately, even if browser delays file input sync.
        renderSelectedFileName(firstFileName);
        try {
          const dt = new DataTransfer();
          Array.from(files).forEach((file) => dt.items.add(file));
          fileInput.files = dt.files;
          renderSelectedFileName();
        } catch (err) {
          // Fallback: keep visible name even if DataTransfer assignment is blocked.
          renderSelectedFileName(firstFileName);
        }
      };
      const renderSelectedFromInput = () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) {
          renderSelectedFileName();
          return;
        }
        renderSelectedFileName(file.name);
      };
      elements.aiDocBrowse.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        fileInput.click();
      });
      drop.addEventListener("click", (event) => {
        if (event.target.closest("#ai-doc-browse") || event.target.closest("input[type='file']")) {
          return;
        }
        fileInput.click();
      });
      fileInput.addEventListener("change", renderSelectedFromInput);
      drop.addEventListener("dragover", (event) => {
        event.preventDefault();
        drop.classList.add("is-dragging");
      });
      drop.addEventListener("dragleave", () => {
        drop.classList.remove("is-dragging");
      });
      drop.addEventListener("drop", (event) => {
        event.preventDefault();
        event.stopPropagation();
        drop.classList.remove("is-dragging");
        setFiles(event.dataTransfer.files);
      });
      renderSelectedFileName();
    }
    renderAiFaqs();
  };

  const initAiTabs = () => {
    const tabButtons = document.querySelectorAll(".ai-tab-btn");
    const tabPanels = document.querySelectorAll(".ai-tab-panel");
    const settingsForm = elements.aiSettingsForm || document.getElementById("ai-settings-form");
    const behaviorSection = settingsForm
      ? settingsForm.querySelector("[data-ai-section='behavior']")
      : null;
    const advancedSection = settingsForm
      ? settingsForm.querySelector("[data-ai-section='advanced']")
      : null;

    if (!tabButtons.length) {
      return;
    }

    const setActiveTab = (tab) => {
      const isSettings = tab === "behavior" || tab === "advanced";
      tabButtons.forEach((button) => {
        const active = button.dataset.tab === tab;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", active ? "true" : "false");
      });
      tabPanels.forEach((panel) => {
        const active = isSettings ? panel.dataset.tab === "behavior" : panel.dataset.tab === tab;
        panel.classList.toggle("is-active", active);
        panel.hidden = !active;
      });
      if (settingsForm) {
        settingsForm.classList.toggle("is-hidden", !isSettings);
      }
      if (behaviorSection && advancedSection) {
        behaviorSection.classList.toggle("is-active", tab === "behavior");
        advancedSection.classList.toggle("is-active", tab === "advanced");
      }
    };

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => setActiveTab(button.dataset.tab));
    });
    setActiveTab("behavior");
  };

  const initAiSettingsTracking = () => {
    if (settingsTrackingInitialized) {
      return;
    }
    const tracked = [
      elements.aiToggle,
      elements.aiTogglePanel,
      elements.aiProvider,
      elements.aiModel,
      elements.aiName,
      elements.aiFallback,
      elements.aiTemperature,
      elements.aiTopP,
      elements.aiMaxTokens
    ].filter(Boolean);
    if (!tracked.length) {
      return;
    }
    const markDirty = () => {
      markBehaviorDirty();
    };
    tracked.forEach((control) => {
      control.addEventListener("input", markDirty);
      control.addEventListener("change", markDirty);
    });
    settingsTrackingInitialized = true;
  };

  const applyAiPermissions = () => {
    const isAdmin = Boolean(
      state.currentUser &&
        ((state.currentUser.capabilities && state.currentUser.capabilities.manage_ai) ||
          state.currentUser.role === "admin")
    );
    const aiRoot = document.querySelector("[data-view='ai']");
    if (!aiRoot) {
      return;
    }
    if (elements.aiToggle) {
      elements.aiToggle.disabled = !isAdmin;
    }
    if (elements.aiTogglePanel) {
      elements.aiTogglePanel.disabled = !isAdmin;
    }
    aiRoot.classList.toggle("is-readonly", !isAdmin);
    aiRoot.querySelectorAll("input, select, textarea, button").forEach((control) => {
      if (control.classList.contains("ai-tab-btn")) {
        return;
      }
      control.disabled = !isAdmin;
    });
  };

  // AI settings: gather form inputs and persist to /admin/settings.
  // Refactor next: split payload building vs. persistence for clarity.
  const saveAiSettings = async () => {
    const provider = elements.aiProvider ? elements.aiProvider.value : "openai";
    let model = elements.aiModel ? elements.aiModel.value.trim() : "";
    if (provider === "openai" && (!model || model === "qwen3:8b")) {
      model = "gpt-5.4";
      if (elements.aiModel) {
        elements.aiModel.value = model;
      }
    }
    const temperature = clampNumber(elements.aiTemperature?.value, 0, 2, 0.2);
    const topP = clampNumber(elements.aiTopP?.value, 0.1, 1, 0.9);
    const maxTokens = Math.round(clampNumber(elements.aiMaxTokens?.value, 16, 2000, 160));
    const compiledPrompt = buildCompiledBehavior(getBehaviorState());
    if (elements.aiSystemPrompt) {
      elements.aiSystemPrompt.value = compiledPrompt;
    }
    const payload = {
      ai_enabled: elements.aiTogglePanel
        ? elements.aiTogglePanel.checked
        : elements.aiToggle
          ? elements.aiToggle.checked
          : false,
      ai_provider: provider,
      ai_model: model,
      ai_name: elements.aiName ? elements.aiName.value.trim() : "",
      ai_system_prompt: compiledPrompt.trim(),
      ai_fallback_message: elements.aiFallback ? elements.aiFallback.value.trim() : "",
      ai_temperature: temperature,
      ai_top_p: topP,
      ai_max_tokens: maxTokens
    };
    await fetchJson(`${API_BASE}/admin/settings`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    state.aiSettingsDirty = false;
    await loadSettings();
    loadAiBehaviorState();
    updateBehaviorStatus();
  };

  // FAQ Library: render templates + custom FAQs with filters.
  const renderAiFaqs = () => {
    if (!elements.aiFaqList) {
      return;
    }
    elements.aiFaqList.innerHTML = "";
    if (!state.aiFaqs || !state.aiFaqs.length) {
      elements.aiFaqList.innerHTML = "<p class='chat-meta'>No FAQs yet.</p>";
      return;
    }
    state.aiFaqs.forEach((faq) => {
      const item = document.createElement("div");
      item.className = "popup-item faq-item";
      const question = safe(faq.question || "");
      const answer = safe(faq.answer || "");
      const isActive = Number(faq.is_active || 0) === 1;
      item.innerHTML = `
        <header class="faq-item-header">
          <h4>FAQ</h4>
          <label class="inline-check">
            <input type="checkbox" data-field="active" ${isActive ? "checked" : ""} />
            Active
          </label>
        </header>
        <label>
          <span>Question</span>
          <input type="text" data-field="question" value="${question}" />
        </label>
        <label>
          <span>Answer</span>
          <textarea rows="3" data-field="answer">${answer}</textarea>
        </label>
        <div class="popup-actions">
          <button type="button" data-action="save">Save</button>
          <button type="button" class="danger" data-action="delete">Delete</button>
        </div>
      `;
      const saveBtn = item.querySelector("[data-action='save']");
      if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
          const q = item.querySelector("[data-field='question']").value.trim();
          const a = item.querySelector("[data-field='answer']").value.trim();
          const active = item.querySelector("[data-field='active']").checked;
          if (!q || !a) {
            window.alert("Question and answer are required.");
            return;
          }
          const payload = {
            question: q,
            answer: a,
            is_active: active ? 1 : 0
          };
          await fetchJson(`${API_BASE}/admin/ai/faq/${faq.id}`, {
            method: "PUT",
            body: JSON.stringify(payload)
          });
          await loadAiFaqs();
        });
      }
      const deleteBtn = item.querySelector("[data-action='delete']");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", async () => {
          if (!window.confirm("Delete this FAQ?")) {
            return;
          }
          await fetchJson(`${API_BASE}/admin/ai/faq/${faq.id}`, { method: "DELETE" });
          await loadAiFaqs();
        });
      }
      elements.aiFaqList.appendChild(item);
    });
  };

  // FAQ knowledge: fetch list and refresh UI.
  const loadAiFaqs = async () => {
    const data = await fetchJson(`${API_BASE}/admin/ai/faq`);
    state.aiFaqs = data.faqs || [];
    renderAiFaqs();
  };

  // Documents: render uploaded knowledge sources from state.aiDocs.
  // Refactor next: consolidate open/delete handlers.
  const renderAiDocs = () => {
    if (!elements.aiDocList) {
      return;
    }
    elements.aiDocList.innerHTML = "";
    if (!state.aiDocs.length) {
      elements.aiDocList.innerHTML = "<p class='chat-meta'>No documents yet.</p>";
      return;
    }
    state.aiDocs.forEach((doc) => {
      const item = document.createElement("div");
      item.className = "popup-item";
      const title = safe(doc.title || doc.file_name || "Document");
      const sizeLabel = formatFileSize(doc.file_size);
      const statusRaw = doc.status ? String(doc.status) : "ready";
      const statusClass =
        statusRaw === "processing" || statusRaw === "in_progress"
          ? "warning"
          : statusRaw === "failed"
            ? "error"
            : "success";
      item.innerHTML = `
        <header>
          <h4>${title}</h4>
          <span class="badge ${statusClass}">${safe(statusRaw)}</span>
          <span class="badge neutral">${safe(doc.mime_type || "document")}</span>
        </header>
        <p>${safe(doc.file_name || "")}${sizeLabel ? ` - ${safe(sizeLabel)}` : ""}</p>
        <div class="popup-actions">
          <button type="button" data-action="open">Open</button>
          <button type="button" class="danger" data-action="delete">Delete</button>
        </div>
      `;
      item.querySelector("[data-action='open']").addEventListener("click", () => {
        if (doc.file_url) {
          window.open(doc.file_url, "_blank", "noopener");
        }
      });
      item.querySelector("[data-action='delete']").addEventListener("click", async () => {
        if (!window.confirm("Delete this document?")) {
          return;
        }
        await fetchJson(`${API_BASE}/admin/ai/docs/${doc.id}`, { method: "DELETE" });
        await loadAiDocs();
      });
      elements.aiDocList.appendChild(item);
    });
  };

  // Documents: fetch list and refresh UI.
  const loadAiDocs = async () => {
    const data = await fetchJson(`${API_BASE}/admin/ai/docs`);
    state.aiDocs = data.docs || [];
    renderAiDocs();
  };

  // Fine-tuning: status badge helper for job cards.
  const getFineTuneStatusClass = (status) => {
    if (status === "succeeded" || status === "completed") {
      return "success";
    }
    if (status === "failed" || status === "cancelled") {
      return "error";
    }
    if (status === "running" || status === "validating_files") {
      return "warning";
    }
    return "neutral";
  };

  // Fine-tuning: render job cards and model selection actions.
  // Refactor next: isolate job card markup + actions.
  const renderAiFineTunes = () => {
    if (!elements.aiFineTuneJobs) {
      return;
    }
    elements.aiFineTuneJobs.innerHTML = "";
    if (state.aiFineTunesError) {
      elements.aiFineTuneJobs.innerHTML = `<p class='chat-meta'>${safe(state.aiFineTunesError)}</p>`;
      return;
    }
    if (!state.aiFineTunes.length) {
      elements.aiFineTuneJobs.innerHTML = "<p class='chat-meta'>No fine-tune jobs yet.</p>";
      return;
    }
    state.aiFineTunes.forEach((job) => {
      const item = document.createElement("div");
      item.className = "popup-item";
      const status = String(job.status || "queued");
      const statusClass = getFineTuneStatusClass(status);
      const baseModel = safe(job.model || "Unknown");
      const fineModelRaw = job.fine_tuned_model || "";
      const fineModel = safe(fineModelRaw);
      const createdAt = safe(job.created_at ? formatUnixDate(job.created_at) : "");
      const errorMessage = safe(job.error?.message || job.error?.type || "");
      const jobId = safe(job.id || "");

      item.innerHTML = `
        <header>
          <h4>${baseModel}</h4>
          <span class="badge ${statusClass}">${safe(status)}</span>
        </header>
        <div class="fine-tune-meta">
          <span>${createdAt || "Created recently"}</span>
          ${jobId ? `<span>ID ${jobId}</span>` : ""}
        </div>
        ${fineModel ? `<p>Fine-tuned model: <strong>${fineModel}</strong></p>` : ""}
        ${errorMessage ? `<p>${errorMessage}</p>` : ""}
        <div class="fine-tune-actions">
          ${fineModel ? `<button type="button" data-action="use">Use model</button>` : ""}
          <button type="button" data-action="refresh">Refresh</button>
        </div>
      `;

      const useBtn = item.querySelector("[data-action='use']");
      if (useBtn) {
        useBtn.addEventListener("click", async () => {
          if (!elements.aiModel || !elements.aiProvider) {
            return;
          }
          elements.aiProvider.value = "openai";
          if (
            elements.aiModel.tagName === "SELECT" &&
            fineModelRaw &&
            !Array.from(elements.aiModel.options || []).some((option) => option.value === fineModelRaw)
          ) {
            const customOption = document.createElement("option");
            customOption.value = fineModelRaw;
            customOption.textContent = `${fineModelRaw} (fine-tuned)`;
            elements.aiModel.appendChild(customOption);
          }
          elements.aiModel.value = fineModelRaw;
          await saveAiSettings();
          window.alert("AI model updated to fine-tuned model.");
        });
      }
      item.querySelector("[data-action='refresh']").addEventListener("click", loadAiFineTunes);
      elements.aiFineTuneJobs.appendChild(item);
    });
  };

  // Fine-tuning: fetch job list and refresh UI.
  const loadAiFineTunes = async () => {
    if (!elements.aiFineTuneJobs) {
      return;
    }
    try {
      const data = await fetchJson(`${API_BASE}/admin/ai/fine-tunes`);
      state.aiFineTunes = data.jobs || [];
      state.aiFineTunesError = "";
    } catch (err) {
      state.aiFineTunes = [];
      state.aiFineTunesError = err.message || "Failed to load fine-tune jobs.";
    }
    renderAiFineTunes();
  };

  return {
    initAiTabs,
    initAiBehavior,
    loadAiBehaviorState,
    initAiKnowledgeBuilder,
    loadAiKnowledge,
    initAiSettingsTracking,
    applyAiPermissions,
    saveAiSettings,
    renderAiFaqs,
    loadAiFaqs,
    renderAiDocs,
    loadAiDocs,
    getFineTuneStatusClass,
    renderAiFineTunes,
    loadAiFineTunes
  };
};
