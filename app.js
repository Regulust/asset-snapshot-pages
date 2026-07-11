const STORAGE_KEY = "asset-snapshot-book-v1";
const APP_VERSION = "v0.2.1 / res v139";
const DATA_SCHEMA_VERSION = 3;

const currencies = [
  { code: "CNY", name: "人民币", symbol: "¥", rate: 1 },
  { code: "USD", name: "美元", symbol: "$", rate: 7.2 },
  { code: "EUR", name: "欧元", symbol: "€", rate: 7.8 },
  { code: "HKD", name: "港币", symbol: "HK$", rate: 0.92 },
  { code: "JPY", name: "日元", symbol: "¥", rate: 0.046 },
  { code: "GBP", name: "英镑", symbol: "£", rate: 9.15 },
  { code: "CHF", name: "瑞郎", symbol: "CHF", rate: 8.05 },
  { code: "SGD", name: "新加坡元", symbol: "S$", rate: 5.35 },
];

const DEFAULT_ACCOUNT_TYPE_GROUPS = [
  {
    id: "assets",
    name: "资产账户",
    kind: "asset",
    types: [
      { id: "cash", name: "现金" },
      { id: "bank", name: "银行卡" },
      { id: "digital", name: "网络支付" },
      { id: "investment", name: "投资" },
      { id: "other", name: "其他资产" },
    ],
  },
  {
    id: "liabilities",
    name: "负债账户",
    kind: "liability",
    types: [
      { id: "credit", name: "信用卡" },
      { id: "loan", name: "贷款" },
      { id: "debt", name: "其他负债" },
    ],
  },
];

const DEFAULT_SNAPSHOT_TAGS = [
  "工资收入",
  "奖金发放",
  "投资上涨",
  "投资下跌",
  "税费缴纳",
  "日常调整",
];

const HEALTH_CARD_KEYS = ["liability", "cash", "investment", "account-concentration", "group-concentration"];
const HEALTH_DENOMINATOR_SCOPE_KEYS = ["liability", "cash", "investment"];
const CUSTOM_HEALTH_CARD_PREFIX = "custom:";
const HEALTH_CUSTOM_DENOMINATORS = [
  { value: "assets", label: "总资产" },
  { value: "net", label: "净资产" },
  { value: "custom", label: "指定类型集合" },
];
const HEALTH_CUSTOM_BASIS = [
  { value: "balance", label: "余额" },
  { value: "cost", label: "成本" },
];

const HEALTH_CARD_META = {
  liability: {
    label: "负债率",
    title: "负债率计算口径",
    subtitle: "显示全部账户类型，勾选要计入负债率分子的分类",
    defaultText: "默认只计入负债账户分类",
  },
  cash: {
    label: "流动占比",
    title: "流动占比计算口径",
    subtitle: "勾选要计入流动资产分子的账户类型",
    defaultText: "默认沿用现金、银行卡、网络支付等流动类型",
  },
  investment: {
    label: "投资占比",
    title: "投资占比计算口径",
    subtitle: "勾选要计入投资资产分子的账户类型",
    defaultText: "默认沿用投资增值类账户类型",
  },
  "account-concentration": {
    label: "最大账户集中度",
    title: "账户集中度范围",
    subtitle: "勾选要参与最大账户占比比较的账户类型",
    defaultText: "默认比较全部资产账户",
  },
  "group-concentration": {
    label: "最大分组占比",
    title: "分组集中度范围",
    subtitle: "勾选要参与最大分组占比比较的账户类型",
    defaultText: "默认比较全部资产账户",
  },
};

const DEFAULT_HEALTH_CONFIG = defaultHealthConfig(DEFAULT_ACCOUNT_TYPE_GROUPS);

const defaultState = {
  settings: {
    baseCurrency: "CNY",
    enabledCurrencies: currencies.map((item) => item.code),
    customCurrencies: [],
    rates: Object.fromEntries(currencies.map((item) => [item.code, item.rate])),
    privacy: false,
    theme: "system",
    accountTypeGroups: structuredClone(DEFAULT_ACCOUNT_TYPE_GROUPS),
    healthConfig: structuredClone(DEFAULT_HEALTH_CONFIG),
    healthDenominatorConfig: {},
    healthCustomCards: [],
    accountGroupOrder: [],
    snapshotTags: DEFAULT_SNAPSHOT_TAGS,
    deletedCurrencyCodes: [],
    balanceSignVersion: 2,
    archiveMergeVersion: 1,
  },
  accounts: [],
  snapshots: [],
};

let state = loadState();
let editingAccountId = null;
let editingAccountBalanceInitial = "";
let editingAccountCostInitial = "";
let dragPayload = null;
let pointerDrag = null;
let typeDraft = null;
let typeDraftDirty = false;
let accountSortMode = false;
let overviewAccountSortMode = false;
let editingAccountGroupName = null;
let snapshotManageMode = false;
let showAllSnapshots = false;
let snapshotSearchQuery = "";
let snapshotDateFrom = "";
let snapshotDateTo = "";
let editingSnapshotId = null;
const selectedSnapshotIds = new Set();
const openSnapshotMonths = new Set();
const selectedSnapshotTagFilters = new Set();
let trendPeriod = "day";
const visibleTrendLines = new Set(["assets", "liabilities", "net"]);
let selectedTreemapGroup = null;
let snapshotHistoryMode = "edit";
let selectedReportSnapshotId = null;
let selectedReportTreemapGroup = null;
let contributionPeriod = "day";
let contributionLookback = 2;
let snapshotHeatmapMode = "day";
let snapshotHeatmapYear = "";
let snapshotHeatmapMonth = "";
let snapshotHeatmapMetric = "count";
let snapshotHeatmapActiveOnly = false;
let snapshotHeatmapRange = "year";
let analysisTrendPeriod = "month";
let analysisHealthTrendPeriod = "month";
let analysisTrendMode = "total";
let analysisTrendMetric = "balance";
const selectedAnalysisTrendAccountIds = new Set();
const selectedAnalysisTrendTypeNames = new Set();
let gainAnalysisFilterMode = "all";
let gainAnalysisFilterValue = "";
let pendingImportPreview = null;
let csvExportRange = "all";
let csvExportFrom = "";
let csvExportTo = "";
let snapshotRateDraft = null;
let currencyManageMode = false;
const selectedCurrencyCodes = new Set();
let typeManageMode = false;
const selectedTypeGroupIds = new Set();
const selectedTypeIds = new Set();
let healthScopeDraft = null;
let healthDenominatorScopeDraft = null;
let healthScopeDraftDirty = false;
let activeHealthDetailKind = null;
let activeHealthScopeKind = "liability";
let customHealthDraft = null;
let activeCustomHealthScopePart = "numerator";
let customHealthAccountViewMode = "group";
let tagDraft = null;
let tagDraftDirty = false;
let tagManageMode = false;
const selectedTagNames = new Set();
let snapshotInlineTagAdding = false;
let snapshotInlineTagDraft = "";
const collapsedOverviewGroups = new Set();
const collapsedAccountGroups = new Set();
let overviewGroupsInitialized = false;
let snapshotSubmitInProgress = false;
let snapshotHistoryView = "list";
let snapshotHistoryCalendarMonth = "";
const TREEMAP_OTHER_GROUP_ID = "__other__";
const TREEMAP_OTHER_GROUP_LABEL = "其它";
const TREEMAP_MIN_GROUP_SHARE = 0.02;
const LINE_CHART_DEFAULTS = {
  minWidth: 360,
  maxWidth: 1080,
  height: 280,
  pad: { top: 28, right: 28, bottom: 52, left: 94 },
  pointInset: 22,
  strokeWidth: 2.4,
  pointRadius: 3.1,
  pointStrokeWidth: 1.8,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function normalizedTheme(value) {
  return ["system", "light", "dark"].includes(value) ? value : "system";
}

function resolvedTheme(preference = state?.settings?.theme || "system") {
  const normalized = normalizedTheme(preference);
  if (normalized !== "system") return normalized;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme() {
  const theme = resolvedTheme();
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  $$('input[name="themeMode"]').forEach((input) => {
    input.checked = input.value === normalizedTheme(state.settings.theme);
  });
  scheduleVisibleChartRender();
}

function bindThemePreference() {
  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!media) return;
  const onChange = () => {
    if (normalizedTheme(state.settings.theme) === "system") applyTheme();
  };
  if (typeof media.addEventListener === "function") media.addEventListener("change", onChange);
  else if (typeof media.addListener === "function") media.addListener(onChange);
}

function themeColor(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function chartPalette() {
  const fallbacks = ["#2563eb", "#059669", "#b45309", "#7c3aed", "#dc2626", "#0891b2"];
  return fallbacks.map((fallback, index) => themeColor(`--chart-${index + 1}`, fallback));
}

function updateUIShellClasses() {
  const root = document.documentElement;
  const userAgent = navigator.userAgent || "";
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches || false;
  const hoverNone = window.matchMedia?.("(hover: none)").matches || false;
  const compactViewport = window.matchMedia?.("(max-width: 860px)").matches || false;
  const mobileUA = /Android|iPhone|iPod|Mobile|Windows Phone/i.test(userAgent);
  const iPadLike = /iPad/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1);
  const touchShell = coarsePointer || hoverNone || maxTouchPoints > 0;
  const mobileShell = compactViewport || ((mobileUA || iPadLike) && touchShell);

  root.classList.toggle("is-touch-shell", touchShell);
  root.classList.toggle("is-mobile-ua-shell", (mobileUA || iPadLike) && touchShell);
  root.classList.toggle("is-mobile-shell", mobileShell);
  root.dataset.pointer = touchShell ? "coarse" : "fine";
}

function bindUIShellDetection() {
  updateUIShellClasses();
  ["(max-width: 860px)", "(pointer: coarse)", "(hover: none)"].forEach((query) => {
    const media = window.matchMedia?.(query);
    if (!media) return;
    if (typeof media.addEventListener === "function") media.addEventListener("change", updateUIShellClasses);
    else if (typeof media.addListener === "function") media.addListener(updateUIShellClasses);
  });
  window.visualViewport?.addEventListener("resize", updateUIShellClasses);
}

function setAdaptiveMoneyClass(element) {
  if (!element) return;
  const textLength = (element.textContent || "").replace(/\s+/g, "").length;
  element.classList.toggle("is-long-money", textLength >= 12);
  element.classList.toggle("is-very-long-money", textLength >= 15);
}

function appDialog({ title = "确认操作", message = "", confirmText = "确定", cancelText = "取消", variant = "default", showCancel = true } = {}) {
  const backdrop = $("#appDialog");
  const dialog = backdrop?.querySelector(".app-dialog");
  if (!backdrop || !dialog) {
    return Promise.resolve(showCancel ? window.confirm(message) : (window.alert(message), true));
  }
  return new Promise((resolve) => {
    const titleNode = $("#appDialogTitle");
    const messageNode = $("#appDialogMessage");
    const confirmButton = $("#appDialogConfirm");
    const cancelButton = $("#appDialogCancel");
    const cleanup = (value) => {
      backdrop.hidden = true;
      dialog.dataset.variant = "default";
      messageNode.classList.remove("has-text-confirm");
      confirmButton.onclick = null;
      cancelButton.onclick = null;
      backdrop.onclick = null;
      document.removeEventListener("keydown", onKeydown);
      resolve(value);
    };
    const onKeydown = (event) => {
      if (event.key === "Escape" && showCancel) cleanup(false);
    };
    titleNode.textContent = title;
    messageNode.classList.remove("has-text-confirm");
    messageNode.textContent = message;
    messageNode.scrollTop = 0;
    confirmButton.textContent = confirmText;
    cancelButton.textContent = cancelText;
    cancelButton.hidden = !showCancel;
    dialog.dataset.variant = variant;
    confirmButton.onclick = () => cleanup(true);
    cancelButton.onclick = () => cleanup(false);
    backdrop.onclick = (event) => {
      if (event.target === backdrop && showCancel) cleanup(false);
    };
    document.addEventListener("keydown", onKeydown);
    backdrop.hidden = false;
    window.setTimeout(() => (showCancel ? cancelButton : confirmButton).focus(), 0);
  });
}

function confirmDialog(message, options = {}) {
  return appDialog({
    title: options.title || "确认操作",
    message,
    confirmText: options.confirmText || "确定",
    cancelText: options.cancelText || "取消",
    variant: options.variant || "default",
    showCancel: true,
  });
}

function alertDialog(message, options = {}) {
  return appDialog({
    title: options.title || "提示",
    message,
    confirmText: options.confirmText || "知道了",
    variant: options.variant || "default",
    showCancel: false,
  });
}

function textConfirmDialog({ title, message, requiredText, confirmText = "确认", cancelText = "取消" } = {}) {
  const backdrop = $("#appDialog");
  const dialog = backdrop?.querySelector(".app-dialog");
  if (!backdrop || !dialog) return Promise.resolve(false);
  return new Promise((resolve) => {
    const titleNode = $("#appDialogTitle");
    const messageNode = $("#appDialogMessage");
    const confirmButton = $("#appDialogConfirm");
    const cancelButton = $("#appDialogCancel");
    const inputId = "appDialogTextConfirm";
    const cleanup = (value) => {
      backdrop.hidden = true;
      dialog.dataset.variant = "default";
      messageNode.classList.remove("has-text-confirm");
      confirmButton.onclick = null;
      cancelButton.onclick = null;
      backdrop.onclick = null;
      document.removeEventListener("keydown", onKeydown);
      resolve(value);
    };
    const onKeydown = (event) => {
      if (event.key === "Escape") cleanup(false);
    };
    titleNode.textContent = title;
    messageNode.classList.add("has-text-confirm");
    messageNode.innerHTML = `
      <p>${escapeHtml(message)}</p>
      <p class="dialog-required-text">${escapeHtml(requiredText)}</p>
      <label class="dialog-confirm-field">
        <span>请输入上方文字以确认</span>
        <input id="${inputId}" autocomplete="off" spellcheck="false" />
      </label>
    `;
    messageNode.scrollTop = 0;
    confirmButton.textContent = confirmText;
    cancelButton.textContent = cancelText;
    cancelButton.hidden = false;
    dialog.dataset.variant = "danger";
    confirmButton.onclick = () => cleanup($(`#${inputId}`)?.value === requiredText);
    cancelButton.onclick = () => cleanup(false);
    backdrop.onclick = (event) => {
      if (event.target === backdrop) cleanup(false);
    };
    document.addEventListener("keydown", onKeydown);
    backdrop.hidden = false;
    window.setTimeout(() => $(`#${inputId}`)?.focus(), 0);
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    const settings = { ...defaultState.settings, ...(parsed.settings || {}) };
    settings.theme = normalizedTheme(settings.theme);
    settings.customCurrencies = Array.isArray(settings.customCurrencies) ? settings.customCurrencies : [];
    settings.deletedCurrencyCodes = Array.isArray(settings.deletedCurrencyCodes) ? settings.deletedCurrencyCodes : [];
    const usedCurrencyCodes = (parsed.accounts || []).map((account) => account.currency);
    settings.deletedCurrencyCodes = settings.deletedCurrencyCodes.filter((code) => !usedCurrencyCodes.includes(code) && code !== settings.baseCurrency);
    settings.enabledCurrencies = [...new Set([
      settings.baseCurrency,
      ...(settings.enabledCurrencies || currencies.map((item) => item.code)),
      ...usedCurrencyCodes,
    ])].filter((code) => [...currencies, ...settings.customCurrencies].some((item) => item.code === code) && !settings.deletedCurrencyCodes.includes(code));
    settings.accountTypeGroups = normalizeTypeGroups(settings.accountTypeGroups);
    settings.healthConfig = normalizeHealthConfig(settings.healthConfig, settings.accountTypeGroups);
    settings.healthDenominatorConfig = normalizeHealthDenominatorConfig(settings.healthDenominatorConfig, settings.accountTypeGroups);
    settings.healthCustomCards = normalizeHealthCustomCards(settings.healthCustomCards, settings.accountTypeGroups);
    settings.snapshotTags = normalizeSnapshotTagSettings(settings.snapshotTags);
    const needsArchiveMigration = !parsed.settings?.archiveMergeVersion;
    const accounts = (parsed.accounts || []).map((account) => normalizeAccount(account, settings.accountTypeGroups, needsArchiveMigration));
    settings.archiveMergeVersion = 1;
    const snapshots = (parsed.snapshots || []).map(normalizeSnapshot);
    settings.snapshotTags = normalizeSnapshotTagSettings(settings.snapshotTags, snapshots);
    const needsSignMigration = !parsed.settings?.balanceSignVersion;
    if (needsSignMigration) {
      const liabilityIds = new Set(accounts.filter((account) => accountKind(account.type, settings.accountTypeGroups) === "liability").map((account) => account.id));
      snapshots.forEach((snapshot) => {
        liabilityIds.forEach((accountId) => {
          const value = Number(snapshot.balances?.[accountId]);
          if (value > 0) snapshot.balances[accountId] = -value;
        });
      });
      settings.balanceSignVersion = 2;
    }
    const loaded = {
      ...structuredClone(defaultState),
      ...parsed,
      settings,
      accounts,
      snapshots,
    };
    if (needsSignMigration || needsArchiveMigration) localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));
    return loaded;
  } catch {
    return structuredClone(defaultState);
  }
}

function normalizeTypeGroups(groups) {
  if (!Array.isArray(groups) || groups.length === 0) return structuredClone(DEFAULT_ACCOUNT_TYPE_GROUPS);
  return groups.map((group) => ({
    id: group.id || id(),
    name: group.name || "未命名大类",
    kind: group.kind === "liability" ? "liability" : "asset",
    types: Array.isArray(group.types) ? group.types.map((type) => ({ id: type.id || id(), name: type.name || "未命名小类" })) : [],
  }));
}

function isDefaultHealthTypeSelected(cardKey, group, type) {
  if (cardKey === "liability") return group.kind === "liability";
  if (cardKey === "cash") {
    const groupName = group.name || "";
    return group.kind === "asset" && (/现金|流动/.test(groupName) || (group.id === "assets" && ["cash", "bank", "digital"].includes(type.id)));
  }
  if (cardKey === "investment") {
    return group.kind === "asset" && ((group.name || "").includes("投资增值") || type.id === "investment");
  }
  if (cardKey === "account-concentration" || cardKey === "group-concentration") return group.kind === "asset";
  return group.kind === "asset";
}

function defaultHealthScopeForCard(cardKey, groups = DEFAULT_ACCOUNT_TYPE_GROUPS) {
  const excludedGroups = groups.filter((group) => !group.types.some((type) => isDefaultHealthTypeSelected(cardKey, group, type)));
  const excludedTypeIds = groups.flatMap((group) =>
    group.types
      .filter((type) => excludedGroups.some((excludedGroup) => excludedGroup.id === group.id) || !isDefaultHealthTypeSelected(cardKey, group, type))
      .map((type) => type.id)
  );
  return {
    scopeVersion: 2,
    excludedGroupIds: excludedGroups.map((group) => group.id),
    excludedTypeIds,
    excludedAccountGroupNames: [],
    excludedAccountIds: [],
  };
}

function isCustomHealthCardKey(cardKey) {
  return String(cardKey || "").startsWith(CUSTOM_HEALTH_CARD_PREFIX);
}

function customHealthCardId(cardKey) {
  return isCustomHealthCardKey(cardKey) ? String(cardKey).slice(CUSTOM_HEALTH_CARD_PREFIX.length) : "";
}

function normalizeHealthScope(scope, groups, { cardKey = "liability" } = {}) {
  const source = scope && typeof scope === "object" && !Array.isArray(scope) ? scope : {};
  const validGroupIds = new Set(groups.map((group) => group.id));
  const validTypeIds = new Set(groups.flatMap((group) => group.types.map((type) => type.id)));
  const excludedAccountGroupNames = [...new Set(Array.isArray(source.excludedAccountGroupNames) ? source.excludedAccountGroupNames : [])]
    .map((name) => String(name || "").trim())
    .filter(Boolean);
  const excludedAccountIds = [...new Set(Array.isArray(source.excludedAccountIds) ? source.excludedAccountIds : [])]
    .map((accountId) => String(accountId || "").trim())
    .filter(Boolean);
  const defaultScope = defaultHealthScopeForCard(cardKey, groups);
  if (source.scopeVersion !== 2) {
    return {
      scopeVersion: 2,
      excludedGroupIds: [...new Set([
        ...defaultScope.excludedGroupIds,
        ...(Array.isArray(source.excludedGroupIds) ? source.excludedGroupIds : []),
      ])].filter((groupId) => validGroupIds.has(groupId)),
      excludedTypeIds: [...new Set([
        ...defaultScope.excludedTypeIds,
        ...(Array.isArray(source.excludedTypeIds) ? source.excludedTypeIds : []),
      ])].filter((typeId) => validTypeIds.has(typeId)),
      excludedAccountGroupNames,
      excludedAccountIds,
    };
  }
  return {
    scopeVersion: 2,
    excludedGroupIds: [...new Set(Array.isArray(source.excludedGroupIds) ? source.excludedGroupIds : [])]
      .filter((groupId) => validGroupIds.has(groupId)),
    excludedTypeIds: [...new Set(Array.isArray(source.excludedTypeIds) ? source.excludedTypeIds : [])]
      .filter((typeId) => validTypeIds.has(typeId)),
    excludedAccountGroupNames,
    excludedAccountIds,
  };
}

function normalizeHealthCustomCards(cards, groups = DEFAULT_ACCOUNT_TYPE_GROUPS) {
  if (!Array.isArray(cards)) return [];
  const seen = new Set();
  return cards
    .map((card) => {
      const source = card && typeof card === "object" && !Array.isArray(card) ? card : {};
      const idValue = String(source.id || id()).trim();
      if (!idValue || seen.has(idValue)) return null;
      seen.add(idValue);
      const denominatorMode = HEALTH_CUSTOM_DENOMINATORS.some((item) => item.value === source.denominatorMode)
        ? source.denominatorMode
        : "assets";
      const numeratorBasis = HEALTH_CUSTOM_BASIS.some((item) => item.value === source.numeratorBasis)
        ? source.numeratorBasis
        : "balance";
      const denominatorBasis = HEALTH_CUSTOM_BASIS.some((item) => item.value === source.denominatorBasis)
        ? source.denominatorBasis
        : "balance";
      return {
        id: idValue,
        name: String(source.name || "自定义占比").trim() || "自定义占比",
        note: String(source.note || "").trim().slice(0, 40),
        denominatorMode: "custom",
        numeratorBasis,
        denominatorBasis,
        numeratorScope: normalizeHealthScope(source.numeratorScope || source.scope, groups, { cardKey: "custom" }),
        denominatorScope: normalizeHealthScope(denominatorMode === "custom" ? source.denominatorScope : null, groups, { cardKey: "custom" }),
      };
    })
    .filter(Boolean)
    .slice(0, 12);
}

function normalizeHealthConfig(config, groups = DEFAULT_ACCOUNT_TYPE_GROUPS) {
  const source = config && typeof config === "object" && !Array.isArray(config) ? config : {};
  return Object.fromEntries(HEALTH_CARD_KEYS.map((cardKey) => [
    cardKey,
    normalizeHealthScope(source[cardKey], groups, { cardKey }),
  ]));
}

function healthConfig(groups = typeGroups()) {
  return normalizeHealthConfig(state.settings.healthConfig, groups);
}

function normalizeHealthDenominatorConfig(config, groups = DEFAULT_ACCOUNT_TYPE_GROUPS) {
  const source = config && typeof config === "object" && !Array.isArray(config) ? config : {};
  return Object.fromEntries(HEALTH_DENOMINATOR_SCOPE_KEYS.map((cardKey) => [
    cardKey,
    normalizeHealthScope(source[cardKey], groups, { cardKey: "custom" }),
  ]));
}

function healthDenominatorConfig(groups = typeGroups()) {
  return normalizeHealthDenominatorConfig(state.settings.healthDenominatorConfig, groups);
}

function healthCardUsesDenominatorScope(cardKey) {
  return isCustomHealthCardKey(cardKey) || HEALTH_DENOMINATOR_SCOPE_KEYS.includes(cardKey);
}

function healthCustomCards(groups = typeGroups()) {
  return normalizeHealthCustomCards(state.settings.healthCustomCards, groups);
}

function defaultHealthConfig(groups = DEFAULT_ACCOUNT_TYPE_GROUPS) {
  return Object.fromEntries(HEALTH_CARD_KEYS.map((cardKey) => [cardKey, defaultHealthScopeForCard(cardKey, groups)]));
}

function typeGroups() {
  return state.settings.accountTypeGroups;
}

function accountKind(type, groups = typeGroups()) {
  return groups.find((group) => group.types.some((item) => item.id === type))?.kind || "asset";
}

function typeGroupFor(type) {
  return typeGroups().find((group) => group.types.some((item) => item.id === type));
}

function normalizeAccount(account, groups = typeGroups(), mergeHidden = false) {
  let type = account.type || "other";
  if (account.kind === "liability" && accountKind(type, groups) !== "liability") type = "credit";
  if (!groups.some((group) => group.types.some((item) => item.id === type))) {
    type = groups[0]?.types[0]?.id || "other";
  }
  return {
    ...account,
    type,
    currency: String(account.currency || "CNY").trim().toUpperCase(),
    costBasis: account.costBasis === "" || account.costBasis === undefined ? "" : Number(account.costBasis) || "",
    note: account.note || "",
    includeInNetWorth: account.includeInNetWorth !== false,
    archived: Boolean(account.archived || account.hidden),
  };
}

function normalizeSnapshot(snapshot) {
  return {
    ...snapshot,
    balances: snapshot.balances || {},
    costs: snapshot.costs || {},
    rates: snapshot.rates || {},
    tags: Array.isArray(snapshot.tags) ? snapshot.tags.map((tag) => String(tag).trim()).filter(Boolean) : parseTags(snapshot.tags || ""),
    note: snapshot.note || "",
  };
}

function normalizeSnapshotTagSettings(tags, snapshots = []) {
  const configured = Array.isArray(tags) ? tags : DEFAULT_SNAPSHOT_TAGS;
  const used = snapshots.flatMap((snapshot) => snapshot.tags || []);
  return [...new Set([...DEFAULT_SNAPSHOT_TAGS, ...configured, ...used]
    .map((tag) => String(tag).trim())
    .filter(Boolean))];
}

function parseTags(value) {
  return [...new Set(String(value || "")
    .split(/[\s,，、;；]+/)
    .map((tag) => tag.trim())
    .filter(Boolean))];
}

function snapshotTagsText(tags) {
  return (Array.isArray(tags) ? tags : parseTags(tags)).join("、");
}

function allSnapshotTags() {
  return [...new Set([...(state.settings.snapshotTags || []), ...state.snapshots.flatMap((snapshot) => snapshot.tags || [])])]
    .sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function usedSnapshotTags() {
  return [...new Set(state.snapshots.flatMap((snapshot) => snapshot.tags || []))]
    .sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function snapshotTagsHtml(snapshot) {
  const tags = (snapshot.tags || []).slice(0, 3);
  if (!tags.length) return "";
  const rest = (snapshot.tags || []).length - tags.length;
  return `
    <div class="snapshot-tags">
      ${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
      ${rest > 0 ? `<span>+${rest}</span>` : ""}
    </div>
  `;
}

function compactText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function compactPreview(value, maxLength = 14) {
  const text = compactText(value);
  const chars = Array.from(text);
  return chars.length > maxLength ? `${chars.slice(0, maxLength).join("")}...` : text;
}

function snapshotMatchesSearch(snapshot, query) {
  const keyword = compactText(query).toLowerCase();
  if (!keyword) return true;
  const text = compactText([snapshot.note || "", ...(snapshot.tags || [])].join(" ")).toLowerCase();
  return text.includes(keyword);
}

function snapshotMatchesTagFilters(snapshot) {
  if (selectedSnapshotTagFilters.size === 0) return true;
  const tags = new Set(snapshot.tags || []);
  return [...selectedSnapshotTagFilters].every((tag) => tags.has(tag));
}

function snapshotMatchesDateRange(snapshot) {
  if (snapshotDateFrom && snapshot.date < snapshotDateFrom) return false;
  if (snapshotDateTo && snapshot.date > snapshotDateTo) return false;
  return true;
}

function accountGroupName(account) {
  return account.group || "未分组";
}

function orderedGroupNames(accounts) {
  const present = [...new Set(accounts.map(accountGroupName))];
  const saved = state.settings.accountGroupOrder || [];
  const ordered = saved.filter((name) => present.includes(name));
  present.forEach((name) => {
    if (!ordered.includes(name)) ordered.push(name);
  });
  return ordered;
}

function syncGroupOrder() {
  const all = [...new Set(state.accounts.map(accountGroupName))];
  const saved = state.settings.accountGroupOrder || [];
  state.settings.accountGroupOrder = [...saved.filter((name) => all.includes(name)), ...all.filter((name) => !saved.includes(name))];
}

function renameAccountGroup(oldName, newName) {
  const normalizedName = newName.trim();
  if (!normalizedName || normalizedName === oldName) return false;
  const previousOrder = state.settings.accountGroupOrder || [];
  state.accounts.forEach((account) => {
    if (accountGroupName(account) === oldName) account.group = normalizedName;
  });
  state.settings.accountGroupOrder = previousOrder
    .map((name) => (name === oldName ? normalizedName : name))
    .filter((name, index, list) => list.indexOf(name) === index);
  if (collapsedOverviewGroups.has(oldName)) {
    collapsedOverviewGroups.delete(oldName);
    collapsedOverviewGroups.add(normalizedName);
  }
  ["active", "archived"].forEach((scope) => {
    const oldKey = accountListGroupCollapseKey(scope, oldName);
    if (!collapsedAccountGroups.has(oldKey)) return;
    collapsedAccountGroups.delete(oldKey);
    collapsedAccountGroups.add(accountListGroupCollapseKey(scope, normalizedName));
  });
  return true;
}

function accountListGroupCollapseKey(scope, group) {
  return `${scope}::${group}`;
}

function toggleCollapsedValue(set, value) {
  if (set.has(value)) set.delete(value);
  else set.add(value);
}

function groupChevron(collapsed) {
  return `<span class="group-chevron" aria-hidden="true">${collapsed ? "▸" : "▾"}</span>`;
}

function isGroupHeadingAction(target) {
  return Boolean(target.closest("button, input, select, textarea, label, a, [contenteditable='true']"));
}

function saveState() {
  syncGroupOrder();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetInteractionState() {
  editingAccountId = null;
  editingAccountBalanceInitial = "";
  dragPayload = null;
  pointerDrag = null;
  typeDraft = null;
  typeDraftDirty = false;
  accountSortMode = false;
  overviewAccountSortMode = false;
  editingAccountGroupName = null;
  snapshotManageMode = false;
  showAllSnapshots = false;
  snapshotSearchQuery = "";
  snapshotDateFrom = "";
  snapshotDateTo = "";
  editingSnapshotId = null;
  selectedSnapshotIds.clear();
  selectedSnapshotTagFilters.clear();
  trendPeriod = "day";
  visibleTrendLines.clear();
  visibleTrendLines.add("assets");
  visibleTrendLines.add("liabilities");
  visibleTrendLines.add("net");
  selectedTreemapGroup = null;
  snapshotHistoryMode = "edit";
  selectedReportSnapshotId = null;
  selectedReportTreemapGroup = null;
  contributionLookback = 2;
  analysisTrendPeriod = "month";
  snapshotHeatmapMode = "day";
  snapshotHeatmapYear = "";
  snapshotHeatmapMonth = "";
  snapshotHeatmapMetric = "count";
  snapshotHeatmapActiveOnly = false;
  snapshotHeatmapRange = "year";
  analysisTrendMode = "total";
  analysisTrendMetric = "balance";
  selectedAnalysisTrendAccountIds.clear();
  currencyManageMode = false;
  selectedCurrencyCodes.clear();
  typeManageMode = false;
  selectedTypeGroupIds.clear();
  selectedTypeIds.clear();
  tagDraft = null;
  tagDraftDirty = false;
  tagManageMode = false;
  selectedTagNames.clear();
  collapsedOverviewGroups.clear();
  overviewGroupsInitialized = false;
  snapshotSubmitInProgress = false;
  snapshotRateDraft = null;
  snapshotHistoryView = "list";
  snapshotHistoryCalendarMonth = "";
}

async function deleteAllData() {
  const firstConfirm = await confirmDialog(
    "删除全部数据会清空本浏览器中保存的账户、快照、货币、分类和标签设置。该操作无法撤销。\n\n继续前请确认已经导出 JSON 备份。",
    {
      title: "删除全部数据",
      confirmText: "继续删除",
      cancelText: "取消",
      variant: "danger",
    }
  );
  if (!firstConfirm) return;
  const requiredText = "确认删除全部数据";
  const textConfirmed = await textConfirmDialog({
    title: "最终确认",
    message: `这是最后一步。请输入“${requiredText}”后才能删除全部数据。`,
    requiredText,
    confirmText: "删除全部数据",
  });
  if (!textConfirmed) {
    setBackupStatus("输入错误请重试", "error");
    await alertDialog("输入错误请重试", { variant: "danger" });
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(defaultState);
  applyTheme();
  resetInteractionState();
  $("#backupText").value = "";
  $("#backupFallback").open = false;
  renderAll();
  setBackupStatus("全部数据已删除。", "success");
}

function id() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function currencyConfig(code) {
  return allCurrencies().find((item) => item.code === code) || currencies[0];
}

function allCurrencies() {
  const deleted = new Set(state.settings.deletedCurrencyCodes || []);
  return [...currencies, ...(state.settings.customCurrencies || [])].filter((item) => !deleted.has(item.code));
}

function enabledCurrencies() {
  const enabled = state.settings.enabledCurrencies || currencies.map((item) => item.code);
  return allCurrencies().filter((item) => enabled.includes(item.code));
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function significantStep(value) {
  const number = Math.abs(Number(value)) || 1;
  return 10 ** (Math.floor(Math.log10(number)) - 2);
}

function convert(amount, fromCode, rates = state.settings.rates) {
  const base = state.settings.baseCurrency;
  const fromRate = Number(rates[fromCode] || 1);
  const baseRate = Number(rates[base] || 1);
  return (Number(amount) || 0) * (fromRate / baseRate);
}

function effectiveRates(rates = {}) {
  return { ...(state.settings.rates || {}), ...(rates || {}) };
}

function snapshotRates(snapshot) {
  return effectiveRates(snapshot?.rates);
}

function relativeRateValue(code, rates = state.settings.rates) {
  const base = state.settings.baseCurrency;
  const baseRate = Number(rates?.[base] || state.settings.rates?.[base] || 1);
  const value = code === base ? 1 : Number(rates?.[code] ?? state.settings.rates?.[code] ?? currencyConfig(code).rate) / baseRate;
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function setRelativeRate(targetRates, code, relativeRate) {
  const base = state.settings.baseCurrency;
  const baseRate = Number(targetRates?.[base] || state.settings.rates?.[base] || 1);
  targetRates[base] = targetRates[base] || state.settings.rates?.[base] || 1;
  targetRates[code] = Number(relativeRate) * baseRate;
}

function syncLatestSnapshotRates() {
  const latest = latestSnapshot();
  if (!latest) return;
  latest.rates = { ...state.settings.rates };
}

function formatMoney(amount, code = state.settings.baseCurrency) {
  const config = currencyConfig(code);
  return `${config.symbol} ${new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0)}`;
}

function privateMoneyPlaceholder() {
  return "••••••";
}

function latestSnapshot() {
  return [...state.snapshots].sort((a, b) => b.date.localeCompare(a.date))[0] || null;
}

function previousSnapshot() {
  return [...state.snapshots].sort((a, b) => b.date.localeCompare(a.date))[1] || null;
}

function accountCurrentBalance(accountId) {
  const today = state.snapshots.find((snapshot) => snapshot.date === localDateString());
  if (today?.balances?.[accountId] !== undefined) return today.balances[accountId];
  const latest = latestSnapshot();
  return latest?.balances?.[accountId] ?? "";
}

function optionalNumber(value) {
  if (value === "" || value === undefined || value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function snapshotCostForAccount(snapshot, account, fallbackToAccount = true) {
  if (snapshot?.costs && Object.hasOwn(snapshot.costs, account.id)) {
    return optionalNumber(snapshot.costs[account.id]);
  }
  const accountCost = fallbackToAccount ? optionalNumber(account.costBasis) : null;
  if (accountCost !== null) return accountCost;
  return optionalNumber(snapshot?.balances?.[account.id]);
}

function snapshotTotal(snapshot) {
  if (!snapshot) return { net: 0, assets: 0, liabilities: 0, groups: {}, accounts: [] };
  const rates = snapshotRates(snapshot);
  const rows = state.accounts.map((account) => {
    const raw = Number(snapshot.balances[account.id] || 0);
    const kind = accountKind(account.type);
    const signed = raw;
    const converted = account.includeInNetWorth === false ? 0 : convert(signed, account.currency, rates);
    const costRaw = snapshotCostForAccount(snapshot, account);
    const costConverted = costRaw === null || account.includeInNetWorth === false ? null : convert(costRaw, account.currency, rates);
    const gainRaw = costRaw === null ? null : raw - costRaw;
    const gainConverted = costConverted === null ? null : converted - costConverted;
    const gainPercent = costRaw ? (gainRaw / Math.abs(costRaw)) * 100 : null;
    return { account, kind, raw, signed, converted, costRaw, costConverted, gainRaw, gainConverted, gainPercent };
  });

  const included = rows.filter((row) => row.account.includeInNetWorth !== false);
  const assets = included
    .reduce((sum, row) => sum + Math.max(0, row.converted), 0);
  const liabilities = Math.abs(
    included
      .reduce((sum, row) => sum + Math.min(0, row.converted), 0)
  );
  const net = included.reduce((sum, row) => sum + row.converted, 0);
  const groups = {};
  included.forEach((row) => {
    const group = row.account.group || "未分组";
    groups[group] = (groups[group] || 0) + row.converted;
  });

  return { net, assets, liabilities, groups, accounts: rows };
}

function renderCurrencyOptions() {
  const available = enabledCurrencies();
  const options = available
    .map((item) => `<option value="${item.code}">${item.code} · ${item.name}</option>`)
    .join("");
  $("#accountCurrency").innerHTML = options;
  $("#baseCurrency").innerHTML = allCurrencies()
    .map((item) => `<option value="${item.code}">${item.code} · ${item.name}</option>`)
    .join("");
  $("#baseCurrency").value = state.settings.baseCurrency;
  if (!editingAccountId) $("#accountCurrency").value = state.settings.baseCurrency;
  renderAccountRateField();
  const used = new Set(state.accounts.map((account) => account.currency));
  const enabled = state.settings.enabledCurrencies || [];
  const validCodes = new Set(allCurrencies().map((item) => item.code));
  [...selectedCurrencyCodes].forEach((code) => {
    if (!validCodes.has(code)) selectedCurrencyCodes.delete(code);
  });
  $("#toggleCurrencyManage").textContent = currencyManageMode ? "完成" : "管理";
  $("#toggleCurrencyManage").classList.toggle("primary-button", currencyManageMode);
  $("#toggleCurrencyManage").classList.toggle("secondary-button", !currencyManageMode);
  $("#deleteSelectedCurrencies").hidden = !currencyManageMode;
  $("#deleteSelectedCurrencies").disabled = selectedCurrencyCodes.size === 0;
  $("#currencyChoices").innerHTML = allCurrencies().map((item) => {
    const locked = item.code === state.settings.baseCurrency || used.has(item.code);
    const checked = enabled.includes(item.code) || locked;
    const manageChecked = selectedCurrencyCodes.has(item.code) ? "checked" : "";
    const manageTitle = item.code === state.settings.baseCurrency
      ? "主货币不能删除"
      : used.has(item.code)
        ? "有账户正在使用该货币，不能删除"
        : "选择货币";
    return `
      <div class="currency-choice">
        ${currencyManageMode ? `<input data-select-currency="${item.code}" type="checkbox" ${manageChecked} title="${manageTitle}" />` : ""}
        <input name="enabledCurrency" type="checkbox" value="${item.code}" ${checked ? "checked" : ""} ${locked ? "disabled" : ""} />
        <span><b>${item.code}</b>${item.name}</span>
        ${locked ? '<small>使用中</small>' : ""}
      </div>
    `;
  }).join("");
}

function renderAccountTypeOptions(selectedType) {
  const select = $("#accountType");
  select.innerHTML = typeGroups()
    .map(
      (group) => `
        <optgroup label="${escapeHtml(group.name)}">
          ${group.types.map((type) => `<option value="${type.id}">${escapeHtml(type.name)}</option>`).join("")}
        </optgroup>
      `
    )
    .join("");
  if (selectedType && select.querySelector(`option[value="${CSS.escape(selectedType)}"]`)) select.value = selectedType;
}

function renderRates() {
  const base = state.settings.baseCurrency;
  $("#rateSettingsSubtitle").textContent = `以 ${base} 为主货币，1 单位外币可兑换的 ${base}`;
  $("#rateInputs").innerHTML = enabledCurrencies()
    .map((item) => {
      const value = relativeRateValue(item.code);
      const step = significantStep(value);
      return `
        <label>
          1 ${item.code} = 多少 ${base}
          <input name="${item.code}" type="number" step="${step}" min="0" value="${Number(value.toPrecision(8))}" ${item.code === base ? "disabled" : ""} />
        </label>
      `;
    })
    .join("");
}

function renderAccountRateField() {
  const field = $("#accountRateField");
  const input = $("#accountRate");
  const hint = $("#accountRateHint");
  const code = $("#accountCurrency").value || state.settings.baseCurrency;
  const base = state.settings.baseCurrency;
  if (!field || !input || !hint) return;
  const hidden = code === base;
  field.hidden = hidden;
  $("#accountForm").classList.toggle("account-rate-hidden", hidden);
  if (code === base) {
    input.value = "";
    return;
  }
  const value = relativeRateValue(code);
  input.step = String(significantStep(value));
  input.value = Number(value.toPrecision(8));
  hint.textContent = `1 ${code} = 多少 ${base}；保存后同步到全局汇率。`;
}

function renderDashboard() {
  document.body.classList.toggle("hidden-money", state.settings.privacy);
  $("#privacyToggle").textContent = state.settings.privacy ? "显示金额" : "隐藏金额";

  const latest = latestSnapshot();
  const previous = previousSnapshot();
  const total = snapshotTotal(latest);
  const previousTotal = snapshotTotal(previous);
  $("#netWorthValue").innerHTML = moneySpan(formatMoney(total.net));
  $("#assetValue").innerHTML = moneySpan(formatMoney(total.assets));
  $("#liabilityValue").innerHTML = moneySpan(formatMoney(total.liabilities));
  setAdaptiveMoneyClass($("#assetValue"));
  setAdaptiveMoneyClass($("#liabilityValue"));
  $("#latestDateText").textContent = latest ? `最新快照 ${latest.date}` : "暂无快照";
  const netWorthDeltaText = $("#netWorthDeltaText");
  netWorthDeltaText.classList.remove("is-positive", "is-negative", "is-neutral");
  if (latest && previous) {
    const delta = total.net - previousTotal.net;
    const ratio = previousTotal.net ? (delta / Math.abs(previousTotal.net)) * 100 : 0;
    const sign = delta >= 0 ? "+" : "-";
    const deltaMoney = formatMoney(Math.abs(delta)).replace(/\s+/, "");
    netWorthDeltaText.classList.add(delta >= 0 ? "is-positive" : "is-negative");
    netWorthDeltaText.innerHTML = `较上次快照 <span class="delta-value">${sign}${moneySpan(deltaMoney)}</span> <span class="delta-rate">${sign}${Math.abs(ratio).toFixed(1)}%</span>`;
  } else {
    netWorthDeltaText.classList.add("is-neutral");
    netWorthDeltaText.textContent = latest ? "暂无上次快照对比" : "记录快照后显示净值变化";
  }
  const visibleCount = state.accounts.filter((account) => !account.archived).length;
  $("#accountCountText").textContent = `${visibleCount} 个显示账户`;

  renderTrend();
  renderGroups(total);
  renderTypeBreakdown(total);
  renderDashboardRecentSnapshots();
  renderAccountTable(total);
}

function renderDashboardRecentSnapshots() {
  const container = $("#dashboardRecentSnapshots");
  if (!container) return;
  const snapshots = [...state.snapshots]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);
  if (!snapshots.length) {
    container.innerHTML = emptyHtml();
    return;
  }
  container.innerHTML = snapshots.map((snapshot) => {
    const total = snapshotTotal(snapshot);
    return `
      <article class="dashboard-recent-item">
        <span>${escapeHtml(snapshot.date)}</span>
        <b>${moneySpan(formatMoney(total.net))}</b>
      </article>
    `;
  }).join("");
}

function renderAnalysis() {
  const snapshot = latestSnapshot();
  const total = snapshotTotal(snapshot);
  renderStaticAnalysisModules(analysisModuleContext({ snapshot, total, mode: "current" }));
  renderNetWorthContribution();
  renderSnapshotHeatmap();
  renderAnalysisTrend();
  renderAnalysisHealthTrend();
  renderCurrencyExposure(total);
}

function analysisModuleContext({ snapshot = latestSnapshot(), total = snapshotTotal(snapshot), mode = "current" } = {}) {
  return { snapshot, total, mode };
}

function analysisSnapshotText(context) {
  return context.mode === "historical" ? "该次快照" : "最新快照";
}

function staticAnalysisModules(context, options = {}) {
  const snapshotText = analysisSnapshotText(context);
  const selectedGroupId = options.selectedGroupId ?? selectedTreemapGroup;
  const exportMode = Boolean(options.exportMode);
  return [
    {
      moduleId: "asset-health",
      title: "资产健康",
      description: `按${snapshotText}计算`,
      targetId: "healthCards",
      contentClass: "health-grid",
      html: () => healthCardsHtml(context.total, { interactive: context.mode === "current" }),
    },
    {
      moduleId: "asset-treemap",
      title: "资产结构 Treemap",
      description: exportMode ? "按导出时的展开层级保存" : context.mode === "historical" ? "点击分组查看账户明细" : "按分组大类展示，点击矩形查看账户明细",
      targetId: "assetTreemap",
      contentClass: "asset-treemap",
      html: () => assetTreemapHtml(context.total, {
        selectedGroupId,
        backId: context.mode === "historical" ? (exportMode ? "exportTreemapBack" : "reportTreemapBack") : "treemapBack",
        tooltipId: context.mode === "historical" ? (exportMode ? "exportTreemapTooltip" : "reportTreemapTooltip") : "treemapTooltip",
        groupAttr: context.mode === "historical" ? (exportMode ? "data-export-treemap-group" : "data-report-treemap-group") : "data-treemap-group",
        detailAttr: context.mode === "historical" ? (exportMode ? "data-export-treemap-detail" : "data-report-treemap-detail") : "data-treemap-detail",
      }),
    },
    {
      moduleId: "gain-analysis",
      title: "收益分析",
      description: `按${snapshotText}成本计算`,
      targetId: "gainAnalysis",
      contentClass: "gain-analysis",
      html: () => gainAnalysisHtml(context.total, { interactive: context.mode === "current" }),
    },
  ];
}

function renderStaticAnalysisModules(context) {
  staticAnalysisModules(context).forEach((module) => {
    const target = $(`#${module.targetId}`);
    if (target) target.innerHTML = module.html();
  });
}

function reportAnalysisSectionHtml(module) {
  return `
    <section class="report-section" data-analysis-module="${escapeHtml(module.moduleId)}">
      <div class="report-section-heading">
        <h3>${escapeHtml(module.title)}</h3>
        <span>${escapeHtml(module.description)}</span>
      </div>
      <div class="${escapeHtml(module.contentClass)}">${module.html()}</div>
    </section>
  `;
}

function healthMetricValues(total) {
  const assets = Math.max(total.assets || 0, 0);
  const denominatorConfig = healthDenominatorConfig();
  const liabilityRows = healthScopedRows(total, "liability")
    .filter((row) => row.account.includeInNetWorth !== false && row.converted < 0);
  const cashRows = healthScopedRows(total, "cash")
    .filter((row) => row.account.includeInNetWorth !== false && row.converted > 0);
  const investmentRows = healthScopedRows(total, "investment")
    .filter((row) => row.account.includeInNetWorth !== false && row.converted > 0);
  const concentrationRows = healthScopedRows(total, "account-concentration")
    .filter((row) => row.account.includeInNetWorth !== false && row.converted > 0);
  const groupConcentrationRows = healthScopedRows(total, "group-concentration")
    .filter((row) => row.account.includeInNetWorth !== false && row.converted > 0);
  const liabilityTotal = liabilityRows.reduce((sum, row) => sum + Math.abs(row.converted), 0);
  const cashTotal = cashRows
    .reduce((sum, row) => sum + row.converted, 0);
  const investmentTotal = investmentRows
    .reduce((sum, row) => sum + row.converted, 0);
  const maxAccount = concentrationRows.reduce((max, row) => row.converted > (max?.converted || 0) ? row : max, null);
  const groupEntries = healthScopedGroupEntries(groupConcentrationRows);
  const maxGroup = groupEntries.reduce((max, entry) => Math.abs(entry[1]) > Math.abs(max?.[1] || 0) ? entry : max, null);
  const liabilityBase = positiveScopeTotal(total, denominatorConfig.liability);
  const cashBase = positiveScopeTotal(total, denominatorConfig.cash);
  const investmentBase = positiveScopeTotal(total, denominatorConfig.investment);
  const accountConcentrationBase = concentrationRows.reduce((sum, row) => sum + row.converted, 0);
  const groupConcentrationBase = groupEntries.reduce((sum, entry) => sum + entry[1], 0);
  return {
    assets,
    liabilityRatio: liabilityBase ? liabilityTotal / liabilityBase : 0,
    cashRatio: cashBase ? cashTotal / cashBase : 0,
    investmentRatio: investmentBase ? investmentTotal / investmentBase : 0,
    accountConcentrationRatio: accountConcentrationBase && maxAccount ? maxAccount.converted / accountConcentrationBase : 0,
    groupConcentrationRatio: groupConcentrationBase && maxGroup ? maxGroup[1] / groupConcentrationBase : 0,
    maxAccount,
    maxGroup,
  };
}

function customHealthCardKey(card) {
  return `${CUSTOM_HEALTH_CARD_PREFIX}${card.id}`;
}

function customHealthCardByKey(cardKey) {
  const customId = customHealthCardId(cardKey);
  return healthCustomCards().find((card) => card.id === customId) || null;
}

function positiveScopedRows(total, scope) {
  const groups = typeGroups();
  return (total.accounts || [])
    .filter((row) =>
      row.account.includeInNetWorth !== false &&
      row.converted > 0 &&
      accountMatchesHealthScope(row.account, scope, groups)
    );
}

function positiveScopeTotal(total, scope) {
  return positiveScopedRows(total, scope).reduce((sum, row) => sum + row.converted, 0);
}

function customHealthCardMetric(total, card) {
  const numeratorRows = positiveScopedRows(total, card.numeratorScope);
  const denominatorRows = positiveScopedRows(total, card.denominatorScope);
  const numerator = numeratorRows.reduce((sum, row) => sum + customHealthRowValue(row, card.numeratorBasis), 0);
  const denominator = denominatorRows.reduce((sum, row) => sum + customHealthRowValue(row, card.denominatorBasis), 0);
  return {
    numerator,
    denominator,
    ratio: denominator ? numerator / denominator : 0,
    rows: numeratorRows,
  };
}

function customHealthDenominatorLabel(card) {
  return `分母${customHealthBasisLabel(card.denominatorBasis)}`;
}

function customHealthBasisLabel(basis = "balance") {
  return HEALTH_CUSTOM_BASIS.find((item) => item.value === basis)?.label || "余额";
}

function customHealthRowValue(row, basis = "balance") {
  if (basis === "cost") return Math.max(0, row.costConverted ?? row.converted ?? 0);
  return Math.max(0, row.converted || 0);
}

function spriteIconSvg(name) {
  return `<svg class="ui-icon" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
}

function setIconHeading(element, iconName, text) {
  if (!element) return;
  element.innerHTML = `${spriteIconSvg(iconName)}${escapeHtml(text)}`;
}

function healthCardIconName(key) {
  if (key === "liability") return "liability";
  if (key === "cash") return "asset";
  if (key === "investment") return "trend";
  if (key === "account-concentration") return "accounts";
  if (key === "group-concentration") return "distribution";
  return "custom";
}

function analysisHealthCards(total) {
  const metrics = healthMetricValues(total);
  const fixedCards = [
    { key: "liability", label: "\u8d1f\u503a\u7387", value: percentText(metrics.liabilityRatio), hint: "\u8d1f\u503a / \u8d44\u4ea7" },
    { key: "cash", label: "\u6d41\u52a8\u5360\u6bd4", value: percentText(metrics.cashRatio), hint: "\u73b0\u91d1/\u6d41\u52a8\u5927\u7c7b / \u8d44\u4ea7" },
    { key: "investment", label: "\u6295\u8d44\u5360\u6bd4", value: percentText(metrics.investmentRatio), hint: "\u6295\u8d44\u589e\u503c\u5927\u7c7b / \u8d44\u4ea7" },
    {
      key: "account-concentration",
      label: "\u6700\u5927\u8d26\u6237\u96c6\u4e2d\u5ea6",
      value: percentText(metrics.accountConcentrationRatio),
      hint: metrics.maxAccount ? metrics.maxAccount.account.name : "\u6682\u65e0\u8d44\u4ea7\u8d26\u6237",
    },
    {
      key: "group-concentration",
      label: "\u6700\u5927\u5206\u7ec4\u5360\u6bd4",
      value: percentText(metrics.groupConcentrationRatio),
      hint: metrics.maxGroup ? metrics.maxGroup[0] : "\u6682\u65e0\u8d44\u4ea7\u5206\u7ec4",
    },
  ];
  const customCards = healthCustomCards().map((card) => {
    const metric = customHealthCardMetric(total, card);
    const note = String(card.note || "").trim();
    return {
      key: customHealthCardKey(card),
      label: card.name,
      value: percentText(metric.ratio),
      hint: note || `分子${customHealthBasisLabel(card.numeratorBasis)} / ${customHealthDenominatorLabel(card)}`,
    };
  });
  return [...fixedCards, ...customCards];
}

function healthCardsHtml(total, { interactive = true } = {}) {
  return analysisHealthCards(total).map((card) => `
    <article class="health-card ${isCustomHealthCardKey(card.key) ? "is-custom" : ""}" data-health-kind="${escapeHtml(healthCardIconName(card.key))}"${interactive ? ` data-health-detail="${card.key}" role="button" tabindex="0"` : ""}>
      <span class="health-card-label"><i class="health-card-icon" aria-hidden="true"></i>${escapeHtml(card.label)}</span>
      <b>${escapeHtml(card.value)}</b>
      <small>${escapeHtml(card.hint)}</small>
    </article>
  `).join("");
}

function gainAnalysisRows(total) {
  return total.accounts
    .filter((row) =>
      row.account.includeInNetWorth !== false &&
      !row.account.archived &&
      row.kind === "asset" &&
      row.costRaw !== null &&
      row.costRaw !== 0 &&
      row.gainRaw !== null
    )
    .map((row) => ({
      ...row,
      absGainConverted: Math.abs(row.gainConverted || 0),
    }))
    .sort((a, b) => Math.abs(b.gainConverted || 0) - Math.abs(a.gainConverted || 0));
}

function typeGroupLabelForType(type) {
  return typeGroupFor(type)?.name || "其他";
}

function gainAnalysisFilterOptions(rows) {
  if (gainAnalysisFilterMode === "group") {
    return [...new Set(rows.map((row) => accountGroupName(row.account)))].sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  }
  if (gainAnalysisFilterMode === "type") {
    return [...new Set(rows.map((row) => typeGroupLabelForType(row.account.type)))].sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  }
  return [];
}

function gainAnalysisFilteredRows(rows) {
  if (gainAnalysisFilterMode === "group") {
    return rows.filter((row) => accountGroupName(row.account) === gainAnalysisFilterValue);
  }
  if (gainAnalysisFilterMode === "type") {
    return rows.filter((row) => typeGroupLabelForType(row.account.type) === gainAnalysisFilterValue);
  }
  return rows;
}

function gainAnalysisSummary(total, { filtered = true } = {}) {
  const allRows = gainAnalysisRows(total);
  const filterOptions = gainAnalysisFilterOptions(allRows);
  if (gainAnalysisFilterMode !== "all" && !filterOptions.includes(gainAnalysisFilterValue)) {
    gainAnalysisFilterValue = filterOptions[0] || "";
  }
  if (gainAnalysisFilterMode !== "all" && !gainAnalysisFilterValue) gainAnalysisFilterMode = "all";
  const rows = filtered ? gainAnalysisFilteredRows(allRows) : allRows;
  const totalCost = rows.reduce((sum, row) => sum + (row.costConverted || 0), 0);
  const totalGain = rows.reduce((sum, row) => sum + (row.gainConverted || 0), 0);
  const positiveRows = rows.filter((row) => (row.gainConverted || 0) > 0);
  const negativeRows = rows.filter((row) => (row.gainConverted || 0) < 0);
  const positiveGain = positiveRows.reduce((sum, row) => sum + (row.gainConverted || 0), 0);
  const negativeGain = negativeRows.reduce((sum, row) => sum + Math.abs(row.gainConverted || 0), 0);
  return {
    rows,
    allRows,
    filterOptions,
    totalCost,
    totalGain,
    totalGainPercent: totalCost ? (totalGain / Math.abs(totalCost)) * 100 : 0,
    positiveRows,
    negativeRows,
    positiveGain,
    negativeGain,
  };
}

function signedMoneyHtml(value, currency = state.settings.baseCurrency) {
  const sign = Number(value || 0) >= 0 ? "+" : "";
  return moneySpan(`${sign}${formatMoney(value, currency)}`);
}

function compactSignedMoneyHtml(value, currency = state.settings.baseCurrency) {
  const number = Number(value || 0);
  const sign = number >= 0 ? "+ " : "- ";
  return moneySpan(`${sign}${formatMoney(Math.abs(number), currency)}`);
}

function gainBarRowsHtml(rows, denominator, { emptyText }) {
  if (!rows.length) return `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
  return rows.slice(0, 6).map((row) => {
    const gain = row.gainConverted || 0;
    const share = denominator ? Math.abs(gain) / denominator : 0;
    return `
      <div class="gain-row ${gain >= 0 ? "is-positive" : "is-negative"}">
        <div class="gain-row-heading">
          <b>${escapeHtml(row.account.name)}</b>
          <b>${signedMoneyHtml(gain)} · ${gain >= 0 ? "+" : ""}${(row.gainPercent || 0).toFixed(1)}%</b>
        </div>
        <div class="gain-row-meta">
          <span>${escapeHtml(typeLabel(row.account.type))} · 成本 ${moneySpan(formatMoney(row.costRaw, row.account.currency))}</span>
          <span class="gain-track"><i style="width:${Math.max(share * 100, 2).toFixed(2)}%;"></i></span>
        </div>
      </div>
    `;
  }).join("");
}

function gainAnalysisFilterHtml(summary, { interactive = true } = {}) {
  if (!interactive || !summary.allRows.length) return "";
  const modeOptions = [
    { value: "all", label: "全部账户" },
    { value: "group", label: "按分组" },
    { value: "type", label: "按账户类型" },
  ];
  const detailDisabled = gainAnalysisFilterMode === "all" || !summary.filterOptions.length;
  return `
    <div class="gain-filter-bar">
      <label class="control-field">
        <span>筛选</span>
        <select id="gainAnalysisFilterMode" class="control-select">
          ${modeOptions.map((option) => `<option value="${option.value}" ${gainAnalysisFilterMode === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
        </select>
      </label>
      <label class="control-field">
        <span>${gainAnalysisFilterMode === "type" ? "账户类型" : "分组"}</span>
        <select id="gainAnalysisFilterValue" class="control-select" ${detailDisabled ? "disabled" : ""}>
          ${gainAnalysisFilterMode === "all"
            ? `<option value="">全部</option>`
            : summary.filterOptions.map((option) => `<option value="${escapeHtml(option)}" ${gainAnalysisFilterValue === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
        </select>
      </label>
    </div>
  `;
}

function gainAnalysisHtml(total, options = {}) {
  const { interactive = true } = options;
  const summary = gainAnalysisSummary(total, { filtered: interactive });
  if (!summary.allRows.length) {
    return `<div class="empty-state">暂无可计算收益的资产账户，录入资产余额后可查看收益分析。</div>`;
  }
  const filterHtml = gainAnalysisFilterHtml(summary, { interactive });
  if (!summary.rows.length) {
    return `
      ${filterHtml}
      <div class="empty-state">当前筛选下暂无可计算收益的资产账户。</div>
    `;
  }
  const cards = [
    { label: "总成本", value: moneySpan(formatMoney(summary.totalCost)), hint: `${summary.rows.length} 个账户计入成本` },
    {
      label: "总收益",
      value: signedMoneyHtml(summary.totalGain),
      hint: `${summary.totalGain >= 0 ? "+" : ""}${summary.totalGainPercent.toFixed(1)}%`,
      tone: summary.totalGain >= 0 ? "positive" : "negative",
    },
  ];
  const positiveSummaryText = `${summary.positiveRows.length} 账户 · ${compactSignedMoneyHtml(summary.positiveGain)}`;
  const negativeSummaryText = `${summary.negativeRows.length} 账户 · ${compactSignedMoneyHtml(-summary.negativeGain)}`;
  return `
    ${filterHtml}
    <div class="gain-summary-grid">
      ${cards.map((card) => `
        <article class="gain-summary-card ${card.tone || ""}">
          <span>${escapeHtml(card.label)}</span>
          <b>${card.value}</b>
          <small>${card.hint}</small>
        </article>
      `).join("")}
    </div>
    <div class="gain-columns">
      <section class="gain-column">
        <div class="gain-column-heading">
          <b>盈利账户</b>
          <span class="gain-column-summary positive">${positiveSummaryText}</span>
        </div>
        ${gainBarRowsHtml(summary.positiveRows.sort((a, b) => (b.gainConverted || 0) - (a.gainConverted || 0)), summary.positiveGain, {
          emptyText: "暂无正收益账户",
        })}
      </section>
      <section class="gain-column">
        <div class="gain-column-heading">
          <b>亏损账户</b>
          <span class="gain-column-summary negative">${negativeSummaryText}</span>
        </div>
        ${gainBarRowsHtml(summary.negativeRows.sort((a, b) => (a.gainConverted || 0) - (b.gainConverted || 0)), summary.negativeGain, {
          emptyText: "暂无亏损账户",
        })}
      </section>
    </div>
  `;
}

function renderGainAnalysis(total) {
  $("#gainAnalysis").innerHTML = gainAnalysisHtml(total);
}

function openHealthDetail(kind) {
  activeHealthDetailKind = kind;
  const total = snapshotTotal(latestSnapshot());
  const detail = healthDetailData(kind, total);
  setIconHeading($("#healthDetailTitle"), "asset", detail.title);
  $("#healthDetailSubtitle").textContent = detail.subtitle;
  const configureButton = $("#configureHealthDetail");
  configureButton.hidden = !(HEALTH_CARD_KEYS.includes(kind) || isCustomHealthCardKey(kind));
  configureButton.textContent = "配置口径";
  const deleteButton = $("#deleteHealthDetailCard");
  deleteButton.hidden = !isCustomHealthCardKey(kind);
  $("#healthDetailContent").innerHTML = detail.rows.length
    ? detail.rows.map((row, index) => `
      <button class="health-detail-row" type="button">
        <span class="health-detail-rank">${index + 1}</span>
        <span class="health-detail-main">
          <b>${escapeHtml(row.label)}</b>
          <small>${escapeHtml(row.hint)}</small>
          <span class="health-detail-track"><i style="width:${Math.max(row.share * 100, 2).toFixed(2)}%;"></i></span>
        </span>
        <span class="health-detail-value">
          <b>${escapeHtml(percentText(row.share))}</b>
          <small>${moneySpan(formatMoney(row.value))}</small>
        </span>
      </button>
    `).join("")
    : emptyHtml();
  $("#healthDetailSheet").hidden = false;
  document.body.classList.add("sheet-open");
}

function closeHealthDetailSheet() {
  $("#healthDetailSheet").hidden = true;
  activeHealthDetailKind = null;
  if ($$(".sheet-backdrop:not([hidden])").length === 0) document.body.classList.remove("sheet-open");
}

function healthDetailData(kind, total) {
  const assets = Math.max(total.assets || 0, 0);
  const denominatorConfig = healthDenominatorConfig();
  if (isCustomHealthCardKey(kind)) {
    const card = customHealthCardByKey(kind);
    if (!card) {
      return { title: "自定义占比明细", subtitle: "自定义卡已不存在", rows: [] };
    }
    const metric = customHealthCardMetric(total, card);
    const rows = metric.rows
      .map((row) => ({ ...row, detailValue: customHealthRowValue(row, card.numeratorBasis) }))
      .sort((a, b) => b.detailValue - a.detailValue)
      .map((row) => ({
        label: row.account.name,
        hint: typeLabel(row.account.type),
        value: row.detailValue,
      }));
    return {
      title: `${card.name}明细`,
      subtitle: card.note
        ? `${card.note} · 分子${customHealthBasisLabel(card.numeratorBasis)} / ${customHealthDenominatorLabel(card)}`
        : `分子${customHealthBasisLabel(card.numeratorBasis)} / ${customHealthDenominatorLabel(card)}`,
      rows: rows.map((row) => ({ ...row, share: metric.denominator ? row.value / metric.denominator : 0 })),
    };
  }
  const assetRows = healthScopedRows(total, kind)
    .filter((row) => row.account.includeInNetWorth !== false && row.converted > 0)
    .sort((a, b) => b.converted - a.converted);
  const liabilityRows = healthScopedRows(total, "liability")
    .filter((row) => row.account.includeInNetWorth !== false && row.converted < 0)
    .map((row) => ({ ...row, detailValue: Math.abs(row.converted) }))
    .sort((a, b) => b.detailValue - a.detailValue);
  const liabilityTotal = liabilityRows.reduce((sum, row) => sum + row.detailValue, 0);
  const cashRows = healthScopedRows(total, "cash")
    .filter((row) => row.account.includeInNetWorth !== false && row.converted > 0)
    .sort((a, b) => b.converted - a.converted);
  const investmentRows = healthScopedRows(total, "investment")
    .filter((row) => row.account.includeInNetWorth !== false && row.converted > 0)
    .sort((a, b) => b.converted - a.converted);
  const accountConcentrationRows = healthScopedRows(total, "account-concentration")
    .filter((row) => row.account.includeInNetWorth !== false && row.converted > 0)
    .sort((a, b) => b.converted - a.converted);
  const groupConcentrationRows = healthScopedGroupEntries(healthScopedRows(total, "group-concentration")
    .filter((row) => row.account.includeInNetWorth !== false && row.converted > 0));
  const liabilityBase = positiveScopeTotal(total, denominatorConfig.liability);
  const cashBase = positiveScopeTotal(total, denominatorConfig.cash);
  const investmentBase = positiveScopeTotal(total, denominatorConfig.investment);
  const accountConcentrationBase = accountConcentrationRows.reduce((sum, row) => sum + row.converted, 0);
  const groupConcentrationBase = groupConcentrationRows.reduce((sum, entry) => sum + entry[1], 0);
  const detailMap = {
    liability: {
      title: "负债率明细",
      subtitle: "所选范围内负债账户占已计入负债比例",
      base: liabilityBase,
      rows: liabilityRows.map((row) => ({
        label: row.account.name,
        hint: typeLabel(row.account.type),
        value: row.detailValue,
      })),
    },
    cash: {
      title: "流动占比明细",
      subtitle: "所选流动账户占总资产比例",
      base: cashBase,
      rows: cashRows.map((row) => ({
        label: row.account.name,
        hint: typeLabel(row.account.type),
        value: row.converted,
      })),
    },
    investment: {
      title: "投资占比明细",
      subtitle: "所选投资账户占总资产比例",
      base: investmentBase,
      rows: investmentRows.map((row) => ({
        label: row.account.name,
        hint: typeLabel(row.account.type),
        value: row.converted,
      })),
    },
    "account-concentration": {
      title: "账户集中度前三",
      subtitle: "所选范围内单一账户占总资产比例",
      base: accountConcentrationBase,
      rows: accountConcentrationRows.slice(0, 3).map((row) => ({
        label: row.account.name,
        hint: accountGroupName(row.account),
        value: row.converted,
      })),
    },
    "group-concentration": {
      title: "分组集中度前三",
      subtitle: "所选范围内资产分组占总资产比例",
      base: groupConcentrationBase,
      rows: groupConcentrationRows
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([group, value]) => ({
          label: group,
          hint: "资产分组",
          value,
        })),
    },
  };
  const detail = detailMap[kind] || detailMap["account-concentration"];
  const base = detail.base || 0;
  return {
    title: detail.title,
    subtitle: detail.subtitle,
    rows: detail.rows.map((row) => ({ ...row, share: base ? row.value / base : 0 })),
  };
}

function accountMatchesHealthScope(account, scope, groups = typeGroups()) {
  if ((scope.excludedAccountIds || []).includes(account.id)) return false;
  const group = groups.find((item) => item.types.some((type) => type.id === account.type));
  if (!group) return false;
  if ((scope.excludedGroupIds || []).includes(group.id)) return false;
  if ((scope.excludedTypeIds || []).includes(account.type)) return false;
  if ((scope.excludedAccountGroupNames || []).includes(accountGroupName(account))) return false;
  return true;
}

function resolvedHealthScope(cardKey, groups = typeGroups(), config = healthConfig(groups)) {
  if (isCustomHealthCardKey(cardKey)) {
    return customHealthCardByKey(cardKey)?.numeratorScope || defaultHealthScopeForCard("custom", groups);
  }
  return config[cardKey] || defaultHealthScopeForCard(cardKey, groups);
}

function accountInHealthScope(account, cardKey, groups = typeGroups(), config = healthConfig(groups)) {
  return accountMatchesHealthScope(account, resolvedHealthScope(cardKey, groups, config), groups);
}

function healthScopedRows(total, cardKey) {
  const groups = typeGroups();
  const config = healthConfig(groups);
  return (total.accounts || []).filter((row) => accountInHealthScope(row.account, cardKey, groups, config));
}

function healthScopedGroupEntries(rows) {
  const grouped = rows.reduce((result, row) => {
    const groupName = accountGroupName(row.account);
    result[groupName] = (result[groupName] || 0) + row.converted;
    return result;
  }, {});
  return Object.entries(grouped).filter(([, value]) => value > 0);
}

function healthAccountGroupOptions() {
  return orderedGroupNames(state.accounts);
}

function scopeWithAccountSelection(scope) {
  const normalized = normalizeHealthScope(scope, typeGroups(), { cardKey: "custom" });
  normalized.excludedAccountIds = state.accounts
    .filter((account) => !accountMatchesHealthScope(account, normalized))
    .map((account) => account.id);
  normalized.excludedGroupIds = [];
  normalized.excludedTypeIds = [];
  normalized.excludedAccountGroupNames = [];
  return normalized;
}

function accountScopeChecked(account, scope) {
  return !(scope.excludedAccountIds || []).includes(account.id);
}

function setAccountScopeChecked(scope, accountIds, checked) {
  const idSet = new Set(accountIds);
  const excluded = new Set(scope.excludedAccountIds || []);
  idSet.forEach((accountId) => {
    if (checked) excluded.delete(accountId);
    else excluded.add(accountId);
  });
  scope.excludedAccountIds = [...excluded].filter((accountId) => state.accounts.some((account) => account.id === accountId));
  scope.excludedGroupIds = [];
  scope.excludedTypeIds = [];
  scope.excludedAccountGroupNames = [];
}

function healthTypeGroupNameForAccount(account) {
  return typeGroups().find((group) => group.types.some((type) => type.id === account.type))?.name || "未分类";
}

function ensureHealthAccountViewOptions() {
  const select = $("#customHealthAccountView");
  if (!select || select.querySelector('option[value="account"]')) return;
  const option = document.createElement("option");
  option.value = "account";
  option.textContent = "\u6309\u8d26\u6237";
  select.insertBefore(option, select.firstChild);
}

function activeCustomHealthCard() {
  return customHealthCardByKey(activeHealthScopeKind);
}

function activeHealthScopeDraft() {
  if (isCustomHealthCardKey(activeHealthScopeKind) && customHealthDraft) {
    return activeCustomHealthScopePart === "denominator"
      ? customHealthDraft.denominatorScope
      : customHealthDraft.numeratorScope;
  }
  if (activeCustomHealthScopePart === "denominator" && HEALTH_DENOMINATOR_SCOPE_KEYS.includes(activeHealthScopeKind)) {
    return healthDenominatorScopeDraft;
  }
  return healthScopeDraft;
}

function setActiveHealthScopeDraft(scope) {
  if (isCustomHealthCardKey(activeHealthScopeKind) && customHealthDraft) {
    if (activeCustomHealthScopePart === "denominator") customHealthDraft.denominatorScope = scope;
    else customHealthDraft.numeratorScope = scope;
    return;
  }
  if (activeCustomHealthScopePart === "denominator" && HEALTH_DENOMINATOR_SCOPE_KEYS.includes(activeHealthScopeKind)) {
    healthDenominatorScopeDraft = scope;
    return;
  }
  healthScopeDraft = scope;
}

function activeHealthScopeMeta(kind = activeHealthScopeKind) {
  if (isCustomHealthCardKey(kind)) {
    const name = customHealthDraft?.name || activeCustomHealthCard()?.name || "自定义占比";
    const isDenominator = activeCustomHealthScopePart === "denominator";
    return {
      title: `${name}配置`,
      subtitle: isDenominator ? "勾选要计入分母的账户" : "勾选要计入分子的账户",
      emptyText: "暂无可配置的账户",
      defaultText: isDenominator ? "当前编辑分母范围" : "当前编辑分子范围",
    };
  }
  const meta = HEALTH_CARD_META[kind] || HEALTH_CARD_META.liability;
  const usesDenominator = HEALTH_DENOMINATOR_SCOPE_KEYS.includes(kind);
  const isDenominator = usesDenominator && activeCustomHealthScopePart === "denominator";
  return {
    title: meta.title,
    subtitle: usesDenominator
      ? (isDenominator ? "\u52fe\u9009\u8981\u8ba1\u5165\u5206\u6bcd\u7684\u8d26\u6237" : "\u52fe\u9009\u8981\u8ba1\u5165\u5206\u5b50\u7684\u8d26\u6237")
      : "\u52fe\u9009\u8981\u53c2\u4e0e\u8ba1\u7b97\u7684\u8d26\u6237",
    emptyText: "暂无可配置的账户类型",
    defaultText: usesDenominator
      ? (isDenominator ? "\u5f53\u524d\u7f16\u8f91\u5206\u6bcd\u8303\u56f4" : "\u5f53\u524d\u7f16\u8f91\u5206\u5b50\u8303\u56f4")
      : "\u5f53\u524d\u7f16\u8f91\u53c2\u4e0e\u8303\u56f4",
  };
}

function renderHealthScopeManager() {
  const groups = typeGroups();
  const meta = activeHealthScopeMeta();
  const isCustom = isCustomHealthCardKey(activeHealthScopeKind);
  const usesDenominator = healthCardUsesDenominatorScope(activeHealthScopeKind);
  const draft = activeHealthScopeDraft() || structuredClone(healthConfig().liability);
  draft.excludedGroupIds ||= [];
  draft.excludedTypeIds ||= [];
  draft.excludedAccountGroupNames ||= [];
  const customForm = $("#customHealthForm");
  if (customForm) {
    customForm.hidden = false;
    customForm.classList.toggle("is-fixed", !isCustom);
    $("#customHealthScopeTabs").hidden = !usesDenominator;
    $("#customHealthBasisTabs").hidden = !isCustom;
    $$("[data-custom-health-scope-part]").forEach((button) => {
      button.classList.toggle("active", button.dataset.customHealthScopePart === activeCustomHealthScopePart);
    });
    ensureHealthAccountViewOptions();
    $("#customHealthAccountView").value = customHealthAccountViewMode;
    if (isCustom && customHealthDraft) {
      $("#customHealthName").value = customHealthDraft.name;
      $("#customHealthNote").value = customHealthDraft.note || "";
      const activeBasis = activeCustomHealthScopePart === "denominator"
        ? customHealthDraft.denominatorBasis
        : customHealthDraft.numeratorBasis;
      $$("[data-custom-health-basis]").forEach((button) => {
        button.classList.toggle("active", button.dataset.customHealthBasis === activeBasis);
      });
    }
  }
  if (draft && !Array.isArray(draft.excludedAccountIds)) {
    setActiveHealthScopeDraft(scopeWithAccountSelection(draft));
    return renderHealthScopeManager();
  }
  const accountGroupNames = healthAccountGroupOptions();
  const selectedGroupCount = groups.filter((group) => !draft.excludedGroupIds.includes(group.id)).length;
  const selectedAccountGroupCount = accountGroupNames.filter((groupName) => !draft.excludedAccountGroupNames.includes(groupName)).length;
  const selectedTypeCount = groups.reduce((sum, group) => sum + group.types.filter((type) =>
    !draft.excludedGroupIds.includes(group.id) &&
    !draft.excludedTypeIds.includes(type.id)
  ).length, 0);
  const selectedAccountCount = state.accounts.filter((account) => accountScopeChecked(account, draft)).length;
  setIconHeading($("#healthScopeTitle"), "filter", meta.title);
  $("#healthScopeSubtitle").textContent = meta.subtitle;
  $("#healthScopeHint").textContent = groups.length
    ? `\u5df2\u8ba1\u5165 ${selectedAccountCount} / ${state.accounts.length} \u4e2a\u8d26\u6237 \u00b7 ${meta.defaultText}`
    : meta.emptyText;
  $("#healthScopeManager").innerHTML = renderCustomHealthAccountScopeHtml(draft);
  return;
  $("#healthScopeHint").textContent = groups.length
    ? isCustom
      ? `已计入 ${selectedAccountCount} / ${state.accounts.length} 个账户 · ${meta.defaultText}`
      : `已计入 ${selectedAccountGroupCount} / ${accountGroupNames.length} 个账户分组 · ${selectedGroupCount} / ${groups.length} 个类型大类 · ${selectedTypeCount} 个小类 · ${meta.defaultText}`
    : meta.emptyText;
  if (isCustom) {
    $("#healthScopeManager").innerHTML = renderCustomHealthAccountScopeHtml(draft);
    return;
  }
  const accountGroupFilterHtml = accountGroupNames.length
    ? `
      <section class="health-scope-account-groups">
        <div class="health-scope-section-heading">
          <b>账户分组</b>
          <span>先按实际账户分组限定参与范围</span>
        </div>
        <div class="health-scope-account-group-list">
          ${accountGroupNames.map((groupName) => `
            <label class="health-scope-chip health-scope-account-group-chip">
              <input data-health-account-group="${escapeHtml(groupName)}" type="checkbox" ${draft.excludedAccountGroupNames.includes(groupName) ? "" : "checked"} />
              <span>${escapeHtml(groupName)}</span>
            </label>
          `).join("")}
        </div>
      </section>
    `
    : "";
  const typeScopeHtml = groups.length
    ? groups.map((group) => {
      const groupChecked = !draft.excludedGroupIds.includes(group.id);
      return `
        <section class="health-scope-group">
          <label class="health-scope-group-toggle">
            <input class="manager-checkbox" data-health-scope-group="${group.id}" type="checkbox" ${groupChecked ? "checked" : ""} />
            <span class="health-scope-group-meta">
              <b>${escapeHtml(group.name)}</b>
              <small>${group.types.length} 个小类</small>
            </span>
          </label>
          <div class="health-scope-types">
            ${group.types.map((type) => {
              const typeChecked = groupChecked && !draft.excludedTypeIds.includes(type.id);
              return `
                <label class="health-scope-chip ${groupChecked ? "" : "is-disabled"}">
                  <input data-health-scope-type="${type.id}" data-health-scope-parent="${group.id}" type="checkbox" ${typeChecked ? "checked" : ""} ${groupChecked ? "" : "disabled"} />
                  <span>${escapeHtml(type.name)}</span>
                </label>
              `;
            }).join("")}
          </div>
        </section>
      `;
    }).join("")
    : emptyHtml();
  $("#healthScopeManager").innerHTML = accountGroupFilterHtml + typeScopeHtml;
}

function renderHealthScopeManagerKeepingScroll() {
  const sheet = $("#healthScopeSheet .account-sheet");
  const scrollTop = sheet?.scrollTop || 0;
  renderHealthScopeManager();
  if (!sheet) return;
  sheet.scrollTop = scrollTop;
  requestAnimationFrame(() => {
    sheet.scrollTop = scrollTop;
  });
}

function renderCustomHealthAccountScopeHtml(draft) {
  const accounts = [...state.accounts].sort((a, b) =>
    accountGroupName(a).localeCompare(accountGroupName(b), "zh-Hans-CN") ||
    typeLabel(a.type).localeCompare(typeLabel(b.type), "zh-Hans-CN") ||
    a.name.localeCompare(b.name, "zh-Hans-CN")
  );
  if (!accounts.length) return emptyHtml();
  const grouped = {};
  accounts.forEach((account) => {
    const groupName = customHealthAccountViewMode === "account"
      ? "\u5168\u90e8\u8d26\u6237"
      : customHealthAccountViewMode === "type"
        ? healthTypeGroupNameForAccount(account)
        : accountGroupName(account);
    (grouped[groupName] ||= []).push(account);
  });
  return Object.entries(grouped).map(([groupName, items]) => {
    const checkedCount = items.filter((account) => accountScopeChecked(account, draft)).length;
    const allChecked = checkedCount === items.length;
    return `
      <section class="health-account-scope-group">
        <label class="health-account-scope-heading">
          <input class="manager-checkbox" data-health-account-scope-group="${escapeHtml(groupName)}" type="checkbox" ${allChecked ? "checked" : ""} />
          <span>
            <b>${escapeHtml(groupName)}</b>
            <small>${checkedCount} / ${items.length} 个账户</small>
          </span>
        </label>
        <div class="health-account-scope-list">
          ${items.map((account) => `
            <label class="health-account-scope-item">
              <input data-health-account-scope-account="${escapeHtml(account.id)}" data-health-account-scope-group-name="${escapeHtml(groupName)}" type="checkbox" ${accountScopeChecked(account, draft) ? "checked" : ""} />
              <span>
                <b>${escapeHtml(account.name)}</b>
                <small>${escapeHtml(accountGroupName(account))} · ${escapeHtml(typeLabel(account.type))}${account.archived ? " · 已归档" : ""}</small>
              </span>
            </label>
          `).join("")}
        </div>
      </section>
    `;
  }).join("");
}

async function saveHealthScopeDraft() {
  if (isCustomHealthCardKey(activeHealthScopeKind)) {
    if (!customHealthDraft) return true;
    customHealthDraft.name = String($("#customHealthName")?.value || customHealthDraft.name || "").trim();
    customHealthDraft.note = String($("#customHealthNote")?.value || "").trim();
    if (!customHealthDraft.name) {
      await alertDialog("自定义占比卡名称不能为空。");
      return false;
    }
    const normalized = normalizeHealthCustomCards([customHealthDraft], typeGroups())[0];
    if (!normalized) return false;
    const cards = healthCustomCards();
    const existingIndex = cards.findIndex((card) => card.id === normalized.id);
    state.settings.healthCustomCards = existingIndex >= 0
      ? cards.map((card) => card.id === normalized.id ? normalized : card)
      : [...cards, normalized];
    healthScopeDraftDirty = false;
    customHealthDraft = null;
    saveState();
    renderAnalysis();
    if (activeHealthDetailKind === activeHealthScopeKind && !$("#healthDetailSheet").hidden) openHealthDetail(activeHealthDetailKind);
    await closeSettingsSheet($("#healthScopeSheet"));
    return true;
  }
  if (!healthScopeDraft) return true;
  const config = healthConfig();
  state.settings.healthConfig = {
    ...config,
    [activeHealthScopeKind]: normalizeHealthScope(healthScopeDraft, typeGroups(), { cardKey: activeHealthScopeKind }),
  };
  if (HEALTH_DENOMINATOR_SCOPE_KEYS.includes(activeHealthScopeKind) && healthDenominatorScopeDraft) {
    state.settings.healthDenominatorConfig = {
      ...healthDenominatorConfig(),
      [activeHealthScopeKind]: normalizeHealthScope(healthDenominatorScopeDraft, typeGroups(), { cardKey: "custom" }),
    };
  }
  healthScopeDraftDirty = false;
  saveState();
  renderAnalysis();
  if (activeHealthDetailKind === activeHealthScopeKind && !$("#healthDetailSheet").hidden) openHealthDetail(activeHealthDetailKind);
  await closeSettingsSheet($("#healthScopeSheet"));
  return true;
}

async function deleteCustomHealthCardByKey(cardKey) {
  const card = customHealthCardByKey(cardKey);
  if (!card) return;
  const ok = await confirmDialog(`确定删除自定义占比卡“${card.name}”吗？`, {
    title: "删除自定义占比卡",
    confirmText: "删除",
    variant: "danger",
  });
  if (!ok) return;
  state.settings.healthCustomCards = healthCustomCards().filter((item) => item.id !== card.id);
  if (activeHealthDetailKind === cardKey) activeHealthDetailKind = null;
  if (activeHealthScopeKind === cardKey) activeHealthScopeKind = "liability";
  customHealthDraft = null;
  healthScopeDraftDirty = false;
  saveState();
  renderAnalysis();
  $("#healthDetailSheet").hidden = true;
  if (!$("#healthScopeSheet").hidden) await closeSettingsSheet($("#healthScopeSheet"));
  if ($$(".sheet-backdrop:not([hidden])").length === 0) document.body.classList.remove("sheet-open");
}

function showTreemapTooltip(tile) {
  const tooltip = $(tile.dataset.treemapTooltipTarget || "#treemapTooltip");
  const canvas = tile.closest(".treemap-canvas");
  if (!tooltip || !canvas) return;
  tooltip.innerHTML = `
    <b>${escapeHtml(tile.dataset.treemapLabel || "")}</b>
    <span>${moneySpan(tile.dataset.treemapMoney || "")} · ${escapeHtml(tile.dataset.treemapPercent || "")}</span>
  `;
  tooltip.hidden = false;
  const tileRect = tile.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const margin = 8;
  let left = tileRect.left - canvasRect.left + Math.min(tileRect.width / 2, 24);
  let top = tileRect.top - canvasRect.top + margin;
  if (left + tooltipRect.width + margin > canvasRect.width) left = canvasRect.width - tooltipRect.width - margin;
  if (left < margin) left = margin;
  if (top + tooltipRect.height + margin > canvasRect.height) {
    top = tileRect.top - canvasRect.top - tooltipRect.height - margin;
  }
  if (top < margin) top = margin;
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function hideTreemapTooltip() {
  const tooltip = $("#treemapTooltip");
  if (tooltip) tooltip.hidden = true;
}

function hideReportTreemapTooltip() {
  const tooltip = $("#reportTreemapTooltip");
  if (tooltip) tooltip.hidden = true;
}

function selectedReportSnapshot() {
  return state.snapshots.find((snapshot) => snapshot.id === selectedReportSnapshotId) || null;
}

function openHistoricalReport(snapshotId) {
  selectedReportSnapshotId = snapshotId;
  selectedReportTreemapGroup = null;
  renderHistoricalReport();
  $("#historicalReportSheet").hidden = false;
  document.body.classList.add("sheet-open");
}

function closeHistoricalReportSheet() {
  $("#historicalReportSheet").hidden = true;
  selectedReportTreemapGroup = null;
  if ($$(".sheet-backdrop:not([hidden])").length === 0) document.body.classList.remove("sheet-open");
}

function renderHistoricalReport() {
  const snapshot = selectedReportSnapshot();
  if (!snapshot) {
    $("#historicalReportSubtitle").textContent = "\u672a\u9009\u62e9\u5feb\u7167";
    $("#historicalReportContent").innerHTML = emptyHtml();
    $("#exportHistoricalReportHtml").disabled = true;
    return;
  }
  $("#historicalReportSubtitle").textContent = `${snapshot.date} \u00b7 \u6309\u5386\u53f2\u5feb\u7167\u8ba1\u7b97`;
  $("#exportHistoricalReportHtml").disabled = false;
  $("#historicalReportContent").innerHTML = historicalReportBodyHtml(snapshot, {
    selectedGroupId: selectedReportTreemapGroup,
    exportMode: false,
  });
}

function historicalReportBodyHtml(snapshot, { selectedGroupId = null, exportMode = false } = {}) {
  const total = snapshotTotal(snapshot);
  const context = analysisModuleContext({ snapshot, total, mode: "historical" });
  const modules = staticAnalysisModules(context, { selectedGroupId, exportMode });
  return `
    <section class="report-summary-grid">
      <article><span>\u5386\u53f2\u65e5\u671f</span><b>${escapeHtml(snapshot.date)}</b></article>
      <article><span>\u51c0\u503c</span><b>${moneySpan(formatMoney(total.net))}</b></article>
      <article><span>\u8d44\u4ea7</span><b>${moneySpan(formatMoney(total.assets))}</b></article>
      <article><span>\u8d1f\u503a</span><b>${moneySpan(formatMoney(total.liabilities))}</b></article>
    </section>
    ${modules.map(reportAnalysisSectionHtml).join("")}
  `;
}

function historicalReportExportCss() {
  return `
    :root { color-scheme: light; --ink:#101828; --muted:#667085; --line:#d8dee9; --blue:#2563eb; }
    * { box-sizing: border-box; }
    body.report-export { margin: 0; padding: 28px; background: #f4f7fb; color: var(--ink); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; }
    body.report-export main { display: grid; gap: 18px; max-width: 980px; margin: 0 auto; padding: 0; }
    body.report-export header,
    body.report-export .report-section,
    body.report-export .report-summary-grid article {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 12px 28px rgba(15, 23, 42, .06);
    }
    body.report-export header { padding: 18px 20px; }
    body.report-export .report-section {
      padding: 18px 20px 20px;
      gap: 14px;
    }
    body.report-export .report-section-heading {
      align-items: flex-end;
      gap: 12px;
      margin: 0;
    }
    body.report-export h1,
    body.report-export h2,
    body.report-export h3,
    body.report-export p { margin: 0; }
    body.report-export h1 { font-size: 26px; line-height: 1.15; }
    body.report-export .report-summary-grid,
    body.report-export .health-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    body.report-export .report-summary-grid article {
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
    }
    body.report-export .report-summary-grid b { text-align: right; font-size: 16px; font-weight: 700; line-height: 1; }
    body.report-export .report-summary-grid article:first-child b { font-size: 16px; font-weight: 700; }
    body.report-export .report-summary-grid b .money { font-size: inherit; font-weight: inherit; line-height: inherit; }
    body.report-export .health-card span,
    body.report-export .health-card small {
      white-space: normal;
    }
    body.report-export .treemap-toolbar button,
    body.report-export #exportTreemapBack,
    body.report-export .treemap-tooltip {
      display: none !important;
    }
    body.report-export .gain-column-heading .gain-column-summary {
      font-size: var(--text-support, 12px);
      font-weight: 600;
    }
    body.report-export .gain-column-summary b,
    body.report-export .gain-column-summary .money {
      font-size: inherit;
      font-weight: inherit;
    }
    @media (max-width: 980px) {
      body.report-export .report-summary-grid,
      body.report-export .health-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 720px) {
      body.report-export { padding: 14px; }
      body.report-export .report-summary-grid,
      body.report-export .health-grid,
      body.report-export .gain-summary-grid,
      body.report-export .gain-columns {
        grid-template-columns: 1fr;
      }
      body.report-export .report-section-heading { display: grid; }
    }
  `;
}

async function currentStylesheetText() {
  const href = document.querySelector('link[rel="stylesheet"]')?.href || "./styles.css";
  try {
    const response = await fetch(href, { cache: "no-store" });
    if (response.ok) return await response.text();
  } catch (error) {
    console.warn("Failed to embed current stylesheet for report export", error);
  }
  return "";
}

function historicalReportHtml(snapshot, stylesheetText = "") {
  const title = `\u8d44\u4ea7\u5386\u53f2\u5206\u6790\u62a5\u544a - ${snapshot.date}`;
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    ${stylesheetText}
    ${historicalReportExportCss()}
  </style>
</head>
<body class="report-export">
  <main>
    <header>
      <h1>${escapeHtml(title)}</h1>
      <p>\u5bfc\u51fa\u65f6\u95f4\uff1a${escapeHtml(new Date().toLocaleString("zh-CN"))}</p>
    </header>
    ${historicalReportBodyHtml(snapshot, { selectedGroupId: selectedReportTreemapGroup, exportMode: true })}
  </main>
</body>
</html>`;
}

async function exportHistoricalReport() {
  const snapshot = selectedReportSnapshot();
  if (!snapshot) return;
  const filename = `asset-history-report-${snapshot.date}.html`;
  const stylesheetText = await currentStylesheetText();
  const result = await saveTextFile({
    filename,
    content: historicalReportHtml(snapshot, stylesheetText),
    type: "text/html;charset=utf-8",
    description: "HTML \u5386\u53f2\u5206\u6790\u62a5\u544a",
    accept: { "text/html": [".html"] },
  });
  $("#historicalReportSubtitle").textContent = result.cancelled
    ? `${snapshot.date} \u00b7 HTML \u62a5\u544a\u5df2\u53d6\u6d88\u5bfc\u51fa`
    : result.ok
      ? `${snapshot.date} \u00b7 HTML \u62a5\u544a\u5df2\u5bfc\u51fa`
      : `${snapshot.date} \u00b7 \u5bfc\u51fa\u5931\u8d25`;
}

function assetTreemapHtml(total, {
  selectedGroupId = null,
  backId = "treemapBack",
  tooltipId = "treemapTooltip",
  groupAttr = "data-treemap-group",
  detailAttr = "data-treemap-detail",
} = {}) {
  const assets = total.accounts
    .filter((row) => row.account.includeInNetWorth !== false && row.converted > 0)
    .map((row) => ({ account: row.account, group: accountGroupName(row.account), value: row.converted }))
    .sort((a, b) => b.value - a.value);
  const sum = assets.reduce((totalValue, row) => totalValue + row.value, 0);
  if (!sum) return emptyHtml();
  const grouped = assets.reduce((result, row) => {
    (result[row.group] ||= []).push(row);
    return result;
  }, {});
  const colors = chartPalette();
  const rawGroupItems = Object.entries(grouped)
    .map(([group, rows], groupIndex) => ({
      id: group,
      label: group,
      value: rows.reduce((sumValue, row) => sumValue + row.value, 0),
      rows,
      color: colors[groupIndex % colors.length],
    }))
    .sort((a, b) => b.value - a.value);
  const lowValueGroups = rawGroupItems.filter((item) => item.value / sum < TREEMAP_MIN_GROUP_SHARE);
  const primaryGroups = rawGroupItems.filter((item) => item.value / sum >= TREEMAP_MIN_GROUP_SHARE);
  const groupItems = lowValueGroups.length && primaryGroups.length
    ? [
        ...primaryGroups,
        {
          id: TREEMAP_OTHER_GROUP_ID,
          label: TREEMAP_OTHER_GROUP_LABEL,
          value: lowValueGroups.reduce((totalValue, item) => totalValue + item.value, 0),
          rows: lowValueGroups.flatMap((item) => item.rows),
          color: "#64748b",
        },
      ].sort((a, b) => b.value - a.value)
    : rawGroupItems;
  const selectedGroup = selectedGroupId ? groupItems.find((item) => item.id === selectedGroupId) : null;
  const items = selectedGroup
    ? selectedGroup.rows.map((row) => ({
        id: row.account.id,
        label: selectedGroup.id === TREEMAP_OTHER_GROUP_ID ? `${row.account.name} · ${row.group}` : row.account.name,
        value: row.value,
        color: selectedGroup.color,
      }))
    : groupItems;
  const itemSum = selectedGroup ? selectedGroup.value : sum;
  const rects = layoutTreemap(items, { x: 0, y: 0, w: 100, h: 100 });
  return `
    <div class="treemap-toolbar">
      <div>
        <b>${selectedGroup ? escapeHtml(selectedGroup.label) : "\u5168\u90e8\u8d44\u4ea7\u5206\u7ec4"}</b>
        <span>${selectedGroup ? "\u8d26\u6237\u660e\u7ec6" : "\u70b9\u51fb\u5206\u7ec4\u67e5\u770b\u8d26\u6237\u660e\u7ec6"}</span>
      </div>
      <button class="secondary-button small" id="${backId}" type="button" ${selectedGroup ? "" : "hidden"}>\u8fd4\u56de\u4e0a\u5c42</button>
    </div>
    <div class="treemap-canvas" aria-label="${selectedGroup ? "\u5206\u7ec4\u8d26\u6237\u77e9\u5f62\u6811\u56fe" : "\u8d44\u4ea7\u5206\u7ec4\u77e9\u5f62\u6811\u56fe"}">
      ${rects.map((item) => {
        const area = item.w * item.h;
        const densityClass = area < 420 ? "is-tiny" : area < 900 ? "is-compact" : "";
        const itemMoney = formatMoney(item.value);
        const itemPercent = percentText(item.value / itemSum);
        const clickAttrs = selectedGroup
          ? ` role="button" tabindex="0" ${detailAttr}="true" data-treemap-tooltip-target="#${tooltipId}" data-treemap-label="${escapeHtml(item.label)}" data-treemap-money="${escapeHtml(itemMoney)}" data-treemap-percent="${escapeHtml(itemPercent)}"`
          : ` role="button" tabindex="0" ${groupAttr}="${escapeHtml(item.id)}"`;
        return `
          <article class="treemap-tile ${densityClass} is-clickable" ${clickAttrs}
            style="left:${item.x}%; top:${item.y}%; width:${item.w}%; height:${item.h}%; background:${item.color};">
            <b>${escapeHtml(item.label)}</b>
            <span>${moneySpan(itemMoney)}</span>
            <small>${itemPercent}</small>
          </article>
        `;
      }).join("")}
      <div class="treemap-tooltip" id="${tooltipId}" hidden></div>
    </div>
  `;
}

function layoutTreemap(items, rect) {
  const validItems = items.filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
  const totalValue = validItems.reduce((sum, item) => sum + item.value, 0);
  const layout = [];
  const split = (rows, area) => {
    if (!rows.length) return;
    if (rows.length === 1) {
      layout.push({ ...rows[0], ...area });
      return;
    }
    const total = rows.reduce((sum, item) => sum + item.value, 0);
    let leftTotal = 0;
    let bestTotal = 0;
    let bestIndex = 1;
    let bestDiff = Infinity;
    for (let index = 0; index < rows.length - 1; index += 1) {
      leftTotal += rows[index].value;
      const diff = Math.abs(total / 2 - leftTotal);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIndex = index + 1;
        bestTotal = leftTotal;
      }
    }
    const leftItems = rows.slice(0, bestIndex);
    const rightItems = rows.slice(bestIndex);
    leftTotal = bestTotal;
    const ratio = leftTotal / total;
    if (area.w >= area.h) {
      const leftWidth = area.w * ratio;
      split(leftItems, { x: area.x, y: area.y, w: leftWidth, h: area.h });
      split(rightItems, { x: area.x + leftWidth, y: area.y, w: area.w - leftWidth, h: area.h });
    } else {
      const topHeight = area.h * ratio;
      split(leftItems, { x: area.x, y: area.y, w: area.w, h: topHeight });
      split(rightItems, { x: area.x, y: area.y + topHeight, w: area.w, h: area.h - topHeight });
    }
  };
  split(validItems.map((item) => ({ ...item, value: item.value / totalValue })), rect);
  return layout.map((item) => ({ ...item, value: item.value * totalValue }));
}

function percentText(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

function moneySpan(text) {
  return `<span class="money">${state.settings.privacy ? privateMoneyPlaceholder() : text}</span>`;
}

function accountGainHtml(row) {
  const { account, gainRaw, gainPercent, costRaw } = row;
  if (!costRaw || gainRaw === null || gainPercent === null) return "";
  const gain = Number(gainRaw || 0);
  const sign = gain >= 0 ? "+" : "";
  return `<span class="meta account-gain ${gain >= 0 ? "positive" : "negative"}">收益 ${moneySpan(`${sign}${formatMoney(gain, account.currency)}`)} · ${sign}${gainPercent.toFixed(1)}%</span>`;
}

function renderTrend() {
  const svg = $("#trendChart");
  renderTrendControls();
  const points = trendPoints();
  const activeSeries = trendSeries().filter((series) => visibleTrendLines.has(series.key));

  if (points.length === 0) {
    svg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="var(--chart-label)">暂无趋势数据</text>`;
    $("#trendSummary").textContent = "";
    return;
  }

  const previous = points[points.length - 2]?.net;
  const last = points[points.length - 1].net;
  const change = previous === undefined ? 0 : last - previous;
  const periodText = trendPeriodLabel();

  $("#trendSummary").innerHTML =
    points.length > 1
      ? `${periodText} · 净值较上点 <span class="${change >= 0 ? "positive" : "negative"}">${moneySpan(`${change >= 0 ? "+" : ""}${formatMoney(change)}`)}</span>`
      : "仅 1 条记录";

  renderInteractiveLineChart(svg, points, activeSeries, {
    chartId: "trend",
    emptyText: "暂无趋势数据",
  });
}

function trendSeries() {
  return [
    { key: "assets", label: "资产", color: themeColor("--chart-asset", "#2a9d76") },
    { key: "liabilities", label: "负债", color: themeColor("--chart-liability", "#d95454") },
    { key: "net", label: "净值", color: themeColor("--chart-net", "#2f63df") },
  ];
}

function periodConfig(period) {
  return {
    day: { limit: 12, label: "按日" },
    month: { limit: 12, label: "按月" },
    quarter: { limit: 8, label: "按季" },
    year: { limit: 6, label: "按年" },
  }[period] || { limit: 12, label: "按日" };
}

function trendPeriodConfig(period = trendPeriod) {
  return periodConfig(period);
}

function trendPeriodLabel() {
  return trendPeriodConfig().label;
}

function renderTrendControls() {
  $$("[data-trend-line]").forEach((input) => {
    input.checked = visibleTrendLines.has(input.dataset.trendLine);
    input.closest(".trend-toggle")?.classList.toggle("active", input.checked);
  });
  $$("[data-trend-period]").forEach((button) => {
    button.classList.toggle("active", button.dataset.trendPeriod === trendPeriod);
  });
}

function periodSnapshotPoints(period, limit = periodConfig(period).limit) {
  const sorted = [...state.snapshots].sort((a, b) => a.date.localeCompare(b.date));
  if (period === "day") {
    return sorted.slice(-limit).map((snapshot) => ({
      snapshot,
      date: snapshot.date,
      key: snapshot.date,
      label: formatChartDate(snapshot.date),
      title: snapshot.date,
    }));
  }
  const grouped = new Map();
  sorted.forEach((snapshot) => {
    const bucket = snapshotPeriod(snapshot.date, period);
    grouped.set(bucket.key, { snapshot, date: snapshot.date, key: bucket.key, label: bucket.label, title: bucket.title });
  });
  return [...grouped.values()]
    .slice(-limit)
    .map((point) => ({ ...point, title: `${point.title} · ${point.snapshot.date}` }));
}

function trendPoints() {
  return periodSnapshotPoints(trendPeriod).map(({ snapshot, date, label, title }) => {
    const total = snapshotTotal(snapshot);
    return { date, label, title, assets: total.assets, liabilities: total.liabilities, net: total.net };
  });
}

function snapshotPeriod(date, period) {
  const [yearText, monthText] = date.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (period === "month") return { key: `${yearText}-${monthText}`, label: `${month}月`, title: `${yearText}-${monthText}` };
  if (period === "quarter") {
    const quarter = Math.ceil(month / 3);
    return { key: `${yearText}-Q${quarter}`, label: `${String(year).slice(2)}Q${quarter}`, title: `${yearText} Q${quarter}` };
  }
  return { key: yearText, label: yearText, title: yearText };
}

function chartBounds(values) {
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const dataSpread = dataMax - dataMin;
  const bottomPadding = dataSpread > 0 ? dataSpread * 0.25 : Math.max(Math.abs(dataMin) * 0.1, 1);
  const topPadding = dataSpread > 0 ? dataSpread * 0.15 : Math.max(Math.abs(dataMax) * 0.1, 1);
  const roughStep = (dataSpread + bottomPadding + topPadding) / 4;
  const step = niceChartStep(roughStep);
  let min = Math.floor((dataMin - bottomPadding) / step) * step;
  let max = Math.ceil((dataMax + topPadding) / step) * step;
  if (dataMin - min < step * 0.75) min -= step;
  if (max - dataMax < step * 0.5) max += step;
  if (max <= min) max = min + step;
  const ticks = [];
  for (let value = max; value >= min - step * 0.1; value -= step) {
    ticks.push(Number(value.toFixed(8)));
  }
  return { min, max, step, ticks };
}

function shouldShowXAxisLabel(index, total, width, options = {}) {
  if (typeof options.xLabelFilter === "function") return options.xLabelFilter(index, total, width);
  if (width >= 520 || total <= 8) return true;
  if (index === 0 || index === total - 1) return true;
  const maxLabels = width < 430 ? 4 : 5;
  const interval = Math.max(1, Math.ceil((total - 1) / Math.max(maxLabels - 1, 1)));
  return index % interval === 0;
}

function niceChartStep(value) {
  const exponent = Math.floor(Math.log10(Math.max(value, Number.EPSILON)));
  const magnitude = 10 ** exponent;
  const normalized = value / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

function formatChartDate(date) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function compactMoney(value) {
  const amount = Math.abs(value);
  const compact =
    amount >= 100000000
      ? `${formatCompactNumber(value / 100000000)}亿`
      : amount >= 10000
        ? `${formatCompactNumber(value / 10000)}w`
        : Math.round(value).toString();
  return `${currencyConfig(state.settings.baseCurrency).symbol}${compact}`;
}

function formatCompactNumber(value) {
  return value.toFixed(1);
}

function renderNetWorthContribution() {
  renderContributionControls();
  const container = $("#netWorthContribution");
  const summaryNode = $("#contributionSummary");
  const points = periodSnapshotPoints(contributionPeriod, periodConfig(contributionPeriod).limit);
  const lookback = Math.max(2, Number(contributionLookback || 2));
  if (points.length < 2) {
    summaryNode.textContent = "至少需要两个周期点";
    container.innerHTML = `<div class="empty-state">暂无足够快照计算净值变动贡献。</div>`;
    return;
  }
  const previousIndex = Math.max(0, points.length - lookback);
  const previousPoint = points[previousIndex];
  const currentPoint = points[points.length - 1];
  const previousTotal = snapshotTotal(previousPoint.snapshot);
  const currentTotal = snapshotTotal(currentPoint.snapshot);
  const previousRows = new Map(previousTotal.accounts.map((row) => [row.account.id, row]));
  const netChange = currentTotal.net - previousTotal.net;
  const rows = currentTotal.accounts
    .filter((row) => row.account.includeInNetWorth !== false)
    .map((row) => {
      const previous = previousRows.get(row.account.id);
      const previousValue = previous?.account.includeInNetWorth === false ? 0 : Number(previous?.converted || 0);
      const currentValue = Number(row.converted || 0);
      const delta = currentValue - previousValue;
      return {
        ...row,
        previousValue,
        currentValue,
        delta,
        share: netChange ? Math.abs(delta) / Math.abs(netChange) : 0,
      };
    })
    .filter((row) => Math.abs(row.delta) >= 0.005)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const positiveRows = rows.filter((row) => row.delta > 0);
  const negativeRows = rows.filter((row) => row.delta < 0);
  const rangeText = previousIndex === points.length - 2 ? "上一点" : `近 ${points.length - previousIndex} 点`;
  summaryNode.innerHTML = `${previousPoint.title} → ${currentPoint.title} · ${rangeText}净值变动 <span class="${netChange >= 0 ? "positive" : "negative"}">${signedMoneyHtml(netChange)}</span>`;
  container.innerHTML = `
    <div class="contribution-total-card ${netChange >= 0 ? "positive" : "negative"}">
      <span>${escapeHtml(trendPeriodConfig(contributionPeriod).label)}净值变动</span>
      <b>${signedMoneyHtml(netChange)}</b>
      <small>${rangeText} · ${rows.length} 个账户有变化</small>
    </div>
    <div class="contribution-columns">
      <section class="contribution-column">
        <div class="gain-column-heading">
          <b>正向贡献</b>
          <span>账户余额增加或负债减少</span>
        </div>
        ${contributionRowsHtml(positiveRows, Math.abs(netChange), "暂无正向贡献账户")}
      </section>
      <section class="contribution-column">
        <div class="gain-column-heading">
          <b>负向拖累</b>
          <span>账户余额减少或负债增加</span>
        </div>
        ${contributionRowsHtml(negativeRows, Math.abs(netChange), "暂无负向拖累账户")}
      </section>
    </div>
  `;
}

function renderContributionControls() {
  $$("[data-contribution-period]").forEach((button) => {
    button.classList.toggle("active", button.dataset.contributionPeriod === contributionPeriod);
  });
  const select = $("#contributionLookbackSelect");
  if (select) select.value = String(contributionLookback);
}

function contributionRowsHtml(rows, denominator, emptyText) {
  if (!rows.length) return `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
  return rows.slice(0, 6).map((row) => {
    const share = denominator ? Math.abs(row.delta) / denominator : 0;
    return `
      <div class="contribution-row ${row.delta >= 0 ? "is-positive" : "is-negative"}">
        <div class="gain-row-heading">
          <b>${escapeHtml(row.account.name)}</b>
          <b>${signedMoneyHtml(row.delta)}</b>
        </div>
        <div class="gain-row-meta">
          <span>${escapeHtml(accountGroupName(row.account))} · ${escapeHtml(typeLabel(row.account.type))}${row.account.archived ? " · 已归档" : ""}</span>
          <span class="gain-track"><i style="width:${Math.max(share * 100, 2).toFixed(2)}%;"></i></span>
        </div>
      </div>
    `;
  }).join("");
}

function snapshotHeatmapYears() {
  return [...new Set(state.snapshots.map((snapshot) => snapshot.date.slice(0, 4)).filter(Boolean))]
    .sort((a, b) => b.localeCompare(a));
}

function snapshotHeatmapYearValue() {
  const years = snapshotHeatmapYears();
  if (!years.length) return "";
  if (!snapshotHeatmapYear || !years.includes(snapshotHeatmapYear)) {
    snapshotHeatmapYear = latestSnapshot()?.date.slice(0, 4) || years[0];
  }
  return snapshotHeatmapYear;
}

function snapshotHeatmapMonths(year) {
  return [...new Set(state.snapshots
    .filter((snapshot) => snapshot.date.startsWith(`${year}-`))
    .map((snapshot) => snapshot.date.slice(5, 7)))]
    .sort((a, b) => b.localeCompare(a));
}

function snapshotHeatmapMonthValue(year) {
  const months = snapshotHeatmapMonths(year);
  const latest = latestSnapshot();
  if (!months.length) return "";
  if (!snapshotHeatmapMonth || !months.includes(snapshotHeatmapMonth)) {
    snapshotHeatmapMonth = latest?.date.startsWith(`${year}-`) ? latest.date.slice(5, 7) : months[0];
  }
  return snapshotHeatmapMonth;
}

function dateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function monthKeyFromDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function heatmapDayMonthWindow(year, month, count = 3) {
  const end = new Date(Number(year), Number(month) - 1, 1);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(end.getFullYear(), end.getMonth() - (count - 1 - index), 1);
    return monthKeyFromDate(date);
  });
}

function heatmapRangeLabel(monthKeys) {
  if (!monthKeys.length) return "";
  return monthKeys[0] === monthKeys[monthKeys.length - 1] ? monthKeys[0] : `${monthKeys[0]} 至 ${monthKeys[monthKeys.length - 1]}`;
}

function heatmapLevel(value, maxValue) {
  if (!value || !maxValue) return 1;
  return Math.max(1, Math.min(5, Math.ceil((value / maxValue) * 5)));
}

function snapshotHeatmapMetricConfig(metric = snapshotHeatmapMetric) {
  return {
    count: { label: "快照数", legend: "快照记录数", valueLabel: "快照", format: (value) => `${value} 条`, absolute: false },
    net: { label: "净值变化", legend: "净值变化幅度", valueLabel: "净值变化", format: (value) => signedMoneyHtml(value), absolute: true },
    cost: { label: "成本变化", legend: "成本变化幅度", valueLabel: "成本变化", format: (value) => signedMoneyHtml(value), absolute: true },
    gain: { label: "收益变化", legend: "收益变化幅度", valueLabel: "收益变化", format: (value) => signedMoneyHtml(value), absolute: true },
  }[metric] || { label: "快照数", legend: "快照记录数", valueLabel: "快照", format: (value) => `${value} 条`, absolute: false };
}

function snapshotCountByDate() {
  const counts = {};
  state.snapshots.forEach((snapshot) => {
    counts[snapshot.date] = (counts[snapshot.date] || 0) + 1;
  });
  return counts;
}

function snapshotHeatmapDailyStats() {
  const sorted = [...state.snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const counts = snapshotCountByDate();
  let previous = null;
  return sorted.map((snapshot) => {
    const total = snapshotTotal(snapshot);
    const gain = gainAnalysisSummary(total, { filtered: false });
    const stat = {
      date: snapshot.date,
      month: snapshot.date.slice(0, 7),
      count: counts[snapshot.date] || 1,
      net: previous ? total.net - previous.net : 0,
      cost: previous ? gain.totalCost - previous.cost : 0,
      gain: previous ? gain.totalGain - previous.gain : 0,
      netTotal: total.net,
      costTotal: gain.totalCost,
      gainTotal: gain.totalGain,
    };
    previous = { net: total.net, cost: gain.totalCost, gain: gain.totalGain };
    return stat;
  });
}

function heatmapMetricRawValue(stat) {
  return Number(stat?.[snapshotHeatmapMetric] || 0);
}

function heatmapMetricDensityValue(stat) {
  const value = heatmapMetricRawValue(stat);
  return snapshotHeatmapMetricConfig().absolute ? Math.abs(value) : value;
}

function monthlyHeatmapStats() {
  const buckets = {};
  snapshotHeatmapDailyStats().forEach((stat) => {
    const bucket = buckets[stat.month] ||= { monthKey: stat.month, count: 0, days: 0, net: 0, cost: 0, gain: 0, dates: [] };
    bucket.count += stat.count;
    bucket.days += 1;
    bucket.net += stat.net;
    bucket.cost += stat.cost;
    bucket.gain += stat.gain;
    bucket.dates.push(stat);
  });
  return Object.values(buckets).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

function renderSnapshotHeatmap() {
  const container = $("#snapshotHeatmap");
  const summary = $("#snapshotHeatmapSummary");
  const yearSelect = $("#snapshotHeatmapYear");
  const monthSelect = $("#snapshotHeatmapMonth");
  const modeSelect = $("#snapshotHeatmapMode");
  const metricSelect = $("#snapshotHeatmapMetric");
  const rangeSelect = $("#snapshotHeatmapRange");
  const activeOnlyInput = $("#snapshotHeatmapActiveOnly");
  if (!container || !summary || !yearSelect || !monthSelect || !modeSelect) return;
  const years = snapshotHeatmapYears();
  if (!years.length) {
    summary.textContent = "暂无快照";
    yearSelect.innerHTML = "";
    monthSelect.innerHTML = "";
    modeSelect.disabled = true;
    yearSelect.disabled = true;
    monthSelect.disabled = true;
    if (metricSelect) metricSelect.disabled = true;
    if (rangeSelect) rangeSelect.disabled = true;
    if (activeOnlyInput) activeOnlyInput.disabled = true;
    container.innerHTML = `<div class="empty-state">录入快照后可查看日历热力图。</div>`;
    return;
  }
  modeSelect.disabled = false;
  modeSelect.value = snapshotHeatmapMode;
  if (metricSelect) {
    metricSelect.disabled = false;
    metricSelect.value = snapshotHeatmapMetric;
  }
  if (rangeSelect) {
    rangeSelect.disabled = snapshotHeatmapMode !== "month";
    rangeSelect.value = snapshotHeatmapRange;
  }
  if (activeOnlyInput) {
    activeOnlyInput.disabled = snapshotHeatmapMode !== "month";
    activeOnlyInput.checked = snapshotHeatmapActiveOnly;
  }
  const year = snapshotHeatmapYearValue();
  yearSelect.disabled = snapshotHeatmapMode === "month" && snapshotHeatmapRange !== "year" ? true : years.length <= 1;
  yearSelect.innerHTML = years.map((item) => `<option value="${item}" ${item === year ? "selected" : ""}>${item}</option>`).join("");
  const month = snapshotHeatmapMonthValue(year);
  const months = snapshotHeatmapMonths(year);
  monthSelect.disabled = snapshotHeatmapMode !== "day" || months.length <= 1;
  monthSelect.innerHTML = months.map((item) => `<option value="${item}" ${item === month ? "selected" : ""}>${Number(item)}月</option>`).join("");
  if (snapshotHeatmapMode === "month") {
    renderSnapshotHeatmapByMonth({ container, summary, year });
    return;
  }
  renderSnapshotHeatmapByDay({ container, summary, year, month });
}

function renderSnapshotHeatmapByDay({ container, summary, year, month }) {
  const stats = snapshotHeatmapDailyStats();
  const byDate = Object.fromEntries(stats.map((stat) => [stat.date, stat]));
  const visibleMonthKeys = heatmapDayMonthWindow(year, month, 3);
  const visibleMonthSet = new Set(visibleMonthKeys);
  const visibleEntries = stats.filter((stat) => visibleMonthSet.has(stat.date.slice(0, 7)));
  const dayMetric = snapshotHeatmapMetricConfig();
  const rangeLabel = heatmapRangeLabel(visibleMonthKeys);
  if (!visibleEntries.length) {
    summary.textContent = `${rangeLabel} · 暂无快照 · ${dayMetric.label}`;
    container.innerHTML = `<div class="empty-state">该时间段暂无快照。</div>`;
    return;
  }
  const maxVisibleValue = Math.max(...visibleEntries.map((stat) => heatmapMetricDensityValue(stat)), 1);
  const mediumMonthKeys = visibleMonthKeys.slice(1);
  const narrowMonthKeys = visibleMonthKeys.slice(2);
  const countVisibleEntries = (monthKeys) => visibleEntries.filter((stat) => monthKeys.includes(stat.date.slice(0, 7))).length;
  summary.innerHTML = `
    <span class="heatmap-day-summary-wide">${escapeHtml(rangeLabel)} · ${visibleEntries.length} 个日期有快照 · ${escapeHtml(dayMetric.label)}</span>
    <span class="heatmap-day-summary-medium">${escapeHtml(heatmapRangeLabel(mediumMonthKeys))} · ${countVisibleEntries(mediumMonthKeys)} 个日期有快照 · ${escapeHtml(dayMetric.label)}</span>
    <span class="heatmap-day-summary-narrow">${escapeHtml(heatmapRangeLabel(narrowMonthKeys))} · ${countVisibleEntries(narrowMonthKeys)} 个日期有快照 · ${escapeHtml(dayMetric.label)}</span>
  `;
  const monthsHtml = visibleMonthKeys.map((monthKey, index) => {
    const [monthYear, monthNumber] = monthKey.split("-");
    const dayCount = new Date(Number(monthYear), Number(monthNumber), 0).getDate();
    const firstDay = new Date(Number(monthYear), Number(monthNumber) - 1, 1).getDay();
    const cells = [
      ...Array.from({ length: firstDay }, () => `<span class="heatmap-cell is-empty"></span>`),
      ...Array.from({ length: dayCount }, (_, dayIndex) => {
        const day = dayIndex + 1;
        const date = dateKey(monthYear, Number(monthNumber), day);
        const stat = byDate[date];
        const value = heatmapMetricDensityValue(stat);
        const level = stat ? heatmapLevel(value || 1, maxVisibleValue) : 0;
        const title = stat
          ? `${date} · ${dayMetric.valueLabel} ${dayMetric.format(heatmapMetricRawValue(stat)).replace(/<[^>]+>/g, "")}`
          : `${date} · 无快照`;
        return `<span class="heatmap-cell ${stat ? `has-snapshot density level-${level}` : "level-0"}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">${day}</span>`;
      }),
    ].join("");
    const responsiveClass = index === 0 ? " is-wide-only" : index === 1 ? " is-medium-only" : "";
    return `
      <section class="heatmap-month heatmap-day-month${responsiveClass}">
        <h3>${Number(monthNumber)}月</h3>
        <div class="heatmap-weekdays" aria-hidden="true"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>
        <div class="heatmap-days">${cells}</div>
      </section>
    `;
  }).join("");
  container.innerHTML = `
    ${heatmapLegendHtml(dayMetric.legend)}
    <div class="heatmap-day-months">${monthsHtml}</div>
  `;
  return;
  const monthPrefix = `${year}-${month}`;
  const entries = stats.filter((stat) => stat.date.startsWith(monthPrefix));
  if (!entries.length) {
    summary.textContent = `${year}-${month} · 暂无快照`;
    container.innerHTML = `<div class="empty-state">该月份暂无快照。</div>`;
    return;
  }
  const metric = snapshotHeatmapMetricConfig();
  const maxCount = Math.max(...entries.map((stat) => heatmapMetricDensityValue(stat)), 1);
  const snapshotDays = entries.length;
  summary.textContent = `${year}-${month} · ${snapshotDays} 个日期有快照 · ${metric.label}`;
  const dayCount = new Date(Number(year), Number(month), 0).getDate();
  const firstDay = new Date(Number(year), Number(month) - 1, 1).getDay();
  const cells = [
    ...Array.from({ length: firstDay }, () => `<span class="heatmap-cell is-empty"></span>`),
    ...Array.from({ length: dayCount }, (_, dayIndex) => {
      const day = dayIndex + 1;
      const date = dateKey(year, Number(month), day);
      const stat = byDate[date];
      const value = heatmapMetricDensityValue(stat);
      const level = stat ? heatmapLevel(value || 1, maxCount) : 0;
      const title = stat ? `${date} · ${metric.valueLabel} ${metric.format(heatmapMetricRawValue(stat)).replace(/<[^>]+>/g, "")}` : `${date} · 无快照`;
      return `<span class="heatmap-cell ${stat ? `has-snapshot density level-${level}` : "level-0"}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">${day}</span>`;
    }),
  ].join("");
  container.innerHTML = `
    ${heatmapLegendHtml(metric.legend)}
    <section class="heatmap-month heatmap-month-single">
      <h3>${Number(month)}月</h3>
      <div class="heatmap-weekdays" aria-hidden="true"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>
      <div class="heatmap-days">${cells}</div>
    </section>
    ${heatmapDetailPanelHtml(entries.slice().sort((a, b) => heatmapMetricDensityValue(b) - heatmapMetricDensityValue(a)), `${year}-${month} 明细`)}
  `;
}

function renderSnapshotHeatmapByMonth({ container, summary, year }) {
  const metric = snapshotHeatmapMetricConfig();
  const allMonths = monthlyHeatmapStats();
  let counts = [];
  if (snapshotHeatmapRange === "year") {
    const byMonth = Object.fromEntries(allMonths.filter((item) => item.monthKey.startsWith(`${year}-`)).map((item) => [item.monthKey.slice(5), item]));
    counts = Array.from({ length: 12 }, (_, index) => {
      const month = String(index + 1).padStart(2, "0");
      return byMonth[month] || { monthKey: `${year}-${month}`, count: 0, days: 0, net: 0, cost: 0, gain: 0, dates: [] };
    });
  } else {
    counts = allMonths.slice(-Number(snapshotHeatmapRange || 12));
  }
  if (snapshotHeatmapActiveOnly) counts = counts.filter((item) => item.days > 0);
  const maxCount = Math.max(...counts.map((item) => heatmapMetricDensityValue(item)), 1);
  const activeMonths = counts.filter((item) => item.days > 0);
  summary.textContent = `${snapshotHeatmapRange === "year" ? year : `近 ${snapshotHeatmapRange} 月`} · ${activeMonths.length} 个月有快照 · ${metric.label}`;
  container.innerHTML = `
    ${heatmapLegendHtml(metric.legend)}
    <div class="heatmap-month-summary-grid">
      ${counts.map((item) => {
        const value = heatmapMetricDensityValue(item);
        const level = item.days ? heatmapLevel(value || 1, maxCount) : 0;
        const title = item.days ? `${item.monthKey} · ${item.days} 个日期有快照` : `${item.monthKey} · 无快照`;
        return `
          <article class="heatmap-month-summary ${item.days ? `has-snapshot density level-${level}` : "level-0"}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}" role="button" tabindex="${item.days ? "0" : "-1"}" data-heatmap-month="${escapeHtml(item.monthKey)}">
            <b>${snapshotHeatmapRange === "year" ? `${Number(item.monthKey.slice(5))}月` : item.monthKey}</b>
            <span>${item.days ? `${item.days} 天 · ${metric.format(heatmapMetricRawValue(item))}` : "无"}</span>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function heatmapDetailPanelHtml(items, title) {
  const metric = snapshotHeatmapMetricConfig();
  const rows = items.slice(0, 6);
  if (!rows.length) return `<div class="heatmap-detail-panel"><h3>${escapeHtml(title)}</h3><div class="empty-state">暂无可展示明细。</div></div>`;
  return `
    <div class="heatmap-detail-panel">
      <h3>${escapeHtml(title)}</h3>
      ${rows.map((item) => `
        <div class="heatmap-detail-row">
          <span>${escapeHtml(item.date || item.monthKey)} · ${item.count || item.days || 0} ${item.date ? "条" : "天"}</span>
          <b>${metric.format(heatmapMetricRawValue(item))}</b>
        </div>
      `).join("")}
    </div>
  `;
}

function heatmapLegendHtml(label) {
  return `
    <div class="heatmap-legend" aria-hidden="true">
      <span>${escapeHtml(label)}</span>
      ${[1, 2, 3, 4, 5].map((level) => `<i class="heatmap-cell density level-${level}"></i>`).join("")}
    </div>
  `;
}

function analysisTrendMetricConfig(metric = analysisTrendMetric) {
  return {
    balance: { label: "余额", totalKey: "totalBalance", groupKey: "groupBalances", typeKey: "typeBalances", accountKey: "accountBalances", color: "#2563eb", empty: "暂无余额趋势数据", valueType: "money" },
    cost: { label: "成本", totalKey: "totalCost", groupKey: "groupCosts", typeKey: "typeCosts", accountKey: "accountCosts", color: "#b45309", empty: "暂无成本趋势数据", valueType: "money" },
    gain: { label: "收益", totalKey: "totalGain", groupKey: "groupGains", typeKey: "typeGains", accountKey: "accountGains", color: "#059669", empty: "暂无收益趋势数据", valueType: "signedMoney" },
    gainRate: { label: "收益率", totalKey: "totalGainRate", groupKey: "groupGainRates", typeKey: "typeGainRates", accountKey: "accountGainRates", color: "#7c3aed", empty: "暂无收益率趋势数据", valueType: "percent" },
  }[metric] || { label: "余额", totalKey: "totalBalance", groupKey: "groupBalances", typeKey: "typeBalances", accountKey: "accountBalances", color: "#2563eb", empty: "暂无余额趋势数据" };
}

function analysisTrendValueHtml(value, metric = analysisTrendMetric) {
  const config = analysisTrendMetricConfig(metric);
  if (config.valueType === "percent") return `${(Number(value || 0) * 100).toFixed(1)}%`;
  return config.valueType === "signedMoney" ? signedMoneyHtml(value) : moneySpan(formatMoney(value));
}

function analysisTrendChangeHtml(value, metric = analysisTrendMetric) {
  const config = analysisTrendMetricConfig(metric);
  if (config.valueType === "percent") {
    const number = Number(value || 0) * 100;
    return `<span class="${number >= 0 ? "positive" : "negative"}">${number >= 0 ? "+" : ""}${number.toFixed(1)}pct</span>`;
  }
  return `<b class="${Number(value || 0) >= 0 ? "positive" : "negative"}">${signedMoneyHtml(value)}</b>`;
}

function analysisTrendPlainValue(value, metric = analysisTrendMetric) {
  const config = analysisTrendMetricConfig(metric);
  if (config.valueType === "percent") return `${(Number(value || 0) * 100).toFixed(1)}%`;
  return state.settings.privacy ? privateMoneyPlaceholder() : formatMoney(value);
}

function analysisTrendData() {
  return periodSnapshotPoints(analysisTrendPeriod, periodConfig(analysisTrendPeriod).limit)
    .map((point) => {
      const total = snapshotTotal(point.snapshot);
      const summary = gainAnalysisSummary(total, { filtered: false });
      const groupBalances = {};
      const groupCosts = {};
      const groupGains = {};
      const groupGainRates = {};
      const typeBalances = {};
      const typeCosts = {};
      const typeGains = {};
      const typeGainRates = {};
      const accountBalances = {};
      const accountCosts = {};
      const accountGains = {};
      const accountGainRates = {};
      summary.rows.forEach((row) => {
        const group = accountGroupName(row.account);
        const type = typeGroupLabelForType(row.account.type);
        groupBalances[group] = (groupBalances[group] || 0) + (row.converted || 0);
        groupCosts[group] = (groupCosts[group] || 0) + (row.costConverted || 0);
        groupGains[group] = (groupGains[group] || 0) + (row.gainConverted || 0);
        typeBalances[type] = (typeBalances[type] || 0) + (row.converted || 0);
        typeCosts[type] = (typeCosts[type] || 0) + (row.costConverted || 0);
        typeGains[type] = (typeGains[type] || 0) + (row.gainConverted || 0);
        accountBalances[row.account.id] = row.converted || 0;
        accountCosts[row.account.id] = row.costConverted || 0;
        accountGains[row.account.id] = row.gainConverted || 0;
        accountGainRates[row.account.id] = row.costConverted ? (row.gainConverted || 0) / Math.abs(row.costConverted) : 0;
      });
      Object.keys(groupGains).forEach((group) => {
        groupGainRates[group] = groupCosts[group] ? groupGains[group] / Math.abs(groupCosts[group]) : 0;
      });
      Object.keys(typeGains).forEach((type) => {
        typeGainRates[type] = typeCosts[type] ? typeGains[type] / Math.abs(typeCosts[type]) : 0;
      });
      return {
        ...point,
        totalBalance: summary.rows.reduce((sum, row) => sum + (row.converted || 0), 0),
        totalCost: summary.totalCost,
        totalGain: summary.totalGain,
        totalGainRate: summary.totalCost ? summary.totalGain / Math.abs(summary.totalCost) : 0,
        groupBalances,
        groupCosts,
        groupGains,
        groupGainRates,
        typeBalances,
        typeCosts,
        typeGains,
        typeGainRates,
        accountBalances,
        accountCosts,
        accountGains,
        accountGainRates,
        rowCount: summary.rows.length,
      };
    })
    .filter((point) => point.rowCount > 0);
}

function renderAnalysisTrend() {
  renderAnalysisTrendControls();
  const svg = $("#analysisTrendChart");
  const summary = $("#analysisTrendSummary");
  const legend = $("#analysisTrendLegend");
  const metric = analysisTrendMetricConfig();
  const points = analysisTrendData();
  renderAnalysisTrendAccountPicker(points);
  if (!points.length) {
    summary.textContent = "暂无带成本的历史快照";
    legend.innerHTML = "";
    svg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#667085">${escapeHtml(metric.empty)}</text>`;
    return;
  }
  const last = points[points.length - 1];
  const previous = points[points.length - 2];
  const totalValue = last[metric.totalKey] || 0;
  const change = previous ? totalValue - (previous[metric.totalKey] || 0) : 0;
  const modeText = analysisTrendMode === "account"
    ? `按账户${metric.label}`
    : analysisTrendMode === "type"
      ? `按分类${metric.label}`
      : analysisTrendMode === "group"
        ? `按分组${metric.label}`
        : `汇总${metric.label}`;
  summary.innerHTML = `
    <span>${escapeHtml(modeText)} · 最新${escapeHtml(metric.label)} ${analysisTrendValueHtml(totalValue)}${analysisTrendMetric === "gain" ? ` · ${percentText(last.totalGainRate)}` : ""}</span>
    ${previous ? `<span>较上一点 ${analysisTrendChangeHtml(change)}</span>` : ""}
  `;
  const chart = analysisTrendChartModel(points, analysisTrendMode, metric);
  legend.innerHTML = chart.series.map((item) => `<span><i style="background:${item.color};"></i>${escapeHtml(item.label)}</span>`).join("");
  renderAnalysisTrendChart(svg, chart, metric);
}

function renderAnalysisTrendControls() {
  const metricSelect = $("#analysisTrendMetricSelect");
  if (metricSelect) metricSelect.value = analysisTrendMetric;
  const modeSelect = $("#analysisTrendModeSelect");
  if (modeSelect) modeSelect.value = analysisTrendMode;
  $$("[data-analysis-trend-period]").forEach((button) => {
    button.classList.toggle("active", button.dataset.analysisTrendPeriod === analysisTrendPeriod);
  });
  const picker = $("#analysisTrendAccountPicker");
  const selectableMode = analysisTrendSelectableMode();
  if (picker) picker.hidden = !selectableMode;
  const toggle = $("#toggleAnalysisTrendAccountPicker");
  if (toggle) toggle.setAttribute("aria-expanded", String(!$("#analysisTrendAccountPopover")?.hidden));
}

function analysisTrendSelectableMode() {
  return analysisTrendMode === "account" || analysisTrendMode === "type" ? analysisTrendMode : "";
}

function selectedAnalysisTrendOptionIds() {
  return analysisTrendMode === "type" ? selectedAnalysisTrendTypeNames : selectedAnalysisTrendAccountIds;
}

function renderAnalysisTrendAccountPicker(points = analysisTrendData()) {
  const picker = $("#analysisTrendAccountPicker");
  const popover = $("#analysisTrendAccountPopover");
  const toggle = $("#toggleAnalysisTrendAccountPicker");
  if (!picker || !popover || !toggle) return;
  const selectableMode = analysisTrendSelectableMode();
  const options = analysisTrendSelectableOptions(points);
  const selectedIds = selectedAnalysisTrendOptionIds();
  const validIds = new Set(options.map((item) => item.id));
  [...selectedIds].forEach((id) => {
    if (!validIds.has(id)) selectedIds.delete(id);
  });
  if (selectedIds.size === 0) {
    options.forEach((option) => selectedIds.add(option.id));
  }
  const label = selectableMode === "type" ? "分类" : "账户";
  toggle.textContent = selectedIds.size ? `选择${label} (${selectedIds.size}/${options.length})` : `选择${label}`;
  picker.hidden = !selectableMode;
  if (!selectableMode) popover.hidden = true;
  popover.innerHTML = options.length
    ? `<div class="trend-account-popover-heading">
        <span>已选 ${selectedIds.size} / ${options.length} 个${label}</span>
        <button class="secondary-button small" data-analysis-trend-select-all type="button">全选</button>
        <button class="secondary-button small" data-analysis-trend-select-top type="button">前 4 个</button>
      </div>${analysisTrendOptionsGroupsHtml(options)}`
    : `<div class="empty-state">暂无可查看趋势的${label}</div>`;
}

function analysisTrendSelectableOptions(points) {
  return analysisTrendMode === "type" ? analysisTrendTypeOptions(points) : analysisTrendAccountOptions(points);
}

function analysisTrendAccountOptions(points) {
  const metric = analysisTrendMetricConfig();
  const latestValues = points[points.length - 1]?.[metric.accountKey] || {};
  return state.accounts
    .filter((account) => points.some((point) => Object.prototype.hasOwnProperty.call(point[metric.accountKey] || {}, account.id)))
    .map((account) => ({
      ...account,
      latestValue: latestValues[account.id] || 0,
      groupName: accountGroupName(account),
    }))
    .sort((a, b) => Math.abs(b.latestValue) - Math.abs(a.latestValue));
}

function analysisTrendTypeOptions(points) {
  const metric = analysisTrendMetricConfig();
  const latestValues = points[points.length - 1]?.[metric.typeKey] || {};
  const typeNames = new Set(points.flatMap((point) => Object.keys(point[metric.typeKey] || {})));
  return [...typeNames]
    .map((typeName) => ({
      id: typeName,
      name: typeName,
      latestValue: latestValues[typeName] || 0,
      groupName: "账户分类",
      subLabel: "账户类型大类",
    }))
    .sort((a, b) => Math.abs(b.latestValue) - Math.abs(a.latestValue));
}

function analysisTrendOptionsGroupsHtml(options) {
  const groups = {};
  options.forEach((option) => {
    (groups[option.groupName] ||= []).push(option);
  });
  return Object.entries(groups).map(([group, groupOptions]) => `
    <section class="trend-account-group">
      <div class="trend-account-group-title">${escapeHtml(group)}</div>
      ${groupOptions.map((option) => `
        <label class="trend-account-option">
          <input data-analysis-trend-option="${escapeHtml(option.id)}" type="checkbox" ${selectedAnalysisTrendOptionIds().has(option.id) ? "checked" : ""} />
          <b>${escapeHtml(option.name)}</b>
          <small>${escapeHtml(option.subLabel || `${typeLabel(option.type)} · ${option.currency}`)}</small>
          <strong>${analysisTrendValueHtml(option.latestValue)}</strong>
        </label>
      `).join("")}
    </section>
  `).join("");
}

function renderInteractiveLineChart(svg, points, series, options = {}) {
  const chartId = options.chartId || "lineChart";
  const activeSeries = series.filter((item) => points.some((point) => Number.isFinite(Number(point[item.key]))));
  if (!points.length || !activeSeries.length) {
    svg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#667085">${escapeHtml(options.emptyText || "暂无趋势数据")}</text>`;
    return;
  }
  const width = Math.max(
    options.minWidth || LINE_CHART_DEFAULTS.minWidth,
    Math.min(options.maxWidth || LINE_CHART_DEFAULTS.maxWidth, Math.round(svg.getBoundingClientRect().width || LINE_CHART_DEFAULTS.maxWidth))
  );
  const renderedHeight = Math.round(svg.getBoundingClientRect().height || 0);
  const height = options.height || (renderedHeight > 0 ? renderedHeight : LINE_CHART_DEFAULTS.height);
  const pad = width < 520 && options.compactPad ? options.compactPad : (options.pad || LINE_CHART_DEFAULTS.pad);
  const axisFontSize = width < 520 ? 11 : 12;
  const xAxisFontSize = axisFontSize;
  const tooltip = lineChartTooltipMetrics(width, activeSeries.length);
  const values = points.flatMap((point) => activeSeries.map((item) => Number(point[item.key]) || 0));
  const { min, max, ticks } = chartBounds(values);
  const spread = Math.max(max - min, 1);
  const pointInset = options.pointInset ?? LINE_CHART_DEFAULTS.pointInset;
  const plotWidth = width - pad.left - pad.right - pointInset * 2;
  const plotHeight = height - pad.top - pad.bottom;
  const xStep = points.length > 1 ? plotWidth / (points.length - 1) : 0;
  const coords = points.map((point, index) => {
    const x = points.length > 1 ? pad.left + pointInset + index * xStep : pad.left + pointInset + plotWidth / 2;
    const seriesCoords = Object.fromEntries(activeSeries.map((item) => {
      const value = Number(point[item.key]) || 0;
      return [item.key, { x, y: height - pad.bottom - ((value - min) / spread) * plotHeight }];
    }));
    return { ...point, x, seriesCoords };
  });
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  const yTicks = ticks.map((value) => {
    const y = pad.top + ((max - value) / spread) * plotHeight;
    const label = options.axisFormatter ? options.axisFormatter(value) : (state.settings.privacy ? privateMoneyPlaceholder() : compactMoney(value));
    return `<line class="chart-grid-line" x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" /><text x="${pad.left - 14}" y="${y + 5}" text-anchor="end" class="chart-axis-label" style="font-size:${axisFontSize}px;">${escapeHtml(label)}</text>`;
  }).join("");
  const formatValue = options.valueFormatter || ((value) => state.settings.privacy ? privateMoneyPlaceholder() : formatMoney(value));
  svg.innerHTML = `
    ${yTicks}
    <line class="chart-axis-line" x1="${pad.left}" y1="${height - pad.bottom}" x2="${width - pad.right}" y2="${height - pad.bottom}" />
    <line class="chart-axis-line chart-axis-line-y" x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${height - pad.bottom}" />
    ${activeSeries.map((item) => {
      const line = coords.map((point) => `${point.seriesCoords[item.key].x},${point.seriesCoords[item.key].y}`).join(" ");
      return `<polyline points="${line}" fill="none" stroke="${item.color}" stroke-width="${options.strokeWidth || LINE_CHART_DEFAULTS.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`;
    }).join("")}
    ${coords.map((point, index) => `
      <line class="chart-x-tick" x1="${point.x}" y1="${height - pad.bottom}" x2="${point.x}" y2="${height - pad.bottom + 6}" />
      ${shouldShowXAxisLabel(index, coords.length, width, options) ? `<text x="${point.x}" y="${height - 16}" text-anchor="middle" class="chart-axis-label chart-x-label" style="font-size:${xAxisFontSize}px;">${escapeHtml(point.label)}</text>` : ""}
      ${activeSeries.map((item) => `<circle class="trend-point" cx="${point.seriesCoords[item.key].x}" cy="${point.seriesCoords[item.key].y}" r="${options.pointRadius || LINE_CHART_DEFAULTS.pointRadius}" fill="var(--chart-point-bg)" stroke="${item.color}" stroke-width="${options.pointStrokeWidth || LINE_CHART_DEFAULTS.pointStrokeWidth}"><title>${escapeHtml(point.title)} · ${escapeHtml(item.label)}: ${escapeHtml(formatValue(point[item.key]))}</title></circle>`).join("")}
    `).join("")}
    <g id="${chartId}Guide" class="trend-guide" visibility="hidden">
      <line class="trend-guide-x" stroke-dasharray="6 5"></line>
      <line class="trend-guide-y" stroke-dasharray="6 5"></line>
    </g>
    <g id="${chartId}Tooltip" class="trend-tooltip" visibility="hidden" data-tooltip-width="${tooltip.width}" data-tooltip-height="${tooltip.height}">
      <rect rx="6" width="${tooltip.width}" height="${tooltip.height}"></rect>
      <text x="${tooltip.x}" y="${tooltip.titleY}" style="font-size:${tooltip.titleFontSize}px;"></text>
      ${activeSeries.map((item, index) => `<text class="money" data-tooltip-series="${item.key}" x="${tooltip.x}" y="${tooltip.firstRowY + index * tooltip.rowHeight}" style="font-size:${tooltip.fontSize}px;"></text>`).join("")}
    </g>
    <rect id="${chartId}HitArea" class="trend-hit-area" x="${pad.left}" y="${pad.top}" width="${width - pad.left - pad.right}" height="${height - pad.top - pad.bottom}" fill="transparent" />
  `;
  const hitArea = svg.querySelector(`#${chartId}HitArea`);
  const showNearest = (event) => showNearestLineChartPoint(event, svg, coords, activeSeries, width, height, pad, chartId, formatValue);
  hitArea.addEventListener("pointermove", showNearest);
  hitArea.addEventListener("pointerdown", showNearest);
  svg.addEventListener("pointerleave", () => hideLineChartTooltip(svg, chartId));
}

function showNearestLineChartPoint(event, svg, coords, activeSeries, width, height, pad, chartId, valueFormatter) {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
  const nearest = coords.reduce((closest, current) =>
    Math.abs(current.x - svgPoint.x) < Math.abs(closest.x - svgPoint.x) ? current : closest
  );
  showLineChartTooltip(svg, nearest, activeSeries, width, height, pad, chartId, valueFormatter);
}

function lineChartTooltipMetrics(width, rowCount) {
  const fontSize = width < 520 ? 11 : width < 720 ? 12 : 13;
  const titleFontSize = width < 520 ? 12 : width < 720 ? 13 : 14;
  const rowHeight = width < 520 ? 15 : 17;
  const titleY = width < 520 ? 18 : 20;
  const firstRowY = titleY + rowHeight + 3;
  const boxWidth = Math.min(width < 520 ? 176 : width < 720 ? 198 : 218, Math.max(156, width - 40));
  const boxHeight = firstRowY + Math.max(rowCount, 1) * rowHeight + 8;
  return {
    width: boxWidth,
    height: boxHeight,
    fontSize,
    titleFontSize,
    rowHeight,
    titleY,
    firstRowY,
    x: width < 520 ? 9 : 11,
  };
}

function showLineChartTooltip(svg, point, activeSeries, width, height, pad, chartId, valueFormatter) {
  const tooltip = svg.querySelector(`#${chartId}Tooltip`);
  const guide = svg.querySelector(`#${chartId}Guide`);
  if (!tooltip || !guide || !point) return;
  const firstSeries = activeSeries[0];
  const anchor = firstSeries ? point.seriesCoords[firstSeries.key] : { x: point.x, y: pad.top };
  const tooltipWidth = Number(tooltip.dataset.tooltipWidth) || 200;
  const tooltipHeight = Number(tooltip.dataset.tooltipHeight) || 60;
  const minX = Math.min(pad.left + 4, width - tooltipWidth - 4);
  const maxX = Math.max(minX, width - pad.right - tooltipWidth - 4);
  const x = Math.min(Math.max(point.x - tooltipWidth / 2, minX), maxX);
  const y = Math.max(anchor.y - tooltipHeight - 12, 4);
  tooltip.setAttribute("transform", `translate(${x} ${y})`);
  tooltip.setAttribute("visibility", "visible");
  guide.setAttribute("visibility", "visible");
  const horizontal = guide.querySelector(".trend-guide-x");
  horizontal.setAttribute("x1", pad.left);
  horizontal.setAttribute("x2", anchor.x);
  horizontal.setAttribute("y1", anchor.y);
  horizontal.setAttribute("y2", anchor.y);
  const vertical = guide.querySelector(".trend-guide-y");
  vertical.setAttribute("x1", point.x);
  vertical.setAttribute("x2", point.x);
  vertical.setAttribute("y1", pad.top);
  vertical.setAttribute("y2", height - pad.bottom);
  const texts = tooltip.querySelectorAll("text");
  texts[0].textContent = point.title;
  activeSeries.forEach((item) => {
    const text = tooltip.querySelector(`[data-tooltip-series="${item.key}"]`);
    if (text) text.textContent = `${item.label}: ${(valueFormatter || ((value) => state.settings.privacy ? privateMoneyPlaceholder() : formatMoney(value)))(point[item.key])}`;
  });
}

function hideLineChartTooltip(svg, chartId) {
  svg.querySelector(`#${chartId}Tooltip`)?.setAttribute("visibility", "hidden");
  svg.querySelector(`#${chartId}Guide`)?.setAttribute("visibility", "hidden");
}

function analysisTrendChartModel(points, mode, metric = analysisTrendMetricConfig()) {
  const palette = [...chartPalette(), "#c026d3", "#0f766e", "#ea580c", "#4f46e5", "#16a34a", "#be123c"];
  let chartPoints = points.map((point) => ({ ...point }));
  let series = [{ key: metric.totalKey, label: `总${metric.label}`, color: metric.color }];
  if (mode === "group") {
    const latest = points[points.length - 1];
    const groups = Object.entries(latest[metric.groupKey] || {})
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 6)
      .map(([group]) => group);
    series = groups.map((group, index) => ({
      key: `group_${index}`,
      label: group,
      color: palette[index % palette.length],
    }));
    chartPoints = points.map((point) => ({
      ...point,
      ...Object.fromEntries(groups.map((group, index) => [`group_${index}`, point[metric.groupKey]?.[group] || 0])),
    }));
  }
  if (mode === "type") {
    const types = analysisTrendTypeOptions(points).filter((type) => selectedAnalysisTrendTypeNames.has(type.id));
    series = types.map((type, index) => ({
      key: `type_${index}`,
      label: type.name,
      color: palette[index % palette.length],
    }));
    chartPoints = points.map((point) => ({
      ...point,
      ...Object.fromEntries(types.map((type, index) => [`type_${index}`, point[metric.typeKey]?.[type.id] || 0])),
    }));
  }
  if (mode === "account") {
    const accounts = analysisTrendAccountOptions(points).filter((account) => selectedAnalysisTrendAccountIds.has(account.id));
    series = accounts.map((account, index) => ({
      key: `account_${index}`,
      label: account.name,
      color: palette[index % palette.length],
    }));
    chartPoints = points.map((point) => ({
      ...point,
      ...Object.fromEntries(accounts.map((account, index) => [`account_${index}`, point[metric.accountKey]?.[account.id] || 0])),
    }));
  }
  return { points: chartPoints, series };
}

function renderAnalysisTrendChart(svg, chart, metric = analysisTrendMetricConfig()) {
  renderInteractiveLineChart(svg, chart.points, chart.series, {
    chartId: "analysisTrend",
    pad: { top: 28, right: 28, bottom: 50, left: 100 },
    compactPad: { top: 24, right: 22, bottom: 44, left: 72 },
    emptyText: metric.empty,
    axisFormatter: (value) => metric.valueType === "percent" ? `${(Number(value || 0) * 100).toFixed(0)}%` : (state.settings.privacy ? privateMoneyPlaceholder() : compactMoney(value)),
    valueFormatter: (value) => analysisTrendPlainValue(value, analysisTrendMetric),
  });
}

function analysisHealthTrendSeries() {
  return [
    { key: "liabilityRatio", label: "负债率", color: themeColor("--chart-liability", "#dc2626") },
    { key: "cashRatio", label: "流动占比", color: themeColor("--chart-net", "#2563eb") },
    { key: "investmentRatio", label: "投资占比", color: themeColor("--chart-asset", "#059669") },
  ];
}

function analysisHealthTrendData() {
  return periodSnapshotPoints(analysisHealthTrendPeriod, periodConfig(analysisHealthTrendPeriod).limit)
    .map((point) => {
      const metrics = healthMetricValues(snapshotTotal(point.snapshot));
      return {
        ...point,
        liabilityRatio: metrics.liabilityRatio,
        cashRatio: metrics.cashRatio,
        investmentRatio: metrics.investmentRatio,
        assets: metrics.assets,
      };
    })
    .filter((point) => point.assets > 0);
}

function renderAnalysisHealthTrend() {
  renderAnalysisHealthTrendControls();
  const svg = $("#analysisHealthTrendChart");
  const summary = $("#analysisHealthTrendSummary");
  const legend = $("#analysisHealthTrendLegend");
  if (!svg || !summary || !legend) return;
  const points = analysisHealthTrendData();
  const series = analysisHealthTrendSeries();
  if (!points.length) {
    summary.textContent = "暂无可计算资产健康趋势的历史快照";
    legend.innerHTML = "";
    svg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="var(--chart-label)">暂无资产健康趋势数据</text>`;
    return;
  }
  const last = points[points.length - 1];
  const previous = points[points.length - 2];
  const latestText = series.map((item) => `${item.label} ${percentText(last[item.key] || 0)}`).join(" · ");
  const changeText = previous
    ? `较上一点 负债率 ${healthTrendChangeText((last.liabilityRatio || 0) - (previous.liabilityRatio || 0))} · 流动 ${healthTrendChangeText((last.cashRatio || 0) - (previous.cashRatio || 0))} · 投资 ${healthTrendChangeText((last.investmentRatio || 0) - (previous.investmentRatio || 0))}`
    : "";
  summary.innerHTML = `
    <span>${escapeHtml(latestText)}</span>
    ${changeText ? `<span>${changeText}</span>` : ""}
  `;
  legend.innerHTML = series.map((item) => `<span><i style="background:${item.color};"></i>${escapeHtml(item.label)}</span>`).join("");
  renderInteractiveLineChart(svg, points, series, {
    chartId: "analysisHealthTrend",
    pad: { top: 24, right: 28, bottom: 44, left: 72 },
    compactPad: { top: 22, right: 22, bottom: 42, left: 60 },
    emptyText: "暂无资产健康趋势数据",
    axisFormatter: (value) => `${(Number(value || 0) * 100).toFixed(0)}%`,
    valueFormatter: (value) => `${(Number(value || 0) * 100).toFixed(1)}%`,
  });
}

function renderAnalysisHealthTrendControls() {
  $$("[data-analysis-health-trend-period]").forEach((button) => {
    button.classList.toggle("active", button.dataset.analysisHealthTrendPeriod === analysisHealthTrendPeriod);
  });
}

function healthTrendChangeText(value) {
  const number = Number(value || 0) * 100;
  return `<b class="${number >= 0 ? "positive" : "negative"}">${number >= 0 ? "+" : ""}${number.toFixed(1)}pct</b>`;
}

function renderGroups(total) {
  const entries = Object.entries(total.groups).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  if (entries.length === 0) {
    $("#groupBreakdown").innerHTML = emptyHtml();
    return;
  }
  const denominator = Math.max(
    entries.reduce((sum, [, value]) => sum + Math.abs(value), 0),
    1
  );
  $("#groupBreakdown").innerHTML = entries
    .map(([group, value], index) => {
      const percent = Math.abs(value) / denominator;
      const colors = chartPalette();
      return `
        <div class="bar-line">
          <div class="bar-info">
            <span>${escapeHtml(group)}</span>
            <span>${moneySpan(formatMoney(value))} · ${(percent * 100).toFixed(1)}%</span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${percent * 100}%; background:${colors[index % colors.length]}"></div></div>
        </div>
      `;
    })
    .join("");
}

function renderTypeBreakdown(total) {
  const totals = {};
  total.accounts
    .filter((row) => row.account.includeInNetWorth !== false && row.converted !== 0)
    .forEach((row) => {
      const groupName = typeGroupFor(row.account.type)?.name || "未分类类型";
      totals[groupName] = (totals[groupName] || 0) + Math.abs(row.converted);
    });
  const entries = Object.entries(totals).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  if (!entries.length) {
    $("#typeBreakdown").innerHTML = emptyHtml();
    return;
  }
  const denominator = Math.max(entries.reduce((sum, [, value]) => sum + Math.abs(value), 0), 1);
  const colors = chartPalette().slice().reverse();
  $("#typeBreakdown").innerHTML = entries
    .map(([name, value], index) => {
      const percent = Math.abs(value) / denominator;
      return `
        <div class="bar-line">
          <div class="bar-info">
            <span>${escapeHtml(name)}</span>
            <span>${moneySpan(formatMoney(value))} · ${(percent * 100).toFixed(1)}%</span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${percent * 100}%; background:${colors[index % colors.length]}"></div></div>
        </div>
      `;
    })
    .join("");
}

function renderCurrencyExposure(total = snapshotTotal(latestSnapshot())) {
  const container = $("#currencyExposure");
  const summary = $("#currencyExposureSummary");
  if (!container || !summary) return;
  const rows = total.accounts
    .filter((row) => row.account.includeInNetWorth !== false && Number(row.converted || 0) !== 0)
    .reduce((result, row) => {
      const code = row.account.currency || state.settings.baseCurrency;
      const bucket = result[code] ||= { code, raw: 0, converted: 0, accounts: 0 };
      bucket.raw += Number(row.raw || 0);
      bucket.converted += Number(row.converted || 0);
      bucket.accounts += 1;
      return result;
    }, {});
  const entries = Object.values(rows).sort((a, b) => Math.abs(b.converted) - Math.abs(a.converted));
  if (!entries.length) {
    summary.textContent = "暂无可统计的币种暴露";
    container.innerHTML = emptyHtml();
    return;
  }
  const denominator = Math.max(entries.reduce((sum, item) => sum + Math.abs(item.converted), 0), 1);
  summary.textContent = `${entries.length} 个币种 · 按${state.settings.baseCurrency}折算`;
  const colors = chartPalette();
  container.innerHTML = entries.map((item, index) => {
    const percent = Math.abs(item.converted) / denominator;
    const config = currencyConfig(item.code);
    return `
      <article class="currency-exposure-card">
        <div class="currency-exposure-row">
          <span>${escapeHtml(item.code)} · ${escapeHtml(config.name || item.code)} · ${item.accounts} 个账户</span>
          <b>${moneySpan(formatMoney(item.converted))} · ${(percent * 100).toFixed(1)}%</b>
        </div>
        <div class="currency-exposure-track" aria-hidden="true"><i style="width:${Math.max(percent * 100, 2).toFixed(2)}%; background:${colors[index % colors.length]};"></i></div>
      </article>
    `;
  }).join("");
}

function renderAccountTable(total) {
  $("#toggleOverviewAccountSort").textContent = overviewAccountSortMode ? "完成" : "排序";
  $("#toggleOverviewAccountSort").classList.toggle("primary-button", overviewAccountSortMode);
  $("#toggleOverviewAccountSort").classList.toggle("secondary-button", !overviewAccountSortMode);
  const rows = total.accounts.filter(
    (row) => !row.account.archived && (row.account.includeInNetWorth !== false || row.raw !== 0)
  );
  if (rows.length === 0) {
    $("#accountTable").innerHTML = emptyHtml();
    return;
  }
  const grouped = rows.reduce((result, row) => {
    const group = row.account.group || "未分组";
    (result[group] ||= []).push(row);
    return result;
  }, {});
  const orderedGroups = orderedGroupNames(rows.map((row) => row.account));
  if (!overviewGroupsInitialized) {
    orderedGroups.forEach((group) => collapsedOverviewGroups.add(group));
    overviewGroupsInitialized = true;
  }
  const allGroupsCollapsed = orderedGroups.every((group) => collapsedOverviewGroups.has(group));
  $("#toggleOverviewGroups").textContent = allGroupsCollapsed ? "全部展开" : "全部折叠";
  $("#accountTable").innerHTML = orderedGroups
    .map((group) => {
      const groupRows = grouped[group];
      const subtotal = groupRows.reduce((sum, row) => sum + row.converted, 0);
      const collapsed = collapsedOverviewGroups.has(group);
      return `
        <section class="account-group draggable-group ${collapsed ? "is-collapsed" : ""}" data-drop-group="${escapeHtml(group)}">
          <div class="account-group-heading" data-toggle-account-group="${escapeHtml(group)}" role="button" tabindex="0" aria-expanded="${collapsed ? "false" : "true"}">
            <div class="drag-title">
              ${overviewAccountSortMode ? `<button class="drag-handle" data-drag-group="${escapeHtml(group)}" type="button" title="拖动分组">⠿</button>` : ""}
              ${groupChevron(collapsed)}
              <div>
                <b>${escapeHtml(group)}</b>
                <span class="group-account-count">${groupRows.length} 个账户</span>
              </div>
            </div>
            <b>${moneySpan(formatMoney(subtotal))}</b>
          </div>
          <div class="account-group-rows" ${collapsed ? "hidden" : ""}>
          ${groupRows
            .map(
              (row) => {
                const { account, raw, converted } = row;
                return `
                <div class="table-row account-detail-row draggable-account" data-drop-account="${account.id}" data-account-group="${escapeHtml(group)}">
                  <div class="drag-title">
                    ${overviewAccountSortMode ? `<button class="drag-handle" data-drag-account="${account.id}" data-account-group="${escapeHtml(group)}" type="button" title="拖动账户">⠿</button>` : ""}
                    <div>
                    <b>${escapeHtml(account.name)}</b>
                    <span class="meta">${typeLabel(account.type)} · ${account.currency}</span>
                    </div>
                  </div>
                  <div>
                    <b>${moneySpan(formatMoney(converted))}</b>
                    ${account.currency !== state.settings.baseCurrency ? `<span class="meta">${moneySpan(formatMoney(raw, account.currency))}</span>` : ""}
                    ${accountGainHtml(row)}
                  </div>
                </div>
              `;
              }
            )
            .join("")}
          </div>
        </section>
      `;
    })
    .join("");
}

function renderAccounts() {
  const list = $("#accountsList");
  $("#toggleAccountSort").textContent = accountSortMode ? "完成" : "排序";
  $("#toggleAccountSort").classList.toggle("primary-button", accountSortMode);
  $("#toggleAccountSort").classList.toggle("secondary-button", !accountSortMode);
  $("#accountSortHint").textContent = accountSortMode ? "拖动把手调整分组和账户顺序" : "按分组展示";
  if (state.accounts.length === 0) {
    list.innerHTML = emptyHtml();
    return;
  }
  const renderStatusSection = (title, accounts, allowDrag, scope) => {
    if (!accounts.length) return "";
    const grouped = accounts.reduce((result, account) => {
      (result[accountGroupName(account)] ||= []).push(account);
      return result;
    }, {});
    return `<section class="account-list-section">${title ? `<h3>${title}</h3>` : ""}${orderedGroupNames(accounts).map((group) => {
      const collapseKey = accountListGroupCollapseKey(scope, group);
      const collapsed = collapsedAccountGroups.has(collapseKey);
      return `
      <section class="account-management-group draggable-group ${collapsed ? "is-collapsed" : ""}" data-drop-group="${escapeHtml(group)}">
        <div class="account-group-heading" data-toggle-account-list-group="${escapeHtml(collapseKey)}" role="button" tabindex="0" aria-expanded="${collapsed ? "false" : "true"}">
          <div class="drag-title">${allowDrag ? `<button class="drag-handle" data-drag-group="${escapeHtml(group)}" type="button" title="拖动分组">⠿</button>` : ""}${groupChevron(collapsed)}${
            editingAccountGroupName === group
              ? `<input class="group-name-input" data-editing-account-group="${escapeHtml(group)}" value="${escapeHtml(group)}" />`
              : `<b>${escapeHtml(group)}</b>`
          }</div>
          <div class="group-heading-actions">
            <span>${grouped[group].length} 个账户</span>
            ${
              editingAccountGroupName === group
                ? `${iconButton("check", "完成", `data-save-account-group="${escapeHtml(group)}"`, "primary")}
                   ${iconButton("close", "取消", "data-cancel-account-group-edit")}`
                : iconButton("edit", "编辑分组", `data-start-account-group-edit="${escapeHtml(group)}"`)
            }
          </div>
        </div>
        <div class="account-group-rows" ${collapsed ? "hidden" : ""}>
        ${grouped[group].map((account) => {
          const currentBalance = accountCurrentBalance(account.id);
          const balanceLabel = formatMoney(currentBalance, account.currency);
          const cost = optionalNumber(account.costBasis);
          return `
        <article class="account-card draggable-account" data-drop-account="${account.id}" data-account-group="${escapeHtml(group)}">
          <div class="drag-title">
            ${allowDrag ? `<button class="drag-handle" data-drag-account="${account.id}" data-account-group="${escapeHtml(group)}" type="button" title="拖动账户">⠿</button>` : ""}
            <div>
            <b>${escapeHtml(account.name)}</b>
            <div class="meta">${typeLabel(account.type)} · ${account.currency}${account.includeInNetWorth === false ? " · 不计入净值" : ""}${account.archived ? " · 已归档" : ""}</div>
            </div>
          </div>
          <div class="account-card-side">
            <strong>${moneySpan(balanceLabel)}</strong>
            <span class="meta">${cost === null ? "未填成本" : `成本 ${moneySpan(formatMoney(cost, account.currency))}`}</span>
          </div>
          <div class="account-actions">
            ${iconButton("edit", "编辑账户", `data-edit-account="${account.id}"`)}
          </div>
        </article>
        `;
        }).join("")}
        </div>
      </section>`;
    }).join("")}</section>`;
  };
  const activeHtml = renderStatusSection("", state.accounts.filter((account) => !account.archived), accountSortMode, "active");
  const archivedAccounts = state.accounts.filter((account) => account.archived);
  const archivedHtml = archivedAccounts.length
    ? `<details class="archived-accounts"><summary>已归档账户 <span>${archivedAccounts.length}</span></summary>${renderStatusSection("", archivedAccounts, false, "archived")}</details>`
    : "";
  list.innerHTML = activeHtml + archivedHtml;
}

function snapshotBalanceFieldHtml(account, sourceSnapshot) {
  const defaultValue = sourceSnapshot?.balances?.[account.id] ?? "";
  const defaultCost = sourceSnapshot?.costs && Object.hasOwn(sourceSnapshot.costs, account.id)
    ? optionalNumber(sourceSnapshot.costs[account.id])
    : null;
  return `
    <div class="balance-field">
      <span>${escapeHtml(account.name)} (${account.currency})</span>
      <div class="balance-field-inputs">
        <label>
          <span>余额</span>
          <input data-balance-account="${escapeHtml(account.id)}" type="number" step="0.01" value="${defaultValue}" placeholder="0" />
        </label>
        <label>
          <span>成本</span>
          <input data-cost-account="${escapeHtml(account.id)}" type="number" step="0.01" value="${defaultCost ?? ""}" placeholder="选填" />
        </label>
      </div>
    </div>
  `;
}

function renderSnapshotForm() {
  const editingSnapshot = editingSnapshotId ? state.snapshots.find((snapshot) => snapshot.id === editingSnapshotId) : null;
  snapshotInlineTagAdding = false;
  snapshotInlineTagDraft = "";
  $("#snapshotFormTitle").textContent = editingSnapshot ? "编辑历史快照" : "录入余额快照";
  $("#snapshotForm").dataset.editingSnapshotId = editingSnapshot?.id || "";
  $("#snapshotSheet .sheet-heading span").textContent = editingSnapshot ? "修改该日期的余额、成本、标签和备注" : "批量更新各账户在同一日期的余额和成本";
  $("#snapshotForm button[type='submit']").textContent = editingSnapshot ? "保存修改" : "保存快照";
  $("#snapshotDate").value = editingSnapshot?.date || $("#snapshotDate").value || localDateString();
  const date = $("#snapshotDate").value;
  const sourceSnapshot = snapshotFormSource(date, editingSnapshot);
  syncSnapshotMetaFields();
  const activeAccounts = state.accounts.filter((account) => !account.archived);
  const grouped = activeAccounts.reduce((result, account) => {
    const group = account.group || "未分组";
    (result[group] ||= []).push(account);
    return result;
  }, {});
  $("#balanceInputs").innerHTML = orderedGroupNames(activeAccounts)
    .map(
      (group) => {
        const accounts = grouped[group];
        return `
        <section class="balance-group">
          <div class="balance-group-heading">
            <b>${escapeHtml(group)}</b>
            <span>${accounts.length} 个账户</span>
          </div>
          <div class="balance-group-fields">
            ${accounts
              .map((account) => snapshotBalanceFieldHtml(account, sourceSnapshot))
              .join("")}
          </div>
        </section>
      `;
      }
    )
    .join("");
  renderSnapshotRateEditor();
}

function syncSnapshotMetaFields() {
  const date = $("#snapshotDate")?.value;
  const snapshot = editingSnapshotId
    ? state.snapshots.find((item) => item.id === editingSnapshotId)
    : state.snapshots.find((item) => item.date === date);
  renderSnapshotTagChoices(snapshot?.tags || []);
  $("#snapshotNote").value = snapshot?.note || "";
  snapshotRateDraft = snapshot ? snapshotRates(snapshot) : { ...state.settings.rates };
  renderSnapshotRateEditor();
}

function snapshotRateCurrencies() {
  const base = state.settings.baseCurrency;
  return enabledCurrencies()
    .filter((currency) => currency.code !== base)
    .filter((currency) => state.accounts.some((account) => !account.archived && account.currency === currency.code));
}

function renderSnapshotRateEditor() {
  const inputs = $("#snapshotRateInputs");
  const summary = $("#snapshotRateSummary");
  const openButton = $("#openSnapshotRates");
  if (!inputs || !summary || !openButton) return;
  const base = state.settings.baseCurrency;
  const currencies = snapshotRateCurrencies();
  openButton.disabled = currencies.length === 0;
  if (!snapshotRateDraft) snapshotRateDraft = { ...state.settings.rates };
  if (!currencies.length) {
    summary.textContent = "无外币账户";
    inputs.innerHTML = "";
    return;
  }
  updateSnapshotRateSummary();
  inputs.innerHTML = currencies.map((currency) => {
    const value = relativeRateValue(currency.code, snapshotRateDraft);
    return `
      <label>
        1 ${currency.code} = 多少 ${base}
        <input data-snapshot-rate="${currency.code}" type="number" min="0" step="${significantStep(value)}" value="${Number(value.toPrecision(8))}" />
      </label>
    `;
  }).join("");
}

function openSnapshotRateDialog() {
  renderSnapshotRateEditor();
  if ($("#openSnapshotRates").disabled) return;
  $("#snapshotRateDialog").hidden = false;
  document.body.classList.add("sheet-open");
  window.setTimeout(() => $("#snapshotRateInputs input")?.focus(), 0);
}

function closeSnapshotRateDialog({ apply = false } = {}) {
  if (apply) syncSnapshotRateDraftFromInputs();
  $("#snapshotRateDialog").hidden = true;
  if ($$(".sheet-backdrop:not([hidden])").length === 0) document.body.classList.remove("sheet-open");
}

function updateSnapshotRateSummary() {
  const summary = $("#snapshotRateSummary");
  if (!summary) return;
  const base = state.settings.baseCurrency;
  const currencies = snapshotRateCurrencies();
  summary.textContent = currencies.length
    ? currencies.map((currency) => {
      const value = relativeRateValue(currency.code, snapshotRateDraft || state.settings.rates);
      return `1 ${currency.code} = ${Number(value.toPrecision(8))} ${base}`;
    }).join(" · ")
    : "无外币账户";
}

function syncSnapshotRateDraftFromInputs() {
  if (!snapshotRateDraft) snapshotRateDraft = { ...state.settings.rates };
  $$("[data-snapshot-rate]").forEach((input) => {
    const relativeRate = Number(input.value);
    if (relativeRate > 0) setRelativeRate(snapshotRateDraft, input.dataset.snapshotRate, relativeRate);
  });
  updateSnapshotRateSummary();
}

function snapshotRatesFromForm() {
  if (!$("#snapshotRateDialog").hidden) syncSnapshotRateDraftFromInputs();
  return { ...effectiveRates(snapshotRateDraft) };
}

function renderSnapshotTagChoices(selectedTags = []) {
  const selected = new Set(selectedTags);
  const tags = allSnapshotTags();
  const choicesHtml = tags.length
    ? tags.map((tag) => `
      <label class="tag-choice">
        <input name="tags" value="${escapeHtml(tag)}" type="checkbox" ${selected.has(tag) ? "checked" : ""} />
        <span>${escapeHtml(tag)}</span>
      </label>
    `).join("")
    : '<span class="meta">暂无标签，请先到设置中添加</span>';
  const addHtml = snapshotInlineTagAdding
    ? `
      <span class="snapshot-tag-add" data-snapshot-tag-add>
        <input id="snapshotInlineTagInput" value="${escapeHtml(snapshotInlineTagDraft)}" placeholder="新标签" aria-label="新标签名称" data-snapshot-tag-input />
        <button class="snapshot-tag-add-action is-confirm" type="button" aria-label="保存新标签" data-save-snapshot-tag>✓</button>
        <button class="snapshot-tag-add-action" type="button" aria-label="取消新增标签" data-cancel-snapshot-tag>×</button>
      </span>
    `
    : '<button class="tag-choice tag-add-choice" type="button" data-start-snapshot-tag-add>+ 增加标签</button>';
  $("#snapshotTagChoices").innerHTML = `${choicesHtml}${addHtml}`;
  if (snapshotInlineTagAdding) {
    window.setTimeout(() => $("#snapshotInlineTagInput")?.focus(), 0);
  }
}

function currentSnapshotSelectedTags() {
  return $$("#snapshotTagChoices input[name='tags']:checked")
    .map((input) => String(input.value || "").trim())
    .filter(Boolean);
}

function rerenderSnapshotTagChoicesWithCurrentSelection() {
  renderSnapshotTagChoices(currentSnapshotSelectedTags());
}

async function saveInlineSnapshotTag() {
  const input = $("#snapshotInlineTagInput");
  const name = String(input?.value || "").trim();
  if (!name) {
    await alertDialog("标签名称不能为空。");
    input?.focus();
    return;
  }
  const tags = allSnapshotTags();
  if (tags.includes(name)) {
    await alertDialog(`标签“${name}”已经存在。`);
    input?.focus();
    input?.select();
    return;
  }
  const selected = new Set(currentSnapshotSelectedTags());
  selected.add(name);
  state.settings.snapshotTags = normalizeSnapshotTagSettings([...(state.settings.snapshotTags || []), name], state.snapshots);
  snapshotInlineTagAdding = false;
  snapshotInlineTagDraft = "";
  saveState();
  renderSnapshotTagChoices([...selected]);
  renderSnapshots();
  renderTagManager();
}

function filteredSnapshotsSorted() {
  return [...state.snapshots]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((snapshot) =>
      snapshotMatchesSearch(snapshot, snapshotSearchQuery) &&
      snapshotMatchesTagFilters(snapshot) &&
      snapshotMatchesDateRange(snapshot)
    );
}

function renderSnapshots() {
  const list = $("#snapshotList");
  list.querySelectorAll(".snapshot-month-group[open]").forEach((group) => {
    if (group.dataset.snapshotMonth) openSnapshotMonths.add(group.dataset.snapshotMonth);
  });
  const sorted = [...state.snapshots].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];
  $("#snapshotHistoryEntrySummary").textContent = state.snapshots.length
    ? `共 ${state.snapshots.length} 条 · 最近 ${latest.date}`
    : "暂无历史快照";
  renderSnapshotFilters();
  const validSnapshotIds = new Set(state.snapshots.map((snapshot) => snapshot.id));
  const reportMode = snapshotHistoryMode === "report";
  [...selectedSnapshotIds].forEach((snapshotId) => {
    if (!validSnapshotIds.has(snapshotId)) selectedSnapshotIds.delete(snapshotId);
  });
  $("#toggleSnapshotManage").textContent = snapshotManageMode ? "完成" : "快照管理";
  $("#toggleSnapshotManage").classList.toggle("primary-button", snapshotManageMode);
  $("#toggleSnapshotManage").classList.toggle("secondary-button", !snapshotManageMode);
  $("#deleteSelectedSnapshots").hidden = !snapshotManageMode;
  $("#deleteSelectedSnapshots").disabled = selectedSnapshotIds.size === 0;
  $("#selectFilteredSnapshots").hidden = !snapshotManageMode || filteredSnapshotsSorted().length === 0;
  $("#selectFilteredSnapshots").textContent = selectedSnapshotIds.size ? "取消选择" : "筛选全选";
  $("#toggleSnapshotHistoryView").textContent = snapshotHistoryView === "calendar" ? "列表视图" : "日历视图";
  if (reportMode) {
    snapshotManageMode = false;
    $("#toggleSnapshotManage").hidden = true;
    $("#deleteSelectedSnapshots").hidden = true;
  } else {
    $("#toggleSnapshotManage").hidden = false;
  }
  if (state.snapshots.length === 0) {
    $("#snapshotHistoryHint").textContent = "暂无历史快照";
    $("#toggleSnapshotLimit").hidden = true;
    list.innerHTML = emptyHtml();
    return;
  }
  const filtered = filteredSnapshotsSorted();
  const visibleSnapshots = showAllSnapshots ? filtered : filtered.slice(0, 10);
  $("#toggleSnapshotLimit").hidden = filtered.length <= 10;
  $("#toggleSnapshotLimit").textContent = showAllSnapshots ? "只看最近 10 条" : "查看全部";
  $("#snapshotHistoryHint").textContent = snapshotManageMode
    ? `已选择 ${selectedSnapshotIds.size} 条`
    : `${showAllSnapshots ? "全部" : "最近 10 条"} · 共 ${sorted.length} 条`;
  if (!snapshotManageMode) {
    const filterParts = [];
    if (compactText(snapshotSearchQuery)) filterParts.push(`搜索：${compactText(snapshotSearchQuery)}`);
    if (snapshotDateFrom || snapshotDateTo) filterParts.push(`日期：${snapshotDateFrom || "最早"} → ${snapshotDateTo || "最新"}`);
    if (selectedSnapshotTagFilters.size) filterParts.push(`标签：${[...selectedSnapshotTagFilters].join("、")}`);
    $("#snapshotHistoryHint").textContent = `${filterParts.length ? `${filterParts.join(" · ")} · ` : ""}${showAllSnapshots ? "全部" : "最近 10 条"} · 共 ${filtered.length} 条`;
  }
  if (filtered.length === 0) {
    $("#toggleSnapshotLimit").hidden = true;
    list.innerHTML = emptyHtml();
    return;
  }
  if (snapshotHistoryView === "calendar") {
    list.innerHTML = snapshotHistoryCalendarHtml(visibleSnapshots);
    return;
  }
  const groups = visibleSnapshots.reduce((result, snapshot) => {
    const month = snapshot.date.slice(0, 7);
    (result[month] ||= []).push(snapshot);
    return result;
  }, {});
  list.innerHTML = Object.entries(groups)
    .map(([month, snapshots], index) => {
      const monthIds = snapshots.map((snapshot) => snapshot.id);
      const monthSelectedCount = monthIds.filter((id) => selectedSnapshotIds.has(id)).length;
      const monthChecked = monthSelectedCount > 0 && monthSelectedCount === monthIds.length;
      const monthPartial = monthSelectedCount > 0 && monthSelectedCount < monthIds.length;
      const isOpen = openSnapshotMonths.has(month) || (!openSnapshotMonths.size && index === 0);
      return `
      <details class="snapshot-month-group" data-snapshot-month="${month}" ${isOpen ? "open" : ""}>
        <summary>
          <div class="snapshot-month-summary-main">
            ${snapshotManageMode ? `<label class="snapshot-month-select" data-month-checkbox-wrapper>
              <input data-select-snapshot-month="${month}" type="checkbox" ${monthChecked ? "checked" : ""} ${monthPartial ? 'data-indeterminate="true"' : ""} />
              <span class="sr-only">选择 ${month} 整个月的快照</span>
            </label>` : ""}
            <b>${month}</b>
          </div>
          <span>${snapshots.length} 条</span>
        </summary>
        <div class="snapshot-month-list">
          ${snapshots
            .map((snapshot) => {
              const total = snapshotTotal(snapshot);
              const count = Object.values(snapshot.balances).filter((value) => Number(value) !== 0).length;
              const checked = selectedSnapshotIds.has(snapshot.id) ? "checked" : "";
              const note = compactText(snapshot.note);
              const notePreview = compactPreview(note);
              const rowTag = snapshotManageMode ? "div" : "button";
              return `
                <${rowTag} class="table-row snapshot-row" data-edit-snapshot="${snapshot.id}" ${snapshotManageMode ? "" : 'type="button"'}>
                  ${snapshotManageMode ? `<label class="snapshot-select"><input data-select-snapshot="${snapshot.id}" type="checkbox" ${checked} /><span class="sr-only">选择 ${snapshot.date}</span></label>` : ""}
                  <div>
                    <div class="snapshot-date-line"><b>${snapshot.date}</b>${snapshotTagsHtml(snapshot)}</div>
                    <span class="meta">${count} 个账户有余额${note ? ` · <span class="snapshot-note-preview" title="${escapeHtml(note)}">${escapeHtml(notePreview)}</span>` : ""}</span>
                  </div>
                  <div class="snapshot-total">
                    <b>${moneySpan(formatMoney(total.net))}</b>
                  </div>
                </${rowTag}>
              `;
            })
            .join("")}
        </div>
      </details>
    `;
    })
    .join("");
  list.querySelectorAll('[data-indeterminate="true"]').forEach((input) => {
    input.indeterminate = true;
  });
}

function snapshotHistoryCalendarMonths(snapshots) {
  return [...new Set(snapshots.map((snapshot) => snapshot.date.slice(0, 7)).filter(Boolean))]
    .sort((a, b) => b.localeCompare(a));
}

function snapshotHistoryCalendarMonthValue(snapshots) {
  const months = snapshotHistoryCalendarMonths(snapshots);
  if (!months.length) return "";
  if (!snapshotHistoryCalendarMonth || !months.includes(snapshotHistoryCalendarMonth)) {
    snapshotHistoryCalendarMonth = months[0];
  }
  return snapshotHistoryCalendarMonth;
}

function snapshotHistoryCalendarHtml(snapshots) {
  const months = snapshotHistoryCalendarMonths(snapshots);
  const selectedMonth = snapshotHistoryCalendarMonthValue(snapshots);
  if (!selectedMonth) return emptyHtml();
  const monthIndex = months.indexOf(selectedMonth);
  const monthSnapshots = snapshots.filter((snapshot) => snapshot.date.startsWith(`${selectedMonth}-`));
  const [year, monthNumber] = selectedMonth.split("-").map(Number);
  const byDate = {};
  monthSnapshots.forEach((snapshot) => {
    (byDate[snapshot.date] ||= []).push(snapshot);
  });
  const dayCount = new Date(year, monthNumber, 0).getDate();
  const firstDay = new Date(year, monthNumber - 1, 1).getDay();
  const cells = [
    ...Array.from({ length: firstDay }, () => `<span class="snapshot-calendar-day is-empty"></span>`),
    ...Array.from({ length: dayCount }, (_, index) => {
      const day = index + 1;
      const date = dateKey(year, monthNumber, day);
      const dateSnapshots = byDate[date] || [];
      const latest = dateSnapshots[0];
      if (!latest) return `<span class="snapshot-calendar-day">${day}</span>`;
      const total = snapshotTotal(latest);
      return `<button class="snapshot-calendar-day has-snapshot" data-edit-snapshot="${escapeHtml(latest.id)}" type="button" title="${escapeHtml(`${date} · ${dateSnapshots.length} 条 · ${formatMoney(total.net)}`)}"><span>${day}</span><small>${dateSnapshots.length}</small></button>`;
    }),
  ].join("");
  return `
    <div class="snapshot-calendar">
      <div class="snapshot-calendar-controls">
        <button class="icon-button secondary-icon snapshot-calendar-arrow" data-history-calendar-step="prev" type="button" aria-label="查看上个月" ${monthIndex >= months.length - 1 ? "disabled" : ""}>&lt;</button>
        <label class="control-field snapshot-calendar-month-select">
          <select id="snapshotHistoryCalendarMonth" class="control-select" aria-label="选择历史快照月份">
            ${months.map((month) => `<option value="${month}" ${month === selectedMonth ? "selected" : ""}>${month}</option>`).join("")}
          </select>
        </label>
        <button class="icon-button secondary-icon snapshot-calendar-arrow" data-history-calendar-step="next" type="button" aria-label="查看下个月" ${monthIndex <= 0 ? "disabled" : ""}>&gt;</button>
      </div>
      <section class="snapshot-calendar-month">
        <div class="heatmap-weekdays" aria-hidden="true"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>
        <div class="snapshot-calendar-grid">${cells}</div>
      </section>
    </div>
  `;
}

function renderSnapshotFilters() {
  const searchInput = $("#snapshotSearchInput");
  const filterList = $("#snapshotTagFilterList");
  const clearButton = $("#clearSnapshotFilters");
  const tags = usedSnapshotTags();
  [...selectedSnapshotTagFilters].forEach((tag) => {
    if (!tags.includes(tag)) selectedSnapshotTagFilters.delete(tag);
  });
  if (document.activeElement !== searchInput) searchInput.value = snapshotSearchQuery;
  const dateFromInput = $("#snapshotDateFrom");
  const dateToInput = $("#snapshotDateTo");
  if (dateFromInput && document.activeElement !== dateFromInput) dateFromInput.value = snapshotDateFrom;
  if (dateToInput && document.activeElement !== dateToInput) dateToInput.value = snapshotDateTo;
  filterList.innerHTML = tags.length
    ? tags.map((tag) => `
      <label class="snapshot-filter-tag">
        <input data-filter-snapshot-tag="${escapeHtml(tag)}" type="checkbox" ${selectedSnapshotTagFilters.has(tag) ? "checked" : ""} />
        <span>${escapeHtml(tag)}</span>
      </label>
    `).join("")
    : '<span class="meta">暂无可筛选标签</span>';
  clearButton.hidden = !compactText(snapshotSearchQuery) && !snapshotDateFrom && !snapshotDateTo && selectedSnapshotTagFilters.size === 0;
}

function renderAll() {
  renderCurrencyOptions();
  renderAccountTypeOptions(editingAccountId ? state.accounts.find((account) => account.id === editingAccountId)?.type : undefined);
  renderRates();
  renderTypeManager();
  renderTagManager();
  renderDashboard();
  renderAccounts();
  renderAnalysis();
  renderSnapshotForm();
  renderSnapshots();
  renderBackupOverview();
  renderCsvExportControls();
}

function typeLabel(type) {
  return typeGroups().flatMap((group) => group.types).find((item) => item.id === type)?.name || "其他";
}

function renderTypeManager() {
  const groups = typeDraft || typeGroups();
  const groupIds = new Set(groups.map((group) => group.id));
  const typeIds = new Set(groups.flatMap((group) => group.types.map((type) => type.id)));
  [...selectedTypeGroupIds].forEach((groupId) => {
    if (!groupIds.has(groupId)) selectedTypeGroupIds.delete(groupId);
  });
  [...selectedTypeIds].forEach((typeId) => {
    if (!typeIds.has(typeId)) selectedTypeIds.delete(typeId);
  });
  $("#toggleTypeManage").textContent = typeManageMode ? "完成" : "管理";
  $("#toggleTypeManage").classList.toggle("primary-button", typeManageMode);
  $("#toggleTypeManage").classList.toggle("secondary-button", !typeManageMode);
  $("#deleteSelectedTypes").hidden = !typeManageMode;
  $("#deleteSelectedTypes").disabled = selectedTypeGroupIds.size + selectedTypeIds.size === 0;
  $("#typeManageHint").textContent = typeManageMode
    ? `已选择 ${selectedTypeGroupIds.size + selectedTypeIds.size} 项`
    : "管理账户类型分类";
  $("#typeGroupSelect").innerHTML = groups.map((group) => `<option value="${group.id}">${escapeHtml(group.name)}</option>`).join("");
  $("#accountTypeManager").innerHTML = groups
    .map(
      (group) => `
        <section class="type-group-card" data-type-group-card="${group.id}">
          <div class="type-group-heading">
            ${typeManageMode ? `<input class="manager-checkbox" data-select-type-group="${group.id}" type="checkbox" ${selectedTypeGroupIds.has(group.id) ? "checked" : ""} aria-label="选择大类 ${escapeHtml(group.name)}" />` : ""}
            <div class="type-group-editor">
              <input data-type-group-name="${group.id}" value="${escapeHtml(group.name)}" aria-label="大类名称" />
            </div>
          </div>
          <div class="type-chip-list">
            ${group.types
              .map(
                (type) => `
                  <div class="type-chip">
                    ${typeManageMode ? `<input class="manager-checkbox" data-select-type="${type.id}" data-type-group="${group.id}" type="checkbox" ${selectedTypeIds.has(type.id) ? "checked" : ""} aria-label="选择小类 ${escapeHtml(type.name)}" />` : ""}
                    <input data-type-name="${type.id}" data-type-group="${group.id}" value="${escapeHtml(type.name)}" aria-label="小类名称" />
                  </div>
                `
              )
              .join("") || '<span class="meta">暂无小类</span>'}
          </div>
        </section>
      `
    )
    .join("");
}

function renderTagManager() {
  const tags = tagDraft || normalizeSnapshotTagSettings(state.settings.snapshotTags, state.snapshots);
  [...selectedTagNames].forEach((tag) => {
    if (!tags.includes(tag)) selectedTagNames.delete(tag);
  });
  $("#toggleTagManage").textContent = tagManageMode ? "完成" : "管理";
  $("#toggleTagManage").classList.toggle("primary-button", tagManageMode);
  $("#toggleTagManage").classList.toggle("secondary-button", !tagManageMode);
  $("#deleteSelectedTags").hidden = !tagManageMode;
  $("#deleteSelectedTags").disabled = selectedTagNames.size === 0;
  $("#tagManageHint").textContent = tagManageMode ? `已选择 ${selectedTagNames.size} 个标签` : "管理快照标签";
  $("#snapshotTagManager").innerHTML = tags.map((tag) => `
    <div class="tag-manager-item">
      ${tagManageMode ? `<input class="manager-checkbox" data-select-tag="${escapeHtml(tag)}" type="checkbox" ${selectedTagNames.has(tag) ? "checked" : ""} aria-label="选择标签 ${escapeHtml(tag)}" />` : ""}
      <input data-tag-name="${escapeHtml(tag)}" value="${escapeHtml(tag)}" aria-label="标签名称" />
    </div>
  `).join("");
}

function syncTagDraftFromInputs() {
  if (!tagDraft) return;
  tagDraft = [...new Set($$("#snapshotTagManager [data-tag-name]")
    .map((input) => input.value.trim())
    .filter(Boolean))];
}

function emptyHtml() {
  return $("#emptyTemplate").innerHTML;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function iconSvg(name) {
  const icons = {
    edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10.5-10.5-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>',
    archive: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M6 7v12h12V7"/><path d="M9 11h6"/></svg>',
    restore: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M6 7v12h12V7"/><path d="M9 14h5"/><path d="m11 11-3 3 3 3"/></svg>',
    delete: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M7 7l1 13h8l1-13"/><path d="M10 11v5"/><path d="M14 11v5"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12"/><path d="M18 6 6 18"/></svg>',
  };
  return icons[name] || "";
}

function iconButton(icon, label, attrs = "", variant = "secondary") {
  const variantClass = variant === "danger" ? "danger-icon" : variant === "primary" ? "primary-icon" : "secondary-icon";
  return `<button class="icon-button ${variantClass}" ${attrs} type="button" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">${iconSvg(icon)}</button>`;
}

function download(filename, content, type) {
  try {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    window.setTimeout(() => {
      anchor.remove();
      URL.revokeObjectURL(url);
    }, 1500);
    return true;
  } catch (error) {
    console.error("Download failed", error);
    return false;
  }
}

async function saveTextFile({ filename, content, type, description, accept }) {
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description, accept }],
      });
      const writable = await handle.createWritable();
      await writable.write(new Blob([content], { type }));
      await writable.close();
      return { ok: true, method: "picker" };
    } catch (error) {
      if (error?.name === "AbortError") return { ok: false, cancelled: true };
      console.error("Save file picker failed", error);
    }
  }
  const ok = download(filename, content, type);
  return { ok, method: "download" };
}

function backupPayload() {
  const portableSettings = { ...state.settings };
  delete portableSettings.theme;
  return JSON.stringify({
    ...state,
    settings: portableSettings,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    version: DATA_SCHEMA_VERSION,
  }, null, 2);
}

function currencySettingsPayload() {
  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    baseCurrency: state.settings.baseCurrency,
    enabledCurrencies: state.settings.enabledCurrencies || [],
    customCurrencies: state.settings.customCurrencies || [],
    deletedCurrencyCodes: state.settings.deletedCurrencyCodes || [],
    rates: state.settings.rates || {},
  }, null, 2);
}

function normalizeCurrencySettings(settings, accounts, fallbackSettings = state.settings) {
  const source = settings || {};
  const fallback = fallbackSettings || defaultState.settings;
  const importedCustom = Array.isArray(source.customCurrencies)
    ? source.customCurrencies
        .map((item) => {
          const code = String(item.code || "").trim().toUpperCase();
          return {
            code,
            name: String(item.name || code || "").trim(),
            symbol: String(item.symbol || code || "").trim(),
            rate: Number(item.rate || source.rates?.[code] || source.rates?.[item.code] || 1),
          };
        })
        .filter((item) => /^[A-Z0-9]{2,6}$/.test(item.code) && item.name && item.symbol)
    : [];
  const used = [...new Set((accounts || []).map((account) => String(account.currency || source.baseCurrency || fallback.baseCurrency || "CNY").trim().toUpperCase()).filter(Boolean))];
  const builtInCodes = new Set(currencies.map((item) => item.code));
  const importedCustomCodes = new Set(importedCustom.map((item) => item.code));
  const preservedUsedCustom = (fallback.customCurrencies || []).filter(
    (item) => used.includes(item.code) && !builtInCodes.has(item.code) && !importedCustomCodes.has(item.code)
  );
  const customCurrencies = [...importedCustom, ...preservedUsedCustom].filter(
    (item, index, list) => list.findIndex((candidate) => candidate.code === item.code) === index
  );
  const knownCodes = new Set([...currencies.map((item) => item.code), ...customCurrencies.map((item) => item.code)]);
  const fallbackRates = fallback.rates || {};
  const importedRates = source.rates || {};
  used.forEach((code) => {
    if (knownCodes.has(code)) return;
    customCurrencies.push({
      code,
      name: code,
      symbol: code,
      rate: Number(importedRates[code] || fallbackRates[code] || 1),
    });
    knownCodes.add(code);
  });
  let deletedCurrencyCodes = Array.isArray(source.deletedCurrencyCodes) ? source.deletedCurrencyCodes.map((code) => String(code).trim().toUpperCase()) : [];
  deletedCurrencyCodes = [...new Set(deletedCurrencyCodes)].filter((code) => knownCodes.has(code) && !used.includes(code));
  let baseCurrency = String(source.baseCurrency || fallback.baseCurrency || "CNY").trim().toUpperCase();
  if (!knownCodes.has(baseCurrency) || deletedCurrencyCodes.includes(baseCurrency)) {
    baseCurrency = used.find((code) => knownCodes.has(code) && !deletedCurrencyCodes.includes(code)) || fallback.baseCurrency || "CNY";
  }
  deletedCurrencyCodes = deletedCurrencyCodes.filter((code) => code !== baseCurrency);
  const enabledCurrencies = [...new Set([
    baseCurrency,
    ...used,
    ...(Array.isArray(source.enabledCurrencies) ? source.enabledCurrencies.map((code) => String(code).trim().toUpperCase()) : []),
  ])].filter((code) => knownCodes.has(code) && !deletedCurrencyCodes.includes(code));
  const rates = { ...fallbackRates, ...importedRates };
  enabledCurrencies.forEach((code) => {
    const config = [...currencies, ...customCurrencies].find((item) => item.code === code);
    if (!Number(rates[code])) rates[code] = config?.rate || 1;
  });
  return {
    ...source,
    baseCurrency,
    customCurrencies,
    deletedCurrencyCodes,
    enabledCurrencies,
    rates,
  };
}

function importCurrencySettingsContent(content) {
  const imported = JSON.parse(content);
  if (!imported || typeof imported !== "object") throw new Error("Invalid currency config");
  const normalized = normalizeCurrencySettings(imported, state.accounts, state.settings);
  state.settings.baseCurrency = normalized.baseCurrency;
  state.settings.customCurrencies = normalized.customCurrencies;
  state.settings.deletedCurrencyCodes = normalized.deletedCurrencyCodes;
  state.settings.enabledCurrencies = normalized.enabledCurrencies;
  state.settings.rates = normalized.rates;
  saveState();
  renderAll();
}

function setBackupStatus(message, kind = "success") {
  const status = $("#backupStatus");
  status.textContent = message;
  status.dataset.kind = kind;
}

function setCurrencyConfigStatus(message, kind = "success") {
  const status = $("#currencyConfigStatus");
  status.textContent = message;
  status.dataset.kind = kind;
}

function importValidationError(message, details = []) {
  const error = new Error(message);
  error.isImportValidationError = true;
  error.details = details;
  return error;
}

function ensureImportValid(condition, message) {
  if (!condition) throw importValidationError(message);
}

function collectImportIssue(issues, condition, message) {
  if (!condition) issues.push(message);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidDateString(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function ensureFiniteMap(map, fieldName, itemName) {
  ensureImportValid(isPlainObject(map), `${itemName} 的 ${fieldName} 不是有效对象。`);
  Object.entries(map).forEach(([key, value]) => {
    ensureImportValid(key !== "", `${itemName} 的 ${fieldName} 包含空键。`);
    ensureImportValid(Number.isFinite(Number(value)), `${itemName} 的 ${fieldName} 包含非数字金额。`);
  });
}

function summarizeImportDetails(details, limit = 12) {
  const unique = [...new Set(details.filter(Boolean))];
  if (unique.length <= limit) return unique;
  return [...unique.slice(0, limit), `还有 ${unique.length - limit} 项未展开。`];
}

function importKeyMapWithAccountFallback(map, accountsById, accountsByName) {
  const result = {};
  Object.entries(map || {}).forEach(([key, value]) => {
    const trimmedKey = String(key || "").trim();
    const account = accountsById.get(trimmedKey) || accountsByName.get(trimmedKey);
    result[account?.id || trimmedKey] = Number(value);
  });
  return result;
}

function normalizeJsonImportData(imported) {
  const issues = [];
  const repairs = [];
  const warnings = [];
  collectImportIssue(issues, isPlainObject(imported), "JSON 根内容不是有效对象。");
  if (issues.length) throw importValidationError("JSON 结构无法识别。", issues);
  collectImportIssue(issues, Array.isArray(imported.accounts), "缺少账户列表 accounts。");
  collectImportIssue(issues, Array.isArray(imported.snapshots), "缺少快照列表 snapshots。");
  collectImportIssue(issues, imported.settings === undefined || isPlainObject(imported.settings), "settings 设置不是有效对象。");
  if (issues.length) throw importValidationError("JSON 缺少基础数据结构。", issues);

  const data = {
    ...imported,
    settings: isPlainObject(imported.settings) ? { ...imported.settings } : {},
    accounts: [],
    snapshots: [],
  };
  if (imported.settings === undefined) repairs.push("缺少 settings 设置，已使用当前版本默认设置。");
  const missingSettings = Object.keys(defaultState.settings).filter((key) => data.settings[key] === undefined);
  if (missingSettings.length) {
    repairs.push(`缺少设置项 ${missingSettings.join("、")}，已使用默认值。`);
    missingSettings.forEach((key) => {
      data.settings[key] = structuredClone(defaultState.settings[key]);
    });
  }
  data.settings.accountTypeGroups = normalizeTypeGroups(data.settings.accountTypeGroups);
  data.settings.healthConfig = normalizeHealthConfig(data.settings.healthConfig, data.settings.accountTypeGroups);
  data.settings.healthDenominatorConfig = normalizeHealthDenominatorConfig(data.settings.healthDenominatorConfig, data.settings.accountTypeGroups);
  data.settings.healthCustomCards = normalizeHealthCustomCards(data.settings.healthCustomCards, data.settings.accountTypeGroups);
  const baseCurrency = String(data.settings.baseCurrency || defaultState.settings.baseCurrency).trim().toUpperCase();

  const usedIds = new Set();
  const accountIdRemap = new Map();
  const accountsById = new Map();
  const accountsByName = new Map();
  imported.accounts.forEach((account, index) => {
    const itemName = `第 ${index + 1} 个账户`;
    collectImportIssue(issues, isPlainObject(account), `${itemName} 不是有效对象。`);
    if (!isPlainObject(account)) return;
    const normalized = { ...account };
    const originalId = String(account.id || "").trim();
    if (!originalId || usedIds.has(originalId)) {
      normalized.id = id();
      repairs.push(`${itemName} 缺少账户 ID 或 ID 重复，已生成新 ID。`);
    } else {
      normalized.id = originalId;
    }
    usedIds.add(normalized.id);
    if (originalId && originalId !== normalized.id) accountIdRemap.set(originalId, normalized.id);
    if (!String(account.name || "").trim()) {
      normalized.name = `未命名账户 ${index + 1}`;
      repairs.push(`${itemName} 缺少账户名称，已设为 ${normalized.name}。`);
    }
    if (account.currency === undefined || !String(account.currency).trim()) {
      normalized.currency = baseCurrency;
      repairs.push(`${itemName} 缺少货币代码，已设为 ${baseCurrency}。`);
    }
    if (account.type === undefined || !String(account.type).trim()) repairs.push(`${itemName} 缺少账户类型，已使用默认类型。`);
    if (account.includeInNetWorth === undefined) repairs.push(`${itemName} 缺少净值统计设置，已默认计入净值。`);
    if (account.costBasis !== undefined && account.costBasis !== "") {
      collectImportIssue(issues, Number.isFinite(Number(account.costBasis)), `${itemName} 的持仓成本不是有效数字。`);
    }
    const repaired = normalizeAccount(normalized, data.settings.accountTypeGroups);
    data.accounts.push(repaired);
    accountsById.set(repaired.id, repaired);
    accountsByName.set(repaired.name, repaired);
  });

  imported.snapshots.forEach((snapshot, index) => {
    const itemName = `第 ${index + 1} 条快照`;
    collectImportIssue(issues, isPlainObject(snapshot), `${itemName} 不是有效对象。`);
    if (!isPlainObject(snapshot)) return;
    collectImportIssue(issues, isValidDateString(snapshot.date), `${itemName} 日期格式不正确。`);
    if (snapshot.balances === undefined) repairs.push(`${itemName} 缺少 balances 余额表，已设为空对象。`);
    else collectImportIssue(issues, isPlainObject(snapshot.balances), `${itemName} 的 balances 不是有效对象。`);
    if (snapshot.costs !== undefined) collectImportIssue(issues, isPlainObject(snapshot.costs), `${itemName} 的 costs 不是有效对象。`);
    if (snapshot.rates !== undefined) collectImportIssue(issues, isPlainObject(snapshot.rates), `${itemName} 的 rates 不是有效对象。`);
    if (snapshot.tags !== undefined) collectImportIssue(issues, Array.isArray(snapshot.tags) || typeof snapshot.tags === "string", `${itemName} 的标签格式不正确。`);
    [snapshot.balances, snapshot.costs, snapshot.rates].forEach((map) => {
      if (!isPlainObject(map)) return;
      Object.entries(map).forEach(([key, value]) => {
        collectImportIssue(issues, String(key || "").trim() !== "", `${itemName} 包含空账户键。`);
        collectImportIssue(issues, Number.isFinite(Number(value)), `${itemName} 包含非数字金额或汇率。`);
      });
    });
    const repaired = normalizeSnapshot({
      ...snapshot,
      id: snapshot.id || id(),
      balances: importKeyMapWithAccountFallback(snapshot.balances || {}, accountsById, accountsByName),
      costs: importKeyMapWithAccountFallback(snapshot.costs || {}, accountsById, accountsByName),
      rates: isPlainObject(snapshot.rates) ? Object.fromEntries(Object.entries(snapshot.rates).map(([key, value]) => [String(key).trim().toUpperCase(), Number(value)])) : {},
    });
    if (!snapshot.id) repairs.push(`${itemName} 缺少快照 ID，已生成新 ID。`);
    if (snapshot.costs === undefined) repairs.push(`${itemName} 缺少 costs 成本表，已设为空对象。`);
    if (snapshot.rates === undefined) repairs.push(`${itemName} 缺少 rates 汇率表，已设为空对象。`);
    if (snapshot.tags === undefined) repairs.push(`${itemName} 缺少标签，已设为空列表。`);
    if (snapshot.note === undefined) repairs.push(`${itemName} 缺少备注，已设为空文本。`);
    data.snapshots.push(repaired);
  });

  if (accountIdRemap.size) {
    warnings.push("部分旧账户 ID 已被重建；快照中的旧 ID 或同名账户键已尽量自动对齐。");
  }
  if (issues.length) throw importValidationError(`JSON 中发现 ${issues.length} 个格式问题。`, summarizeImportDetails(issues));
  return { data, warnings, repairs: summarizeImportDetails(repairs, 16) };
}

function validateJsonImportData(imported) {
  ensureImportValid(isPlainObject(imported), "JSON 根内容不是有效对象。");
  ensureImportValid(Array.isArray(imported.accounts), "缺少账户列表 accounts。");
  ensureImportValid(Array.isArray(imported.snapshots), "缺少快照列表 snapshots。");
  if (imported.settings !== undefined) ensureImportValid(isPlainObject(imported.settings), "settings 设置不是有效对象。");
  imported.accounts.forEach((account, index) => {
    const itemName = `第 ${index + 1} 个账户`;
    ensureImportValid(isPlainObject(account), `${itemName} 不是有效对象。`);
    ensureImportValid(String(account.id || "").trim(), `${itemName} 缺少账户 ID。`);
    ensureImportValid(String(account.name || "").trim(), `${itemName} 缺少账户名称。`);
    if (account.currency !== undefined) ensureImportValid(String(account.currency).trim(), `${itemName} 货币代码为空。`);
    if (account.costBasis !== undefined && account.costBasis !== "") {
      ensureImportValid(Number.isFinite(Number(account.costBasis)), `${itemName} 的持仓成本不是有效数字。`);
    }
  });
  imported.snapshots.forEach((snapshot, index) => {
    const itemName = `第 ${index + 1} 条快照`;
    ensureImportValid(isPlainObject(snapshot), `${itemName} 不是有效对象。`);
    ensureImportValid(isValidDateString(snapshot.date), `${itemName} 日期格式不正确。`);
    ensureFiniteMap(snapshot.balances, "balances", itemName);
    if (snapshot.costs !== undefined) ensureFiniteMap(snapshot.costs, "costs", itemName);
    if (snapshot.rates !== undefined) ensureFiniteMap(snapshot.rates, "rates", itemName);
    if (snapshot.tags !== undefined) ensureImportValid(Array.isArray(snapshot.tags) || typeof snapshot.tags === "string", `${itemName} 的标签格式不正确。`);
  });
}

function parseCsvImportContent(content) {
  const rows = parseCsv(content.replace(/^\uFEFF/, ""));
  const header = rows.shift()?.map((cell) => cell.trim().toLowerCase()) || [];
  ensureImportValid(header.length > 0, "CSV 文件缺少表头。");
  const required = ["date", "account", "balance"];
  const missing = required.filter((name) => !header.includes(name));
  ensureImportValid(missing.length === 0, `CSV 缺少必要表头：${missing.join("、")}。`);
  ensureImportValid(rows.length > 0, "CSV 没有可导入的数据行。");
  const get = (row, name) => row[header.indexOf(name)] || "";
  const rowIssues = [];
  rows.forEach((row, index) => {
    const rowName = `第 ${index + 2} 行`;
    const date = get(row, "date").trim();
    const accountName = get(row, "account").trim();
    const balance = get(row, "balance").trim();
    collectImportIssue(rowIssues, isValidDateString(date), `${rowName} 日期格式不正确。`);
    collectImportIssue(rowIssues, accountName, `${rowName} 缺少账户名称。`);
    collectImportIssue(rowIssues, balance !== "" && Number.isFinite(Number(balance)), `${rowName} 余额不是有效数字。`);
    if (header.includes("costbasis")) {
      const costBasis = get(row, "costbasis").trim();
      collectImportIssue(rowIssues, costBasis === "" || Number.isFinite(Number(costBasis)), `${rowName} 持仓成本不是有效数字。`);
    }
    if (header.includes("currency")) {
      const currency = get(row, "currency").trim();
      collectImportIssue(rowIssues, currency === "" || /^[A-Za-z0-9]{2,6}$/.test(currency), `${rowName} 货币代码格式不正确。`);
    }
    ["includeinnetworth", "archived", "hidden"].forEach((name) => {
      if (!header.includes(name)) return;
      const value = get(row, name).trim().toLowerCase();
      collectImportIssue(rowIssues, value === "" || value === "true" || value === "false", `${rowName} 的 ${name} 只能填写 true 或 false。`);
    });
  });
  if (rowIssues.length) {
    throw importValidationError(`CSV 中发现 ${rowIssues.length} 个格式问题。`, summarizeImportDetails(rowIssues));
  }
  return { rows, header, get };
}

function importFailureMessage(kind, error) {
  const fallback = kind === "csv"
    ? "请确认 CSV 表头包含 date、account、balance，且日期和金额格式正确。"
    : "请确认内容是本应用导出的完整 JSON 备份。";
  const detail = error?.isImportValidationError ? error.message : fallback;
  const details = error?.details?.length
    ? `\n\n问题摘要：\n- ${error.details.map((item) => String(item)).join("\n- ")}`
    : "";
  return `导入失败，未写入任何数据。\n\n可能原因：${detail}${details}`;
}

function logImportFailure(context, error) {
  const expectedUserInputError = error?.isImportValidationError || error instanceof SyntaxError;
  (expectedUserInputError ? console.info : console.error)(context, error);
}

function importJsonContent(content, normalizedData = null) {
  const imported = normalizedData || normalizeJsonImportData(JSON.parse(content)).data;
  validateJsonImportData(imported);
  const localTheme = normalizedTheme(state.settings.theme);
  const importedSettings = { ...defaultState.settings, ...(imported.settings || {}) };
  importedSettings.theme = localTheme;
  importedSettings.accountTypeGroups = normalizeTypeGroups(importedSettings.accountTypeGroups);
  importedSettings.healthConfig = normalizeHealthConfig(importedSettings.healthConfig, importedSettings.accountTypeGroups);
  importedSettings.healthDenominatorConfig = normalizeHealthDenominatorConfig(importedSettings.healthDenominatorConfig, importedSettings.accountTypeGroups);
  importedSettings.healthCustomCards = normalizeHealthCustomCards(importedSettings.healthCustomCards, importedSettings.accountTypeGroups);
  const importedSnapshots = imported.snapshots.map(normalizeSnapshot);
  importedSettings.snapshotTags = normalizeSnapshotTagSettings(importedSettings.snapshotTags, importedSnapshots);
  Object.assign(importedSettings, normalizeCurrencySettings(importedSettings, imported.accounts, defaultState.settings));
  state = {
    ...structuredClone(defaultState),
    ...imported,
    settings: importedSettings,
    accounts: imported.accounts.map((account) => normalizeAccount(account, importedSettings.accountTypeGroups)),
    snapshots: importedSnapshots,
  };
  saveState();
  applyTheme();
  renderAll();
}

function importCsvContent(content) {
  const previousState = structuredClone(state);
  const { rows, header, get } = parseCsvImportContent(content);
  try {
    rows.forEach((row) => {
      const date = get(row, "date");
      const accountName = get(row, "account");
      const currency = get(row, "currency") || state.settings.baseCurrency;
      const group = get(row, "group") || "";
      const legacyKind = get(row, "kind");
      const type = get(row, "type") || (legacyKind === "liability" ? "credit" : "other");
      const account = findOrCreateAccount(accountName, currency, group, type);
      if (header.includes("includeinnetworth")) account.includeInNetWorth = get(row, "includeinnetworth") !== "false";
      if (header.includes("archived")) account.archived = get(row, "archived") === "true";
      else if (header.includes("hidden")) account.archived = get(row, "hidden") === "true";
      const costBasis = header.includes("costbasis") ? get(row, "costbasis") : undefined;
      upsertSnapshot(date, account.id, get(row, "balance"), costBasis);
      const snapshot = getSnapshotForDate(date);
      if (header.includes("tags")) snapshot.tags = parseTags(get(row, "tags"));
      if (header.includes("note")) snapshot.note = get(row, "note").trim();
    });
    state.settings.snapshotTags = normalizeSnapshotTagSettings(state.settings.snapshotTags, state.snapshots);
    saveState();
    renderAll();
  } catch (error) {
    state = previousState;
    throw error;
  }
}

function dateRangeText(dates) {
  const sorted = [...new Set(dates.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  if (!sorted.length) return "无日期";
  return sorted.length === 1 ? sorted[0] : `${sorted[0]} → ${sorted[sorted.length - 1]}`;
}

function formatStorageSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function renderBackupOverview() {
  const target = $("#backupOverviewGrid");
  if (!target) return;
  const latest = latestSnapshot();
  const total = snapshotTotal(latest);
  const groups = new Set(state.accounts.map(accountGroupName));
  const storageBytes = new Blob([backupPayload()]).size;
  const money = state.settings.privacy ? privateMoneyPlaceholder() : formatMoney(total.net);
  const items = [
    ["账户分组", `${groups.size} 个`],
    ["账户", `${state.accounts.length} 个`],
    ["历史快照", `${state.snapshots.length} 条`],
    ["最新快照", latest?.date || "暂无"],
    ["当前净值", money],
    ["本地数据大小", formatStorageSize(storageBytes)],
  ];
  target.innerHTML = items.map(([label, value, hint]) => `
    <article><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b>${hint ? `<small>${escapeHtml(hint)}</small>` : ""}</article>
  `).join("");
}

function dateDaysAgo(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return localDateString(date);
}

function resolvedCsvExportRange() {
  const today = localDateString();
  if (csvExportRange === "30d") return { from: dateDaysAgo(29), to: today };
  if (csvExportRange === "90d") return { from: dateDaysAgo(89), to: today };
  if (csvExportRange === "year") return { from: `${today.slice(0, 4)}-01-01`, to: today };
  if (csvExportRange === "custom") return { from: csvExportFrom, to: csvExportTo };
  return { from: "", to: "" };
}

function snapshotsInRange(snapshots, from = "", to = "") {
  return snapshots.filter((snapshot) => (!from || snapshot.date >= from) && (!to || snapshot.date <= to));
}

function renderCsvExportControls() {
  const rangeSelect = $("#csvExportRange");
  if (!rangeSelect) return;
  rangeSelect.value = csvExportRange;
  const custom = csvExportRange === "custom";
  $$(".csv-custom-date").forEach((label) => { label.hidden = !custom; });
  $("#csvExportFrom").value = csvExportFrom;
  $("#csvExportTo").value = csvExportTo;
  const { from, to } = resolvedCsvExportRange();
  const invalid = Boolean(from && to && from > to);
  const snapshots = invalid ? [] : snapshotsInRange(state.snapshots, from, to);
  const rows = snapshots.length * state.accounts.length;
  const summary = invalid
    ? "开始日期不能晚于结束日期。"
    : `${dateRangeText(snapshots.map((item) => item.date))} · ${snapshots.length} 个快照日期 · 预计 ${rows} 行`;
  $("#csvExportSummary").textContent = summary;
  $("#csvExportSummary").classList.toggle("error", invalid || snapshots.length === 0);
  $("#exportCsv").disabled = invalid || snapshots.length === 0;
}

function backupPreviewStats(stats) {
  return `
    <div class="import-preview-grid">
      ${stats.map((item) => `
        <article>
          <span>${escapeHtml(item.label)}</span>
          <b>${escapeHtml(String(item.value))}</b>
        </article>
      `).join("")}
    </div>
  `;
}

function previewJsonImport(content, sourceName = "JSON 备份") {
  const imported = JSON.parse(content);
  const normalized = normalizeJsonImportData(imported);
  const normalizedData = normalized.data;
  validateJsonImportData(normalizedData);
  const snapshots = normalizedData.snapshots.map(normalizeSnapshot);
  const settings = { ...defaultState.settings, ...(normalizedData.settings || {}) };
  const tags = normalizeSnapshotTagSettings(settings.snapshotTags, snapshots);
  const currenciesCount = new Set([
    settings.baseCurrency,
    ...(settings.enabledCurrencies || []),
    ...(settings.customCurrencies || []).map((item) => item.code),
    ...(normalizedData.accounts || []).map((account) => account.currency),
  ].filter(Boolean)).size;
  const hasCosts = snapshots.some((snapshot) => Object.keys(snapshot.costs || {}).length > 0) ||
    (normalizedData.accounts || []).some((account) => optionalNumber(account.costBasis) !== null);
  const schemaVersion = imported.dataSchemaVersion || imported.version || "";
  const appVersion = imported.appVersion || "";
  const warnings = [...normalized.warnings];
  if (state.accounts.length || state.snapshots.length) warnings.push("JSON 备份会全量覆盖当前浏览器中的账户、快照和设置。");
  if (!schemaVersion) warnings.push("未检测到数据结构版本，将按当前兼容逻辑导入。");
  return {
    kind: "json",
    content,
    normalizedData,
    sourceName,
    title: "JSON 备份预检",
    subtitle: `${sourceName} · 确认后全量覆盖当前数据`,
    badge: appVersion || `schema ${schemaVersion || "?"}`,
    stats: [
      { label: "账户", value: normalizedData.accounts.length },
      { label: "快照", value: snapshots.length },
      { label: "货币", value: currenciesCount },
      { label: "标签", value: tags.length },
      { label: "日期范围", value: dateRangeText(snapshots.map((snapshot) => snapshot.date)) },
      { label: "成本字段", value: hasCosts ? "包含" : "未包含" },
      { label: "应用版本", value: appVersion || "未记录" },
      { label: "结构版本", value: schemaVersion || "未记录" },
    ],
    warnings,
    repairs: normalized.repairs,
  };
}

function csvRowsToContent(header, rows) {
  return [header, ...rows].map((row) => row.map(toCsvCell).join(",")).join("\n");
}

function csvPreviewDetails(rows, header, get) {
  const accountNames = [...new Set(rows.map((row) => get(row, "account").trim()).filter(Boolean))];
  const dates = [...new Set(rows.map((row) => get(row, "date").trim()).filter(Boolean))];
  const currentAccountNames = new Set(state.accounts.map((account) => account.name));
  const matchedAccounts = accountNames.filter((name) => currentAccountNames.has(name)).length;
  const importedCurrencies = [...new Set(rows.map((row) => (get(row, "currency") || state.settings.baseCurrency).trim().toUpperCase()).filter(Boolean))];
  const knownCurrencyCodes = new Set(allCurrencies().map((item) => item.code));
  const unknownCurrencies = importedCurrencies.filter((code) => !knownCurrencyCodes.has(code));
  const duplicateKeys = new Set();
  const seenKeys = new Set();
  rows.forEach((row) => {
    const key = `${get(row, "date")}::${get(row, "account")}`;
    if (seenKeys.has(key)) duplicateKeys.add(key);
    seenKeys.add(key);
  });
  return { accountNames, dates, matchedAccounts, importedCurrencies, unknownCurrencies, duplicateKeys };
}

function refreshCsvImportPreview(preview) {
  const { rows, header } = preview.csv;
  const get = (row, name) => row[header.indexOf(name)] || "";
  const from = preview.csv.from || "";
  const to = preview.csv.to || "";
  const invalid = Boolean(from && to && from > to);
  const filteredRows = invalid ? [] : rows.filter((row) => {
    const date = get(row, "date").trim();
    return (!from || date >= from) && (!to || date <= to);
  });
  const details = csvPreviewDetails(filteredRows, header, get);
  const warnings = [...preview.csv.baseWarnings];
  if (invalid) warnings.unshift("开始日期不能晚于结束日期。");
  if (!filteredRows.length && !invalid) warnings.unshift("当前日期范围内没有可导入的数据行。");
  if (details.duplicateKeys.size) warnings.push(`${details.duplicateKeys.size} 个日期/账户组合重复，后出现的行会覆盖前面的余额。`);
  if (details.unknownCurrencies.length) warnings.push(`发现未知货币：${details.unknownCurrencies.join("、")}；导入后建议检查货币设置。`);
  preview.content = filteredRows.length ? csvRowsToContent(header, filteredRows) : "";
  preview.csv.filteredRows = filteredRows;
  preview.stats = [
    { label: "有效行", value: filteredRows.length },
    { label: "排除行", value: rows.length - filteredRows.length },
    { label: "账户", value: `${details.accountNames.length} 个（匹配 ${details.matchedAccounts}，新增 ${details.accountNames.length - details.matchedAccounts}）` },
    { label: "快照日期", value: details.dates.length },
    { label: "日期范围", value: dateRangeText(details.dates) },
    { label: "货币", value: details.importedCurrencies.length },
    { label: "成本字段", value: header.includes("costbasis") ? "包含" : "未包含" },
  ];
  preview.warnings = warnings;
  preview.blocked = invalid || filteredRows.length === 0;
}

function previewCsvImport(content, sourceName = "CSV 快照") {
  const { rows, header, get } = parseCsvImportContent(content);
  const allDetails = csvPreviewDetails(rows, header, get);
  const warnings = [];
  if (!header.includes("costbasis")) warnings.push("CSV 未包含 costBasis 成本列，将按旧格式兼容导入；历史收益/成本分析可能缺少成本口径。");
  const preview = {
    kind: "csv",
    content,
    sourceName,
    title: "CSV 快照预检",
    subtitle: `${sourceName} · 确认后合并到账户和历史快照`,
    badge: "CSV",
    warnings,
    repairs: [],
    csv: {
      rows,
      header,
      from: "",
      to: "",
      fullRange: dateRangeText(allDetails.dates),
      baseWarnings: warnings,
    },
  };
  refreshCsvImportPreview(preview);
  return preview;
}

function renderImportPreview(preview) {
  pendingImportPreview = preview;
  $("#importPreview").hidden = false;
  document.body.classList.add("sheet-open");
  $("#importPreviewTitle").textContent = preview.title;
  $("#importPreviewSubtitle").textContent = preview.subtitle;
  $("#importPreviewBadge").textContent = preview.badge;
  const warningItems = preview.warnings || [];
  const repairItems = preview.repairs || [];
  $("#importPreviewContent").innerHTML = `
    ${preview.kind === "csv" ? `
      <section class="import-range-panel">
        <div><b>选择导入时间范围</b><span>文件完整范围：${escapeHtml(preview.csv.fullRange)}</span></div>
        <div class="import-range-fields">
          <label>开始日期<input id="csvImportFrom" type="date" value="${escapeHtml(preview.csv.from)}" /></label>
          <label>结束日期<input id="csvImportTo" type="date" value="${escapeHtml(preview.csv.to)}" /></label>
          <button class="ghost-button" id="clearCsvImportRange" type="button">全部范围</button>
        </div>
      </section>
    ` : ""}
    ${backupPreviewStats(preview.stats)}
    ${repairItems.length ? `
      <div class="import-preview-repairs">
        <b>兼容补齐</b>
        <ul>${repairItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
    ` : ""}
    ${warningItems.length ? `
      <div class="import-preview-warnings">
        <b>注意事项</b>
        <ul>${warningItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
    ` : repairItems.length ? "" : `<p class="hint">未发现明显格式风险。</p>`}
  `;
  $("#confirmImportPreview").disabled = Boolean(preview.blocked);
  window.setTimeout(() => $("#confirmImportPreview").focus(), 0);
}

function clearImportPreview() {
  pendingImportPreview = null;
  $("#importPreview").hidden = true;
  $("#importPreviewContent").innerHTML = "";
  $("#confirmImportPreview").disabled = false;
  if ($$(".sheet-backdrop:not([hidden])").length === 0) document.body.classList.remove("sheet-open");
}

async function confirmPendingImport() {
  if (!pendingImportPreview || pendingImportPreview.blocked) return;
  const preview = pendingImportPreview;
  const message = preview.kind === "json"
    ? "确认导入该 JSON 备份并覆盖当前浏览器中的全部数据吗？"
    : "确认导入该 CSV 快照并合并到当前数据吗？";
  const ok = await confirmDialog(message, {
    title: preview.title,
    confirmText: preview.kind === "json" ? "覆盖导入" : "确认导入",
    variant: preview.kind === "json" ? "danger" : "default",
  });
  if (!ok) return;
  try {
    if (preview.kind === "json") importJsonContent(preview.content, preview.normalizedData);
    else importCsvContent(preview.content);
    setBackupStatus(`已导入：${preview.sourceName}`);
    clearImportPreview();
  } catch (error) {
    logImportFailure("Confirmed import failed", error);
    setBackupStatus("导入失败：文件内容无法写入当前数据。", "error");
    await alertDialog(importFailureMessage(preview.kind, error), { title: "导入失败", variant: "danger" });
  }
}

function prepareBackupText(open = false) {
  $("#backupText").value = backupPayload();
  if (open) $("#backupFallback").open = true;
}

function toCsvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function exportSnapshotsCsv(snapshots = state.snapshots) {
  const rows = [["date", "account", "balance", "costBasis", "currency", "group", "type", "includeInNetWorth", "archived", "tags", "note"]];
  [...snapshots]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((snapshot) => {
      state.accounts.forEach((account) => {
        rows.push([
          snapshot.date,
          account.name,
          snapshot.balances[account.id] ?? 0,
          snapshot.costs?.[account.id] ?? "",
          account.currency,
          account.group || "",
          account.type,
          account.includeInNetWorth !== false,
          Boolean(account.archived),
          snapshotTagsText(snapshot.tags || []),
          snapshot.note || "",
        ]);
      });
    });
  return rows.map((row) => row.map(toCsvCell).join(",")).join("\n");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((item) => item.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((item) => item.trim() !== "")) rows.push(row);
  return rows;
}

async function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsText(file, "utf-8");
  });
}

function baselineBalancesForDate(date) {
  const previous = [...state.snapshots]
    .filter((snapshot) => snapshot.date < date)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  return { ...(previous?.balances || {}) };
}

function baselineCostsForDate(date) {
  const previousSnapshots = [...state.snapshots]
    .filter((snapshot) => snapshot.date < date)
    .sort((a, b) => b.date.localeCompare(a.date));
  return Object.fromEntries(state.accounts.flatMap((account) => {
    const snapshotWithCost = previousSnapshots.find((snapshot) => snapshot.costs && Object.hasOwn(snapshot.costs, account.id));
    const snapshotCost = snapshotWithCost ? optionalNumber(snapshotWithCost.costs[account.id]) : null;
    const accountCost = optionalNumber(account.costBasis);
    const cost = snapshotCost ?? accountCost;
    return cost === null ? [] : [[account.id, cost]];
  }));
}

function snapshotFormSource(date, editingSnapshot = null) {
  const dateSnapshot = state.snapshots.find((snapshot) => snapshot.date === date);
  const snapshot = editingSnapshot || dateSnapshot;
  return {
    ...(snapshot || {}),
    balances: { ...baselineBalancesForDate(date), ...(snapshot?.balances || {}) },
    costs: { ...baselineCostsForDate(date), ...(snapshot?.costs || {}) },
  };
}

function getSnapshotForDate(date) {
  const matches = state.snapshots.filter((snapshot) => snapshot.date === date);
  if (matches.length > 0) {
    const [snapshot, ...duplicates] = matches;
    if (duplicates.length) {
      duplicates.forEach((item) => {
        snapshot.balances = { ...(snapshot.balances || {}), ...(item.balances || {}) };
        snapshot.costs = { ...(snapshot.costs || {}), ...(item.costs || {}) };
        snapshot.rates = { ...(snapshot.rates || {}), ...(item.rates || {}) };
      });
      state.snapshots = state.snapshots.filter((item) => item.date !== date || item === snapshot);
    }
    snapshot.balances = { ...baselineBalancesForDate(date), ...(snapshot.balances || {}) };
    snapshot.costs = { ...baselineCostsForDate(date), ...(snapshot.costs || {}) };
    snapshot.rates = { ...(snapshot.rates || state.settings.rates) };
    snapshot.tags = Array.isArray(snapshot.tags) ? snapshot.tags : parseTags(snapshot.tags || "");
    snapshot.note = snapshot.note || "";
    return snapshot;
  }
  const snapshot = { id: id(), date, balances: baselineBalancesForDate(date), costs: baselineCostsForDate(date), rates: { ...state.settings.rates }, tags: [], note: "" };
  state.snapshots.push(snapshot);
  return snapshot;
}

function upsertSnapshot(date, accountId, balance, costBasis = undefined) {
  const snapshot = getSnapshotForDate(date);
  snapshot.balances[accountId] = Number(balance) || 0;
  if (!snapshot.costs) snapshot.costs = {};
  if (costBasis !== undefined) {
    const cost = optionalNumber(costBasis);
    if (cost === null) delete snapshot.costs[accountId];
    else snapshot.costs[accountId] = cost;
  }
  snapshot.rates = { ...state.settings.rates };
}

async function saveSnapshotFromForm(form) {
  if (snapshotSubmitInProgress) return;
  snapshotSubmitInProgress = true;
  try {
    const data = new FormData(form);
    const date = $("#snapshotDate").value;
    const formEditingSnapshotId = form.dataset.editingSnapshotId || editingSnapshotId || "";
    const originalSnapshot = formEditingSnapshotId ? state.snapshots.find((snapshot) => snapshot.id === formEditingSnapshotId) : null;
    const targetSnapshot = state.snapshots.find((snapshot) => snapshot.date === date && snapshot.id !== formEditingSnapshotId);
    if (originalSnapshot && targetSnapshot) {
      const ok = await confirmDialog(`日期 ${date} 已有历史快照。\n\n继续保存会覆盖该日期已有快照，并保留当前编辑内容。确定继续吗？`, {
        title: "覆盖已有快照",
        confirmText: "覆盖保存",
        variant: "danger",
      });
      if (!ok) return;
      state.snapshots = state.snapshots.filter((snapshot) => snapshot.id !== targetSnapshot.id);
    }
    const snapshot = originalSnapshot || getSnapshotForDate(date);
    const balances = { ...snapshot.balances };
    const costs = { ...(snapshot.costs || {}) };
    state.accounts.filter((account) => !account.archived).forEach((account) => {
      const balanceInput = form.querySelector(`[data-balance-account="${CSS.escape(account.id)}"]`);
      const costInput = form.querySelector(`[data-cost-account="${CSS.escape(account.id)}"]`);
      balances[account.id] = Number(balanceInput?.value || 0);
      const cost = optionalNumber(costInput?.value);
      if (cost === null) delete costs[account.id];
      else costs[account.id] = cost;
    });
    snapshot.date = date;
    snapshot.balances = balances;
    snapshot.costs = costs;
    snapshot.rates = snapshotRatesFromForm();
    snapshot.tags = data.getAll("tags").map((tag) => String(tag).trim()).filter(Boolean);
    snapshot.note = data.get("note").trim();
    state.snapshots = state.snapshots.filter((item, index, array) => array.findIndex((snapshotItem) => snapshotItem.date === item.date) === index);
    editingSnapshotId = null;
    saveState();
    closeSnapshotSheet();
    renderAll();
  } finally {
    snapshotSubmitInProgress = false;
  }
}

function findOrCreateAccount(name, currency, group, type = "other") {
  const existing = state.accounts.find((account) => account.name === name);
  if (existing) return existing;
  if (!typeGroups().some((typeGroup) => typeGroup.types.some((item) => item.id === type))) {
    type = typeGroups()[0]?.types[0]?.id || "other";
  }
  const account = {
    id: id(),
    name,
    type,
    group: group || "未分组",
    currency: currency || state.settings.baseCurrency,
    includeInNetWorth: true,
    archived: false,
  };
  state.accounts.push(account);
  return account;
}

let chartResizeTimer = null;

function renderVisibleCharts() {
  if ($("#dashboardView")?.classList.contains("active")) renderTrend();
  if ($("#analysisView")?.classList.contains("active")) {
    renderAnalysisTrend();
    renderAnalysisHealthTrend();
  }
}

function scheduleVisibleChartRender() {
  window.clearTimeout(chartResizeTimer);
  chartResizeTimer = window.setTimeout(renderVisibleCharts, 120);
}

function bindEvents() {
  $$(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".tab").forEach((item) => item.classList.toggle("active", item === button));
      $$(".view").forEach((view) => view.classList.remove("active"));
      $(`#${button.dataset.tab}View`).classList.add("active");
      scheduleVisibleChartRender();
    });
  });

  window.addEventListener("resize", scheduleVisibleChartRender);

  $("#privacyToggle").addEventListener("click", () => {
    state.settings.privacy = !state.settings.privacy;
    saveState();
    renderDashboard();
    renderAnalysis();
    renderSnapshots();
  });
  $$("[data-trend-line]").forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) visibleTrendLines.add(input.dataset.trendLine);
      else if (visibleTrendLines.size > 1) visibleTrendLines.delete(input.dataset.trendLine);
      else input.checked = true;
      renderTrend();
    });
  });
  $$("[data-trend-period]").forEach((button) => {
    button.addEventListener("click", () => {
      trendPeriod = button.dataset.trendPeriod || "day";
      hideLineChartTooltip($("#trendChart"), "trend");
      renderTrend();
    });
  });
  $$("[data-contribution-period]").forEach((button) => {
    button.addEventListener("click", () => {
      contributionPeriod = button.dataset.contributionPeriod || "day";
      renderNetWorthContribution();
    });
  });
  $("#contributionLookbackSelect")?.addEventListener("change", (event) => {
    contributionLookback = Number(event.currentTarget.value || 2);
    renderNetWorthContribution();
  });
  $("#snapshotHeatmapMode")?.addEventListener("change", (event) => {
    snapshotHeatmapMode = event.currentTarget.value || "day";
    renderSnapshotHeatmap();
  });
  $("#snapshotHeatmapMetric")?.addEventListener("change", (event) => {
    snapshotHeatmapMetric = event.currentTarget.value || "count";
    renderSnapshotHeatmap();
  });
  $("#snapshotHeatmapRange")?.addEventListener("change", (event) => {
    snapshotHeatmapRange = event.currentTarget.value || "year";
    renderSnapshotHeatmap();
  });
  $("#snapshotHeatmapActiveOnly")?.addEventListener("change", (event) => {
    snapshotHeatmapActiveOnly = event.currentTarget.checked;
    renderSnapshotHeatmap();
  });
  $("#snapshotHeatmap")?.addEventListener("click", (event) => {
    const card = event.target.closest("[data-heatmap-month]");
    if (!card || !card.dataset.heatmapMonth) return;
    snapshotHeatmapYear = card.dataset.heatmapMonth.slice(0, 4);
    snapshotHeatmapMonth = card.dataset.heatmapMonth.slice(5, 7);
    snapshotHeatmapMode = "day";
    renderSnapshotHeatmap();
  });
  $("#snapshotHeatmap")?.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    const card = event.target.closest("[data-heatmap-month]");
    if (!card) return;
    event.preventDefault();
    card.click();
  });
  $("#snapshotHeatmapYear")?.addEventListener("change", (event) => {
    snapshotHeatmapYear = event.currentTarget.value;
    snapshotHeatmapMonth = "";
    renderSnapshotHeatmap();
  });
  $("#snapshotHeatmapMonth")?.addEventListener("change", (event) => {
    snapshotHeatmapMonth = event.currentTarget.value;
    renderSnapshotHeatmap();
  });
  $("#analysisTrendMetricSelect")?.addEventListener("change", (event) => {
    analysisTrendMetric = event.currentTarget.value || "balance";
    selectedAnalysisTrendAccountIds.clear();
    selectedAnalysisTrendTypeNames.clear();
    renderAnalysisTrend();
  });
  $$("[data-analysis-trend-period]").forEach((button) => {
    button.addEventListener("click", () => {
      analysisTrendPeriod = button.dataset.analysisTrendPeriod || "month";
      renderAnalysisTrend();
    });
  });
  $$("[data-analysis-health-trend-period]").forEach((button) => {
    button.addEventListener("click", () => {
      analysisHealthTrendPeriod = button.dataset.analysisHealthTrendPeriod || "month";
      renderAnalysisHealthTrend();
    });
  });
  $("#analysisTrendModeSelect")?.addEventListener("change", (event) => {
    analysisTrendMode = event.currentTarget.value || "total";
    renderAnalysisTrend();
  });
  $("#toggleAnalysisTrendAccountPicker")?.addEventListener("click", (event) => {
    event.stopPropagation();
    const popover = $("#analysisTrendAccountPopover");
    if (!popover) return;
    popover.hidden = !popover.hidden;
    renderAnalysisTrendControls();
  });
  $("#analysisTrendAccountPopover")?.addEventListener("click", (event) => {
    event.stopPropagation();
    const selectedIds = selectedAnalysisTrendOptionIds();
    const options = analysisTrendSelectableOptions(analysisTrendData());
    const selectAllButton = event.target.closest("[data-analysis-trend-select-all]");
    if (selectAllButton) {
      selectedIds.clear();
      options.forEach((option) => selectedIds.add(option.id));
      renderAnalysisTrend();
      return;
    }
    const selectTopButton = event.target.closest("[data-analysis-trend-select-top]");
    if (selectTopButton) {
      selectedIds.clear();
      options.slice(0, Math.min(4, options.length)).forEach((option) => selectedIds.add(option.id));
      renderAnalysisTrend();
      return;
    }
    const input = event.target.closest("[data-analysis-trend-option]");
    if (!input) return;
    const optionId = input.dataset.analysisTrendOption;
    if (input.checked) {
      selectedIds.add(optionId);
    } else if (selectedIds.size > 1) {
      selectedIds.delete(optionId);
    } else {
      input.checked = true;
      return;
    }
    renderAnalysisTrend();
  });
  $("#gainAnalysis")?.addEventListener("change", (event) => {
    const modeSelect = event.target.closest("#gainAnalysisFilterMode");
    const valueSelect = event.target.closest("#gainAnalysisFilterValue");
    if (modeSelect) {
      gainAnalysisFilterMode = modeSelect.value || "all";
      gainAnalysisFilterValue = "";
      renderGainAnalysis(snapshotTotal(latestSnapshot()));
    }
    if (valueSelect) {
      gainAnalysisFilterValue = valueSelect.value || "";
      renderGainAnalysis(snapshotTotal(latestSnapshot()));
    }
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest("#analysisTrendAccountPicker")) return;
    const popover = $("#analysisTrendAccountPopover");
    if (popover && !popover.hidden) {
      popover.hidden = true;
      renderAnalysisTrendControls();
    }
  });
  $("#assetTreemap").addEventListener("click", (event) => {
    const backButton = event.target.closest("#treemapBack");
    if (backButton) {
      hideTreemapTooltip();
      selectedTreemapGroup = null;
      renderAnalysis();
      return;
    }
    const tile = event.target.closest("[data-treemap-group]");
    if (tile) {
      hideTreemapTooltip();
      selectedTreemapGroup = tile.dataset.treemapGroup || null;
      renderAnalysis();
      return;
    }
    const detailTile = event.target.closest("[data-treemap-detail]");
    if (detailTile) {
      showTreemapTooltip(detailTile);
      return;
    }
    if (!event.target.closest(".treemap-tooltip")) hideTreemapTooltip();
  });
  $("#assetTreemap").addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    const groupTile = event.target.closest("[data-treemap-group]");
    const detailTile = event.target.closest("[data-treemap-detail]");
    if (!groupTile && !detailTile) return;
    event.preventDefault();
    if (groupTile) {
      hideTreemapTooltip();
      selectedTreemapGroup = groupTile.dataset.treemapGroup || null;
      renderAnalysis();
    } else {
      showTreemapTooltip(detailTile);
    }
  });
  $("#healthCards").addEventListener("click", (event) => {
    const card = event.target.closest("[data-health-detail]");
    if (!card) return;
    openHealthDetail(card.dataset.healthDetail);
  });
  $("#healthCards").addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    const card = event.target.closest("[data-health-detail]");
    if (!card) return;
    event.preventDefault();
    openHealthDetail(card.dataset.healthDetail);
  });
  $("#configureHealthDetail").addEventListener("click", () => {
    activeHealthScopeKind = activeHealthDetailKind || "liability";
    openSettingsSheet("healthScopeSheet");
  });
  $("#addCustomHealthCard").addEventListener("click", () => {
    const newId = id();
    activeHealthScopeKind = `${CUSTOM_HEALTH_CARD_PREFIX}${newId}`;
    activeHealthDetailKind = activeHealthScopeKind;
    openSettingsSheet("healthScopeSheet");
  });
  $("#closeHealthDetail").addEventListener("click", closeHealthDetailSheet);
  $("#healthDetailSheet").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeHealthDetailSheet();
  });
  $("#openHistoricalReportPicker").addEventListener("click", () => openSnapshotHistorySheet("report"));
  $("#closeHistoricalReport").addEventListener("click", closeHistoricalReportSheet);
  $("#historicalReportSheet").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeHistoricalReportSheet();
  });
  $("#exportHistoricalReportHtml").addEventListener("click", exportHistoricalReport);
  $("#historicalReportContent").addEventListener("click", (event) => {
    const backButton = event.target.closest("#reportTreemapBack");
    if (backButton) {
      hideReportTreemapTooltip();
      selectedReportTreemapGroup = null;
      renderHistoricalReport();
      return;
    }
    const tile = event.target.closest("[data-report-treemap-group]");
    if (tile) {
      hideReportTreemapTooltip();
      selectedReportTreemapGroup = tile.dataset.reportTreemapGroup || null;
      renderHistoricalReport();
      return;
    }
    const detailTile = event.target.closest("[data-report-treemap-detail]");
    if (detailTile) {
      showTreemapTooltip(detailTile);
      return;
    }
    if (!event.target.closest(".treemap-tooltip")) hideReportTreemapTooltip();
  });
  $("#historicalReportContent").addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    const groupTile = event.target.closest("[data-report-treemap-group]");
    const detailTile = event.target.closest("[data-report-treemap-detail]");
    if (!groupTile && !detailTile) return;
    event.preventDefault();
    if (groupTile) {
      hideReportTreemapTooltip();
      selectedReportTreemapGroup = groupTile.dataset.reportTreemapGroup || null;
      renderHistoricalReport();
    } else {
      showTreemapTooltip(detailTile);
    }
  });

  $("#openAccountForm").addEventListener("click", () => {
    resetAccountForm();
    openAccountSheet();
  });
  $("#toggleAccountSort").addEventListener("click", () => {
    accountSortMode = !accountSortMode;
    renderAccounts();
  });
  $("#toggleOverviewAccountSort").addEventListener("click", () => {
    overviewAccountSortMode = !overviewAccountSortMode;
    renderDashboard();
  });
  $("#toggleOverviewGroups").addEventListener("click", () => {
    const total = snapshotTotal(latestSnapshot());
    const groups = total.accounts
      .filter((row) => !row.account.archived && (row.account.includeInNetWorth !== false || row.raw !== 0))
      .map((row) => row.account)
      .map((account) => accountGroupName(account));
    const uniqueGroups = [...new Set(groups)];
    const allGroupsCollapsed = uniqueGroups.length > 0 && uniqueGroups.every((group) => collapsedOverviewGroups.has(group));
    if (allGroupsCollapsed) {
      collapsedOverviewGroups.clear();
    } else {
      uniqueGroups.forEach((group) => collapsedOverviewGroups.add(group));
    }
    overviewGroupsInitialized = true;
    renderDashboard();
  });
  $("#toggleSnapshotLimit").addEventListener("click", () => {
    showAllSnapshots = !showAllSnapshots;
    renderSnapshots();
  });
  $("#toggleSnapshotHistoryView").addEventListener("click", () => {
    snapshotHistoryView = snapshotHistoryView === "calendar" ? "list" : "calendar";
    renderSnapshots();
  });
  $("#selectFilteredSnapshots").addEventListener("click", () => {
    const filtered = filteredSnapshotsSorted();
    if (selectedSnapshotIds.size) selectedSnapshotIds.clear();
    else filtered.forEach((snapshot) => selectedSnapshotIds.add(snapshot.id));
    renderSnapshots();
  });
  $("#snapshotList").addEventListener("change", (event) => {
    const select = event.target.closest("#snapshotHistoryCalendarMonth");
    if (!select) return;
    snapshotHistoryCalendarMonth = select.value;
    renderSnapshots();
  });
  $("#snapshotList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-history-calendar-step]");
    if (!button) return;
    const months = snapshotHistoryCalendarMonths(filteredSnapshotsSorted());
    const current = snapshotHistoryCalendarMonthValue(filteredSnapshotsSorted());
    const index = months.indexOf(current);
    if (index < 0) return;
    const nextIndex = button.dataset.historyCalendarStep === "prev" ? index + 1 : index - 1;
    if (nextIndex < 0 || nextIndex >= months.length) return;
    snapshotHistoryCalendarMonth = months[nextIndex];
    renderSnapshots();
  });
  $("#snapshotSearchInput").addEventListener("input", (event) => {
    snapshotSearchQuery = event.target.value;
    snapshotHistoryCalendarMonth = "";
    selectedSnapshotIds.clear();
    renderSnapshots();
  });
  $("#snapshotDateFrom").addEventListener("change", (event) => {
    snapshotDateFrom = event.target.value;
    snapshotHistoryCalendarMonth = "";
    selectedSnapshotIds.clear();
    renderSnapshots();
  });
  $("#snapshotDateTo").addEventListener("change", (event) => {
    snapshotDateTo = event.target.value;
    snapshotHistoryCalendarMonth = "";
    selectedSnapshotIds.clear();
    renderSnapshots();
  });
  $("#snapshotTagFilterList").addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-filter-snapshot-tag]");
    if (!checkbox) return;
    if (checkbox.checked) selectedSnapshotTagFilters.add(checkbox.dataset.filterSnapshotTag);
    else selectedSnapshotTagFilters.delete(checkbox.dataset.filterSnapshotTag);
    snapshotHistoryCalendarMonth = "";
    selectedSnapshotIds.clear();
    renderSnapshots();
  });
  $("#clearSnapshotFilters").addEventListener("click", () => {
    snapshotSearchQuery = "";
    snapshotDateFrom = "";
    snapshotDateTo = "";
    selectedSnapshotTagFilters.clear();
    snapshotHistoryCalendarMonth = "";
    selectedSnapshotIds.clear();
    renderSnapshots();
  });
  $("#toggleSnapshotManage").addEventListener("click", () => {
    snapshotManageMode = !snapshotManageMode;
    selectedSnapshotIds.clear();
    renderSnapshots();
  });
  $("#deleteSelectedSnapshots").addEventListener("click", async () => {
    const selected = state.snapshots
      .filter((snapshot) => selectedSnapshotIds.has(snapshot.id))
      .sort((a, b) => b.date.localeCompare(a.date));
    if (!selected.length) return;
    const selectedDates = selected.map((snapshot) => snapshot.date);
    const dateSummary = `${selectedDates[selectedDates.length - 1]} → ${selectedDates[0]}`;
    const previewDates = selectedDates.slice(0, 12).join("、");
    const restText = selectedDates.length > 12 ? `\n另有 ${selectedDates.length - 12} 条未列出。` : "";
    const ok = await confirmDialog(`确定删除选中的 ${selected.length} 条历史快照吗？\n\n范围：${dateSummary}\n${previewDates}${restText}\n\n删除后无法恢复。`, {
      title: "删除历史快照",
      confirmText: "删除",
      variant: "danger",
    });
    if (!ok) return;
    state.snapshots = state.snapshots.filter((snapshot) => !selectedSnapshotIds.has(snapshot.id));
    selectedSnapshotIds.clear();
    snapshotManageMode = false;
    saveState();
    renderAll();
  });
  $("#openSnapshotForm").addEventListener("click", () => openSnapshotSheet());
  $("#dashboardOpenSnapshotForm")?.addEventListener("click", () => openSnapshotSheet());
  $("#mobileOpenSnapshotForm")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openSnapshotSheet();
  });
  $("#dashboardOpenAccountForm")?.addEventListener("click", () => {
    resetAccountForm();
    openAccountSheet();
  });
  $("#dashboardOpenSnapshotHistory")?.addEventListener("click", () => openSnapshotHistorySheet());
  $("#closeSnapshotForm").addEventListener("click", closeSnapshotSheet);
  $("#cancelSnapshotForm").addEventListener("click", closeSnapshotSheet);
  $("#snapshotDate").addEventListener("change", () => {
    snapshotInlineTagAdding = false;
    snapshotInlineTagDraft = "";
    renderSnapshotForm();
  });
  $("#openSnapshotRates").addEventListener("click", openSnapshotRateDialog);
  $("#applySnapshotRates").addEventListener("click", () => closeSnapshotRateDialog({ apply: true }));
  $("#cancelSnapshotRates").addEventListener("click", () => closeSnapshotRateDialog());
  $("#closeSnapshotRates").addEventListener("click", () => closeSnapshotRateDialog());
  $("#snapshotRateDialog").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeSnapshotRateDialog();
  });
  $("#snapshotSheet").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeSnapshotSheet();
  });
  $("#snapshotTagChoices").addEventListener("click", async (event) => {
    if (event.target.closest("[data-start-snapshot-tag-add]")) {
      snapshotInlineTagAdding = true;
      snapshotInlineTagDraft = "";
      rerenderSnapshotTagChoicesWithCurrentSelection();
      return;
    }
    if (event.target.closest("[data-cancel-snapshot-tag]")) {
      snapshotInlineTagAdding = false;
      snapshotInlineTagDraft = "";
      rerenderSnapshotTagChoicesWithCurrentSelection();
      return;
    }
    if (event.target.closest("[data-save-snapshot-tag]")) {
      await saveInlineSnapshotTag();
    }
  });
  $("#snapshotTagChoices").addEventListener("input", (event) => {
    if (event.target.matches("[data-snapshot-tag-input]")) {
      snapshotInlineTagDraft = event.target.value;
    }
  });
  $("#snapshotTagChoices").addEventListener("keydown", async (event) => {
    if (!event.target.matches("[data-snapshot-tag-input]")) return;
    if (event.key === "Enter") {
      event.preventDefault();
      await saveInlineSnapshotTag();
    } else if (event.key === "Escape") {
      event.preventDefault();
      snapshotInlineTagAdding = false;
      snapshotInlineTagDraft = "";
      rerenderSnapshotTagChoicesWithCurrentSelection();
    }
  });
  $("#openSnapshotHistory").addEventListener("click", openSnapshotHistorySheet);
  $("#closeSnapshotHistory").addEventListener("click", closeSnapshotHistorySheet);
  $("#snapshotHistorySheet").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeSnapshotHistorySheet();
  });

  $("#closeAccountForm").addEventListener("click", closeAccountSheet);
  $("#accountSheet").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeAccountSheet();
  });
  $$('[data-open-sheet]').forEach((button) => {
    button.addEventListener("click", () => openSettingsSheet(button.dataset.openSheet));
  });
  $("#openFeatureIntro").addEventListener("click", () => {
    alertDialog(
      `资产快照本用于手动记录各账户在某一天的余额，帮助你查看净值、资产、负债和分组变化。\n\n当前支持账户管理、余额快照、历史快照、标签备注、本地备份导入，以及基础货币和汇率设置。\n\n所有数据保存在本机浏览器中，建议定期导出 JSON 备份。\n\n当前版本：${APP_VERSION}`,
      { title: "功能介绍" }
    );
  });
  $$('[data-close-sheet]').forEach((button) => {
    button.addEventListener("click", async () => closeSettingsSheet(button.closest(".sheet-backdrop")));
  });
  $$(".settings-sheet-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", async (event) => {
      if (event.target === backdrop) await closeSettingsSheet(backdrop);
    });
  });
  document.addEventListener("keydown", async (event) => {
    if (event.key !== "Escape") return;
    if (!$("#importPreview").hidden) {
      clearImportPreview();
      setBackupStatus("已取消导入。");
      return;
    }
    if (!$("#snapshotRateDialog").hidden) {
      closeSnapshotRateDialog();
      return;
    }
    const settingsSheet = $(".settings-sheet-backdrop:not([hidden])");
    if (settingsSheet) await closeSettingsSheet(settingsSheet);
    else if (!$("#historicalReportSheet").hidden) closeHistoricalReportSheet();
    else if (!$("#healthDetailSheet").hidden) closeHealthDetailSheet();
    else if (!$("#snapshotSheet").hidden) closeSnapshotSheet();
    else if (!$("#snapshotHistorySheet").hidden) closeSnapshotHistorySheet();
    else if (!$("#accountSheet").hidden) closeAccountSheet();
  });
  document.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key) || isGroupHeadingAction(event.target)) return;
    const overviewGroupToggle = event.target.closest("[data-toggle-account-group]");
    const accountGroupToggle = event.target.closest("[data-toggle-account-list-group]");
    if (!overviewGroupToggle && !accountGroupToggle) return;
    event.preventDefault();
    if (overviewGroupToggle) {
      toggleCollapsedValue(collapsedOverviewGroups, overviewGroupToggle.dataset.toggleAccountGroup);
      renderDashboard();
      return;
    }
    toggleCollapsedValue(collapsedAccountGroups, accountGroupToggle.dataset.toggleAccountListGroup);
    renderAccounts();
  });

  $("#accountForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const account = normalizeAccount({
      id: editingAccountId || id(),
      name: data.get("name").trim(),
      type: data.get("type"),
      group: data.get("group").trim() || "未分组",
      currency: data.get("currency"),
      costBasis: data.get("costBasis").trim() === "" ? "" : Number(data.get("costBasis")),
      note: data.get("note").trim(),
      includeInNetWorth: data.get("includeInNetWorth") === "on",
      archived: data.get("archived") === "on",
    });
    if (editingAccountId) {
      const index = state.accounts.findIndex((item) => item.id === editingAccountId);
      state.accounts[index] = { ...state.accounts[index], ...account };
    } else {
      state.accounts.push(account);
    }
    const accountRateText = String(data.get("accountRate") || "").trim();
    if (account.currency !== state.settings.baseCurrency && accountRateText !== "") {
      const accountRate = Number(accountRateText);
      if (accountRate > 0) setRelativeRate(state.settings.rates, account.currency, accountRate);
    }
    const currentBalanceText = data.get("currentBalance").trim();
    const costBasisText = data.get("costBasis").trim();
    const costBasisInitial = editingAccountCostInitial;
    if (currentBalanceText !== "" && (currentBalanceText !== editingAccountBalanceInitial || costBasisText !== costBasisInitial)) {
      upsertSnapshot(localDateString(), account.id, Number(currentBalanceText), costBasisText);
    }
    saveState();
    resetAccountForm();
    closeAccountSheet();
    renderAll();
  });

  $("#cancelAccountEdit").addEventListener("click", closeAccountSheet);
  $("#accountCurrency").addEventListener("change", renderAccountRateField);

  $("#customCurrencyForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const code = data.get("code").trim().toUpperCase();
    const name = data.get("name").trim();
    const symbol = data.get("symbol").trim();
    if (!/^[A-Z0-9]{2,6}$/.test(code)) {
      await alertDialog("货币代码请使用 2 至 6 位大写字母或数字。");
      return;
    }
    const builtInCurrency = currencies.find((item) => item.code === code);
    if (builtInCurrency && (state.settings.deletedCurrencyCodes || []).includes(code)) {
      state.settings.deletedCurrencyCodes = (state.settings.deletedCurrencyCodes || []).filter((item) => item !== code);
      state.settings.enabledCurrencies = [...new Set([...(state.settings.enabledCurrencies || []), code])];
      state.settings.rates[code] = state.settings.rates[code] || builtInCurrency.rate || 1;
      saveState();
      event.currentTarget.reset();
      renderAll();
      setCurrencyConfigStatus(`已恢复内置货币 ${code}。`);
      return;
    }
    if ([...currencies, ...(state.settings.customCurrencies || [])].some((item) => item.code === code)) {
      await alertDialog(`货币 ${code} 已经存在。`);
      return;
    }
    state.settings.customCurrencies.push({ code, name, symbol, rate: 1 });
    state.settings.enabledCurrencies.push(code);
    state.settings.rates[code] = 1;
    saveState();
    event.currentTarget.reset();
    renderAll();
  });

  $("#toggleCurrencyManage").addEventListener("click", () => {
    currencyManageMode = !currencyManageMode;
    selectedCurrencyCodes.clear();
    renderCurrencyOptions();
  });
  $("#currencyChoices").addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-select-currency]");
    if (!checkbox) return;
    if (checkbox.checked) selectedCurrencyCodes.add(checkbox.dataset.selectCurrency);
    else selectedCurrencyCodes.delete(checkbox.dataset.selectCurrency);
    renderCurrencyOptions();
  });
  $("#deleteSelectedCurrencies").addEventListener("click", async () => {
    const selected = [...selectedCurrencyCodes];
    if (!selected.length) return;
    const blockers = selected.flatMap((code) => {
      if (code === state.settings.baseCurrency) return [`${code}：当前主货币`];
      const usedAccounts = state.accounts.filter((account) => account.currency === code);
      return usedAccounts.length ? [`${code}：${usedAccounts.map((account) => account.name).join("、")}`] : [];
    });
    if (blockers.length) {
      await alertDialog(`以下货币正在使用或为主货币，无法删除：\n\n${blockers.map((item) => `• ${item}`).join("\n")}\n\n如需删除，请先调整相关账户或主货币。`, {
        title: "无法删除货币",
      });
      return;
    }
    const ok = await confirmDialog(`确定删除选中的 ${selected.length} 个货币吗？\n\n${selected.join("、")}\n\n删除后会从可用货币和汇率中移除。`, {
      title: "删除货币",
      confirmText: "删除",
      variant: "danger",
    });
    if (!ok) return;
    state.settings.enabledCurrencies = (state.settings.enabledCurrencies || []).filter((item) => !selected.includes(item));
    state.settings.customCurrencies = (state.settings.customCurrencies || []).filter((item) => !selected.includes(item.code));
    const builtInDeleted = selected.filter((code) => currencies.some((item) => item.code === code));
    state.settings.deletedCurrencyCodes = [...new Set([...(state.settings.deletedCurrencyCodes || []), ...builtInDeleted])];
    selected.forEach((code) => delete state.settings.rates[code]);
    selectedCurrencyCodes.clear();
    currencyManageMode = false;
    saveState();
    renderAll();
    setCurrencyConfigStatus(`已删除 ${selected.length} 个货币。`);
  });

  $("#typeGroupForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!typeDraft) return;
    syncTypeDraftFromInputs();
    typeDraft.push({
      id: `group-${id()}`,
      name: data.get("name").trim(),
      kind: "asset",
      types: [],
    });
    typeDraftDirty = true;
    event.currentTarget.reset();
    renderTypeManager();
  });

  $("#typeItemForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!typeDraft) return;
    syncTypeDraftFromInputs();
    const group = typeDraft.find((item) => item.id === data.get("groupId"));
    if (!group) return;
    group.types.push({ id: `type-${id()}`, name: data.get("name").trim() });
    typeDraftDirty = true;
    event.currentTarget.reset();
    renderTypeManager();
  });

  $("#tagItemForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!tagDraft) return;
    syncTagDraftFromInputs();
    const name = data.get("name").trim();
    if (!name) return;
    if (tagDraft.includes(name)) {
      await alertDialog(`标签“${name}”已经存在。`);
      return;
    }
    tagDraft.push(name);
    tagDraftDirty = true;
    event.currentTarget.reset();
    renderTagManager();
  });

  $("#accountTypeManager").addEventListener("input", () => {
    syncTypeDraftFromInputs();
    typeDraftDirty = true;
  });
  $("#healthScopeManager").addEventListener("change", (event) => {
    let draft = activeHealthScopeDraft();
    if (!draft) return;
    const accountCheckbox = event.target.closest("[data-health-account-scope-account]");
    if (accountCheckbox) {
      setAccountScopeChecked(draft, [accountCheckbox.dataset.healthAccountScopeAccount], accountCheckbox.checked);
      setActiveHealthScopeDraft(draft);
      healthScopeDraftDirty = true;
      renderHealthScopeManagerKeepingScroll();
      return;
    }
    const accountScopeGroupCheckbox = event.target.closest("[data-health-account-scope-group]");
    if (accountScopeGroupCheckbox) {
      const groupName = accountScopeGroupCheckbox.dataset.healthAccountScopeGroup;
      const accountIds = state.accounts
        .filter((account) => {
          const currentGroupName = customHealthAccountViewMode === "account"
            ? "\u5168\u90e8\u8d26\u6237"
            : customHealthAccountViewMode === "type"
              ? healthTypeGroupNameForAccount(account)
              : accountGroupName(account);
          return currentGroupName === groupName;
        })
        .map((account) => account.id);
      setAccountScopeChecked(draft, accountIds, accountScopeGroupCheckbox.checked);
      setActiveHealthScopeDraft(draft);
      healthScopeDraftDirty = true;
      renderHealthScopeManagerKeepingScroll();
      return;
    }
    const accountGroupCheckbox = event.target.closest("[data-health-account-group]");
    if (accountGroupCheckbox) {
      const groupName = accountGroupCheckbox.dataset.healthAccountGroup;
      if (accountGroupCheckbox.checked) {
        draft.excludedAccountGroupNames = (draft.excludedAccountGroupNames || []).filter((item) => item !== groupName);
      } else if (!(draft.excludedAccountGroupNames || []).includes(groupName)) {
        draft.excludedAccountGroupNames = [...(draft.excludedAccountGroupNames || []), groupName];
      }
      healthScopeDraftDirty = true;
      renderHealthScopeManagerKeepingScroll();
      return;
    }
    const groupCheckbox = event.target.closest("[data-health-scope-group]");
    if (groupCheckbox) {
      const groupId = groupCheckbox.dataset.healthScopeGroup;
      const group = typeGroups().find((item) => item.id === groupId);
      if (!group) return;
      if (groupCheckbox.checked) {
        draft.excludedGroupIds = draft.excludedGroupIds.filter((item) => item !== groupId);
        draft.excludedTypeIds = draft.excludedTypeIds.filter((item) => !group.types.some((type) => type.id === item));
      } else {
        if (!draft.excludedGroupIds.includes(groupId)) draft.excludedGroupIds.push(groupId);
        draft.excludedTypeIds = [...new Set([
          ...draft.excludedTypeIds,
          ...group.types.map((type) => type.id),
        ])];
      }
      healthScopeDraftDirty = true;
      renderHealthScopeManagerKeepingScroll();
      return;
    }
    const typeCheckbox = event.target.closest("[data-health-scope-type]");
    if (!typeCheckbox) return;
    const typeId = typeCheckbox.dataset.healthScopeType;
    if (typeCheckbox.checked) {
      draft.excludedTypeIds = draft.excludedTypeIds.filter((item) => item !== typeId);
    } else if (!draft.excludedTypeIds.includes(typeId)) {
      draft.excludedTypeIds.push(typeId);
    }
    healthScopeDraftDirty = true;
    renderHealthScopeManagerKeepingScroll();
  });
  $("#customHealthName").addEventListener("input", (event) => {
    if (!customHealthDraft) return;
    customHealthDraft.name = event.target.value;
    healthScopeDraftDirty = true;
    renderHealthScopeManager();
  });
  $("#customHealthNote").addEventListener("input", (event) => {
    if (!customHealthDraft) return;
    customHealthDraft.note = event.target.value;
    healthScopeDraftDirty = true;
  });
  $("#customHealthScopeTabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-custom-health-scope-part]");
    if (!button || !healthCardUsesDenominatorScope(activeHealthScopeKind)) return;
    activeCustomHealthScopePart = button.dataset.customHealthScopePart === "denominator" ? "denominator" : "numerator";
    renderHealthScopeManager();
  });
  $("#customHealthAccountView").addEventListener("change", (event) => {
    customHealthAccountViewMode = ["account", "type"].includes(event.target.value) ? event.target.value : "group";
    renderHealthScopeManager();
  });
  $("#customHealthBasisTabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-custom-health-basis]");
    if (!button || !customHealthDraft) return;
    const basis = button.dataset.customHealthBasis === "cost" ? "cost" : "balance";
    if (activeCustomHealthScopePart === "denominator") customHealthDraft.denominatorBasis = basis;
    else customHealthDraft.numeratorBasis = basis;
    healthScopeDraftDirty = true;
    renderHealthScopeManager();
  });
  $("#deleteHealthDetailCard").addEventListener("click", async () => {
    await deleteCustomHealthCardByKey(activeHealthDetailKind);
  });
  $("#snapshotTagManager").addEventListener("input", () => {
    syncTagDraftFromInputs();
    tagDraftDirty = true;
  });
  $("#snapshotList").addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-select-snapshot]");
    if (!checkbox) return;
    if (checkbox.checked) selectedSnapshotIds.add(checkbox.dataset.selectSnapshot);
    else selectedSnapshotIds.delete(checkbox.dataset.selectSnapshot);
    renderSnapshots();
  });
  $("#snapshotList").addEventListener("change", (event) => {
    const monthCheckbox = event.target.closest("[data-select-snapshot-month]");
    if (!monthCheckbox) return;
    const month = monthCheckbox.dataset.selectSnapshotMonth;
    const monthSnapshots = state.snapshots.filter((snapshot) => snapshot.date.startsWith(`${month}-`));
    if (monthCheckbox.checked) monthSnapshots.forEach((snapshot) => selectedSnapshotIds.add(snapshot.id));
    else monthSnapshots.forEach((snapshot) => selectedSnapshotIds.delete(snapshot.id));
    renderSnapshots();
  });
  $("#snapshotList").addEventListener("click", (event) => {
    if (!event.target.closest("[data-month-checkbox-wrapper]")) return;
    event.stopPropagation();
  }, true);
  $("#snapshotList").addEventListener("click", async (event) => {
    if (snapshotManageMode) return;
    const row = event.target.closest("[data-edit-snapshot]");
    if (!row) return;
    if (snapshotHistoryMode === "report") {
      const snapshot = state.snapshots.find((item) => item.id === row.dataset.editSnapshot);
      if (!snapshot) return;
      const ok = await appDialog({
        title: "\u5386\u53f2\u5206\u6790\u62a5\u544a",
        message: `\u4f7f\u7528 ${snapshot.date} \u7684\u5feb\u7167\u751f\u6210\u5386\u53f2\u5206\u6790\u62a5\u544a\uff1f`,
        confirmText: "\u67e5\u770b\u5386\u53f2\u62a5\u544a",
        cancelText: "\u53d6\u6d88",
      });
      if (!ok) return;
      closeSnapshotHistorySheet();
      openHistoricalReport(snapshot.id);
      return;
    }
    closeSnapshotHistorySheet();
    openSnapshotSheet(row.dataset.editSnapshot);
  });
  $("#snapshotList").addEventListener("toggle", (event) => {
    const group = event.target.closest(".snapshot-month-group");
    if (!group?.dataset.snapshotMonth) return;
    if (group.open) openSnapshotMonths.add(group.dataset.snapshotMonth);
    else openSnapshotMonths.delete(group.dataset.snapshotMonth);
  }, true);
  $("#toggleTypeManage").addEventListener("click", () => {
    typeManageMode = !typeManageMode;
    selectedTypeGroupIds.clear();
    selectedTypeIds.clear();
    renderTypeManager();
  });
  $("#accountTypeManager").addEventListener("change", (event) => {
    const groupCheckbox = event.target.closest("[data-select-type-group]");
    if (groupCheckbox) {
      if (groupCheckbox.checked) selectedTypeGroupIds.add(groupCheckbox.dataset.selectTypeGroup);
      else selectedTypeGroupIds.delete(groupCheckbox.dataset.selectTypeGroup);
      renderTypeManager();
      return;
    }
    const typeCheckbox = event.target.closest("[data-select-type]");
    if (!typeCheckbox) return;
    if (typeCheckbox.checked) selectedTypeIds.add(typeCheckbox.dataset.selectType);
    else selectedTypeIds.delete(typeCheckbox.dataset.selectType);
    renderTypeManager();
  });
  $("#deleteSelectedTypes").addEventListener("click", async () => {
    if (!typeDraft) return;
    syncTypeDraftFromInputs();
    const selectedGroups = typeDraft.filter((group) => selectedTypeGroupIds.has(group.id));
    const selectedTypes = typeDraft.flatMap((group) =>
      group.types
        .filter((type) => selectedTypeIds.has(type.id) && !selectedTypeGroupIds.has(group.id))
        .map((type) => ({ group, type }))
    );
    if (!selectedGroups.length && !selectedTypes.length) return;
    const selectedGroupTypeIds = new Set(selectedGroups.flatMap((group) => group.types.map((type) => type.id)));
    const blocked = [
      ...selectedGroups.flatMap((group) => {
        const usedAccounts = state.accounts.filter((account) => group.types.some((type) => type.id === account.type));
        return usedAccounts.length ? [`大类“${group.name}”：${usedAccounts.map((account) => account.name).join("、")}`] : [];
      }),
      ...selectedTypes.flatMap(({ type }) => {
        if (selectedGroupTypeIds.has(type.id)) return [];
        const usedAccounts = state.accounts.filter((account) => account.type === type.id);
        return usedAccounts.length ? [`小类“${type.name}”：${usedAccounts.map((account) => account.name).join("、")}`] : [];
      }),
    ];
    if (blocked.length) {
      await alertDialog(`以下账户类型正在使用，无法删除：\n\n${blocked.map((item) => `• ${item}`).join("\n")}\n\n如需删除，请先到账户页面调整这些账户的类型。`, {
        title: "无法删除账户类型",
      });
      return;
    }
    if (typeDraft.length - selectedGroups.length < 1) {
      await alertDialog("至少需要保留一个账户类型大类。");
      return;
    }
    const names = [
      ...selectedGroups.map((group) => `大类“${group.name}”`),
      ...selectedTypes.map(({ type }) => `小类“${type.name}”`),
    ];
    const ok = await confirmDialog(`确定删除选中的 ${names.length} 项账户类型吗？\n\n${names.join("、")}\n\n删除后需点击“保存修改”才会正式生效。`, {
      title: "删除账户类型",
      confirmText: "删除",
      variant: "danger",
    });
    if (!ok) return;
    typeDraft = typeDraft
      .filter((group) => !selectedTypeGroupIds.has(group.id))
      .map((group) => ({
        ...group,
        types: group.types.filter((type) => !selectedTypeIds.has(type.id)),
      }));
    selectedTypeGroupIds.clear();
    selectedTypeIds.clear();
    typeManageMode = false;
    typeDraftDirty = true;
    renderTypeManager();
  });

  $("#toggleTagManage").addEventListener("click", () => {
    tagManageMode = !tagManageMode;
    selectedTagNames.clear();
    renderTagManager();
  });
  $("#selectAllHealthScope").addEventListener("click", () => {
    const scope = isCustomHealthCardKey(activeHealthScopeKind)
      ? { scopeVersion: 2, excludedGroupIds: [], excludedTypeIds: [], excludedAccountGroupNames: [], excludedAccountIds: [] }
      : { scopeVersion: 2, excludedGroupIds: [], excludedTypeIds: [], excludedAccountGroupNames: [], excludedAccountIds: [] };
    setActiveHealthScopeDraft(scope);
    healthScopeDraftDirty = true;
    renderHealthScopeManagerKeepingScroll();
  });
  $("#resetHealthScope").addEventListener("click", () => {
    const isDenominator = activeCustomHealthScopePart === "denominator" && healthCardUsesDenominatorScope(activeHealthScopeKind);
    const defaultKey = isDenominator ? "custom" : activeHealthScopeKind;
    const scope = defaultHealthScopeForCard(defaultKey, typeGroups());
    setActiveHealthScopeDraft(scopeWithAccountSelection(scope));
    healthScopeDraftDirty = true;
    renderHealthScopeManagerKeepingScroll();
  });
  $("#saveHealthScope").addEventListener("click", saveHealthScopeDraft);
  $("#discardHealthScope").addEventListener("click", () => closeSettingsSheet($("#healthScopeSheet")));
  $("#snapshotTagManager").addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-select-tag]");
    if (!checkbox) return;
    if (checkbox.checked) selectedTagNames.add(checkbox.dataset.selectTag);
    else selectedTagNames.delete(checkbox.dataset.selectTag);
    renderTagManager();
  });
  $("#deleteSelectedTags").addEventListener("click", async () => {
    if (!tagDraft) return;
    syncTagDraftFromInputs();
    const selected = [...selectedTagNames].filter((tag) => tagDraft.includes(tag));
    if (!selected.length) return;
    const used = selected.filter((tag) => state.snapshots.some((snapshot) => (snapshot.tags || []).includes(tag)));
    const message = used.length
      ? `以下标签已有历史快照正在使用：\n\n${used.join("、")}\n\n删除后会从这些历史快照中移除对应标签，确定继续删除吗？`
      : `确定删除选中的 ${selected.length} 个标签吗？\n\n${selected.join("、")}`;
    const ok = await confirmDialog(message, {
      title: "删除快照标签",
      confirmText: "删除",
      variant: "danger",
    });
    if (!ok) return;
    tagDraft = tagDraft.filter((tag) => !selected.includes(tag));
    selectedTagNames.clear();
    tagManageMode = false;
    tagDraftDirty = true;
    renderTagManager();
  });

  $("#saveTagChanges").addEventListener("click", async () => {
    if (!(await saveTagDraft())) return;
    await closeSettingsSheet($("#tagSettingsSheet"));
  });
  $("#discardTagChanges").addEventListener("click", async () => {
    if (tagDraftDirty && !(await confirmDialog("确定放弃快照标签的全部未保存修改吗？", { title: "放弃修改" }))) return;
    tagDraftDirty = false;
    tagDraft = null;
    closeSettingsSheet($("#tagSettingsSheet"));
  });

  $("#saveTypeChanges").addEventListener("click", async () => {
    if (!(await saveTypeDraft())) return;
    await closeSettingsSheet($("#typeSettingsSheet"));
  });
  $("#discardTypeChanges").addEventListener("click", async () => {
    if (typeDraftDirty && !(await confirmDialog("确定放弃账户类型的全部未保存修改吗？", { title: "放弃修改" }))) return;
    typeDraftDirty = false;
    typeDraft = null;
    closeSettingsSheet($("#typeSettingsSheet"));
  });

  document.addEventListener("click", async (event) => {
    const accountButton = event.target.closest("[data-delete-account]");
    if (accountButton) {
      const accountId = accountButton.dataset.deleteAccount;
      const account = state.accounts.find((item) => item.id === accountId);
      const ok = await confirmDialog(`确定删除账户“${account?.name || ""}”吗？该账户的历史余额也会一并删除。`, {
        title: "删除账户",
        confirmText: "删除",
        variant: "danger",
      });
      if (!ok) return;
      state.accounts = state.accounts.filter((account) => account.id !== accountId);
      state.snapshots.forEach((snapshot) => {
        delete snapshot.balances[accountId];
        delete snapshot.costs?.[accountId];
      });
      saveState();
      if (!$("#accountSheet").hidden) closeAccountSheet();
      renderAll();
    }

    const editButton = event.target.closest("[data-edit-account]");
    if (editButton) startAccountEdit(editButton.dataset.editAccount);

    const startGroupEditButton = event.target.closest("[data-start-account-group-edit]");
    if (startGroupEditButton) {
      editingAccountGroupName = startGroupEditButton.dataset.startAccountGroupEdit;
      renderAccounts();
      requestAnimationFrame(() => {
        const input = $(`[data-editing-account-group="${CSS.escape(editingAccountGroupName)}"]`);
        input?.focus();
        input?.select();
      });
    }

    const cancelGroupEditButton = event.target.closest("[data-cancel-account-group-edit]");
    if (cancelGroupEditButton) {
      editingAccountGroupName = null;
      renderAccounts();
    }

    const editGroupButton = event.target.closest("[data-save-account-group]");
    if (editGroupButton) {
      const oldName = editGroupButton.dataset.saveAccountGroup;
      const input = $(`[data-editing-account-group="${CSS.escape(oldName)}"]`);
      const normalizedName = input?.value.trim() || "";
      if (!normalizedName) {
        await alertDialog("分组名不能为空。");
        return;
      }
      const groupNames = [...new Set(state.accounts.map(accountGroupName))];
      if (normalizedName !== oldName && groupNames.includes(normalizedName)) {
        await alertDialog(`分组名“${normalizedName}”已存在，请使用其它名称。`);
        return;
      }
      if (renameAccountGroup(oldName, normalizedName)) {
        editingAccountGroupName = null;
        saveState();
        renderAll();
      } else {
        editingAccountGroupName = null;
        renderAccounts();
      }
    }

    const archiveButton = event.target.closest("[data-toggle-archive]");
    if (archiveButton) {
      const account = state.accounts.find((item) => item.id === archiveButton.dataset.toggleArchive);
      account.archived = !account.archived;
      saveState();
      renderAll();
    }

    const overviewGroupToggle = event.target.closest("[data-toggle-account-group]");
    if (overviewGroupToggle && !isGroupHeadingAction(event.target)) {
      toggleCollapsedValue(collapsedOverviewGroups, overviewGroupToggle.dataset.toggleAccountGroup);
      renderDashboard();
    }

    const accountGroupToggle = event.target.closest("[data-toggle-account-list-group]");
    if (accountGroupToggle && !isGroupHeadingAction(event.target)) {
      toggleCollapsedValue(collapsedAccountGroups, accountGroupToggle.dataset.toggleAccountListGroup);
      renderAccounts();
    }

  });

  document.addEventListener("dragstart", (event) => {
    const accountHandle = event.target.closest("[data-drag-account]");
    const groupHandle = event.target.closest("[data-drag-group]");
    if (accountHandle) {
      dragPayload = { type: "account", id: accountHandle.dataset.dragAccount, group: accountHandle.dataset.accountGroup };
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", `account:${dragPayload.id}`);
      accountHandle.closest(".draggable-account")?.classList.add("is-dragging");
    } else if (groupHandle) {
      dragPayload = { type: "group", name: groupHandle.dataset.dragGroup };
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", `group:${dragPayload.name}`);
      groupHandle.closest(".draggable-group")?.classList.add("is-dragging");
    }
  });

  document.addEventListener("dragover", (event) => {
    if (!dragPayload) return;
    const target = dragPayload.type === "account" ? event.target.closest("[data-drop-account]") : event.target.closest("[data-drop-group]");
    if (!target) return;
    if (dragPayload.type === "account" && target.dataset.accountGroup !== dragPayload.group) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    target.classList.add("is-drag-over");
  });

  document.addEventListener("dragleave", (event) => {
    event.target.closest(".is-drag-over")?.classList.remove("is-drag-over");
  });

  document.addEventListener("drop", (event) => {
    if (!dragPayload) return;
    if (dragPayload.type === "account") {
      const target = event.target.closest("[data-drop-account]");
      if (!target || target.dataset.accountGroup !== dragPayload.group) return;
      event.preventDefault();
      reorderAccount(dragPayload.id, target.dataset.dropAccount, dropSide(event.clientY, target));
    } else {
      const target = event.target.closest("[data-drop-group]");
      if (!target) return;
      event.preventDefault();
      reorderGroup(dragPayload.name, target.dataset.dropGroup, dropSide(event.clientY, target));
    }
    saveState();
    dragPayload = null;
    renderAll();
  });

  document.addEventListener("dragend", () => {
    dragPayload = null;
    $$(".is-dragging, .is-drag-over").forEach((element) => element.classList.remove("is-dragging", "is-drag-over"));
  });

  document.addEventListener("pointerdown", (event) => {
    const accountHandle = event.target.closest("[data-drag-account]");
    const groupHandle = event.target.closest("[data-drag-group]");
    if (!accountHandle && !groupHandle) return;
    pointerDrag = accountHandle
      ? { type: "account", id: accountHandle.dataset.dragAccount, group: accountHandle.dataset.accountGroup, x: event.clientX, y: event.clientY, active: false, source: accountHandle.closest(".draggable-account") }
      : { type: "group", name: groupHandle.dataset.dragGroup, x: event.clientX, y: event.clientY, active: false, source: groupHandle.closest(".draggable-group") };
    event.target.setPointerCapture?.(event.pointerId);
  });

  document.addEventListener("pointermove", (event) => {
    if (!pointerDrag) return;
    if (!pointerDrag.active && Math.hypot(event.clientX - pointerDrag.x, event.clientY - pointerDrag.y) < 6) return;
    pointerDrag.active = true;
    event.preventDefault();
    pointerDrag.source?.classList.add("is-dragging");
    $$(".is-drag-over").forEach((element) => element.classList.remove("is-drag-over"));
    const underPointer = document.elementFromPoint(event.clientX, event.clientY);
    const target = pointerDrag.type === "account" ? underPointer?.closest("[data-drop-account]") : underPointer?.closest("[data-drop-group]");
    pointerDrag.dropTarget = null;
    if (!target) return;
    if (pointerDrag.type === "account") {
      if (target.dataset.accountGroup !== pointerDrag.group || target.dataset.dropAccount === pointerDrag.id) return;
      pointerDrag.dropTarget = {
        id: target.dataset.dropAccount,
        side: dragPlacement("account", pointerDrag.id, target.dataset.dropAccount),
      };
    } else {
      if (target.dataset.dropGroup === pointerDrag.name) return;
      pointerDrag.dropTarget = {
        name: target.dataset.dropGroup,
        side: dragPlacement("group", pointerDrag.name, target.dataset.dropGroup),
      };
    }
    target.classList.add("is-drag-over");
  }, { passive: false });

  document.addEventListener("pointerup", (event) => {
    if (!pointerDrag) return;
    const current = pointerDrag;
    pointerDrag = null;
    if (!current.active) return;
    event.preventDefault();
    if (current.type === "account" && current.dropTarget) {
      reorderAccount(current.id, current.dropTarget.id, current.dropTarget.side);
    } else if (current.type === "group" && current.dropTarget) {
      reorderGroup(current.name, current.dropTarget.name, current.dropTarget.side);
    }
    saveState();
    renderAll();
  });

  document.addEventListener("pointercancel", () => {
    pointerDrag = null;
    $$(".is-dragging, .is-drag-over").forEach((element) => element.classList.remove("is-dragging", "is-drag-over"));
  });

  $("#snapshotForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveSnapshotFromForm(event.currentTarget);
  });

  $("#snapshotForm button[type='submit']").addEventListener("click", async (event) => {
    const form = event.currentTarget.form;
    if (!form || !form.checkValidity()) return;
    event.preventDefault();
    await saveSnapshotFromForm(form);
  });

  $("#currencyForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const baseCurrency = data.get("baseCurrency");
    const required = state.accounts.map((account) => account.currency);
    state.settings.baseCurrency = baseCurrency;
    state.settings.enabledCurrencies = [...new Set([baseCurrency, ...required, ...data.getAll("enabledCurrency")])];
    saveState();
    renderAll();
    closeSettingsSheet($("#currencySettingsSheet"));
  });

  $("#exportCurrencyConfig").addEventListener("click", () => {
    const ok = download(`asset-currency-settings-${new Date().toISOString().slice(0, 10)}.json`, currencySettingsPayload(), "application/json;charset=utf-8");
    setCurrencyConfigStatus(ok ? "已请求下载货币配置 JSON。" : "货币配置导出失败。", ok ? "success" : "error");
  });

  $("#chooseCurrencyConfig").addEventListener("click", () => {
    setCurrencyConfigStatus("请选择一个货币配置 JSON 文件。");
    $("#importCurrencyConfig").click();
  });

  $("#importCurrencyConfig").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      importCurrencySettingsContent(await readFile(file));
      setCurrencyConfigStatus(`已导入货币配置：${file.name}`);
    } catch (error) {
      console.error("Currency config import failed", error);
      setCurrencyConfigStatus("货币配置导入失败，请确认文件格式正确。", "error");
      await alertDialog("货币配置导入失败，请确认选择的是本应用导出的货币配置 JSON。");
    }
    event.target.value = "";
  });

  $("#rateForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const base = state.settings.baseCurrency;
    const baseRate = Number(state.settings.rates[base] || 1);
    enabledCurrencies().forEach((item) => {
      if (item.code === base) return;
      const relativeRate = Number(data.get(item.code));
      if (relativeRate > 0) state.settings.rates[item.code] = relativeRate * baseRate;
    });
    syncLatestSnapshotRates();
    saveState();
    renderAll();
    closeSettingsSheet($("#rateSettingsSheet"));
  });

  $("#exportJson").addEventListener("click", async () => {
    prepareBackupText(false);
    setBackupStatus("请选择 JSON 备份保存位置，可在保存对话框中修改文件名。");
    const result = await saveTextFile({
      filename: `asset-snapshot-backup-${new Date().toISOString().slice(0, 10)}.json`,
      content: backupPayload(),
      type: "application/json;charset=utf-8",
      description: "JSON 备份文件",
      accept: { "application/json": [".json"] },
    });
    if (result.ok) {
      setBackupStatus(result.method === "picker" ? "JSON 备份已保存。" : "当前浏览器不支持选择保存位置，已按默认下载方式导出 JSON。", "success");
    } else if (result.cancelled) {
      setBackupStatus("已取消 JSON 备份导出。");
    } else {
      prepareBackupText(true);
      setBackupStatus("JSON 备份导出失败，请使用下方 JSON 备份文本。", "error");
    }
  });

  $("#copyJson").addEventListener("click", async () => {
    prepareBackupText(false);
    try {
      await navigator.clipboard.writeText(backupPayload());
      setBackupStatus("JSON 备份已复制到剪贴板。 ");
    } catch (error) {
      console.error("Copy backup failed", error);
      prepareBackupText(true);
      $("#backupText").focus();
      $("#backupText").select();
      setBackupStatus("浏览器禁止自动复制，已选中下方 JSON 文本，请按 Ctrl+C。", "error");
    }
  });

  $("#generateJsonText").addEventListener("click", () => {
    prepareBackupText(true);
    setBackupStatus("已生成当前完整 JSON 备份文本。", "success");
  });

  $("#clearJsonText").addEventListener("click", () => {
    $("#backupText").value = "";
    setBackupStatus("已清空文本输入区；当前应用数据未受影响。");
  });

  $("#exportCsv").addEventListener("click", () => {
    const { from, to } = resolvedCsvExportRange();
    if (from && to && from > to) {
      setBackupStatus("CSV 导出失败：开始日期不能晚于结束日期。", "error");
      return;
    }
    const snapshots = snapshotsInRange(state.snapshots, from, to);
    if (!snapshots.length) {
      setBackupStatus("当前时间范围内没有可导出的快照。", "error");
      return;
    }
    const suffix = from || to ? `-${from || "start"}-${to || "end"}` : "";
    const ok = download(`asset-snapshots${suffix}-${new Date().toISOString().slice(0, 10)}.csv`, `\uFEFF${exportSnapshotsCsv(snapshots)}`, "text/csv;charset=utf-8");
    setBackupStatus(ok ? "已请求下载 CSV，请查看浏览器下载列表。" : "CSV 导出失败。", ok ? "success" : "error");
  });

  $("#csvExportRange").addEventListener("change", (event) => {
    csvExportRange = event.currentTarget.value || "all";
    renderCsvExportControls();
  });
  $("#csvExportFrom").addEventListener("change", (event) => {
    csvExportFrom = event.currentTarget.value;
    renderCsvExportControls();
  });
  $("#csvExportTo").addEventListener("change", (event) => {
    csvExportTo = event.currentTarget.value;
    renderCsvExportControls();
  });

  $("#chooseJson").addEventListener("click", () => {
    clearImportPreview();
    setBackupStatus("请选择一个 JSON 备份文件。 ");
    $("#importJson").click();
  });
  $("#chooseCsv").addEventListener("click", () => {
    clearImportPreview();
    setBackupStatus("请选择一个 CSV 文件。 ");
    $("#importCsv").click();
  });

  $("#confirmImportPreview").addEventListener("click", confirmPendingImport);
  $("#cancelImportPreview").addEventListener("click", () => {
    clearImportPreview();
    setBackupStatus("已取消导入。");
  });
  $("#closeImportPreview").addEventListener("click", () => {
    clearImportPreview();
    setBackupStatus("已取消导入。");
  });
  $("#importPreview").addEventListener("click", (event) => {
    if (event.target !== event.currentTarget) return;
    clearImportPreview();
    setBackupStatus("已取消导入。");
  });
  $("#importPreviewContent").addEventListener("change", (event) => {
    if (!pendingImportPreview?.csv) return;
    if (event.target.id === "csvImportFrom") pendingImportPreview.csv.from = event.target.value;
    else if (event.target.id === "csvImportTo") pendingImportPreview.csv.to = event.target.value;
    else return;
    refreshCsvImportPreview(pendingImportPreview);
    renderImportPreview(pendingImportPreview);
  });
  $("#importPreviewContent").addEventListener("click", (event) => {
    if (event.target.id !== "clearCsvImportRange" || !pendingImportPreview?.csv) return;
    pendingImportPreview.csv.from = "";
    pendingImportPreview.csv.to = "";
    refreshCsvImportPreview(pendingImportPreview);
    renderImportPreview(pendingImportPreview);
  });

  $("#deleteAllData").addEventListener("click", deleteAllData);

  $$('input[name="themeMode"]').forEach((input) => {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      state.settings.theme = normalizedTheme(input.value);
      saveState();
      applyTheme();
    });
  });

  $("#importJsonText").addEventListener("click", async () => {
    const content = $("#backupText").value.trim();
    if (!content) {
      setBackupStatus("请先粘贴 JSON 备份内容。", "error");
      return;
    }
    try {
      renderImportPreview(previewJsonImport(content, "粘贴的 JSON 文本"));
      setBackupStatus("JSON 文本预检完成，请确认后导入。");
    } catch (error) {
      logImportFailure("JSON text import failed", error);
      setBackupStatus("JSON 文本导入失败：内容格式不正确。", "error");
      await alertDialog(importFailureMessage("json", error), { title: "JSON 导入失败", variant: "danger" });
    }
  });

  $("#importJson").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const content = await readFile(file);
      renderImportPreview(previewJsonImport(content, file.name));
      setBackupStatus(`JSON 备份预检完成：${file.name}`);
    } catch (error) {
      logImportFailure("JSON import failed", error);
      setBackupStatus("JSON 导入失败：文件格式不正确或内容已损坏。", "error");
      await alertDialog(importFailureMessage("json", error), { title: "JSON 导入失败", variant: "danger" });
    }
    event.target.value = "";
  });

  $("#importCsv").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const content = await readFile(file);
      renderImportPreview(previewCsvImport(content, file.name));
      setBackupStatus(`CSV 快照预检完成：${file.name}`);
    } catch (error) {
      logImportFailure("CSV import failed", error);
      setBackupStatus("CSV 导入失败，请检查表头和文件编码。", "error");
      await alertDialog(importFailureMessage("csv", error), { title: "CSV 导入失败", variant: "danger" });
    }
    event.target.value = "";
  });
}

function resetAccountForm() {
  editingAccountId = null;
  editingAccountBalanceInitial = "";
  editingAccountCostInitial = "";
  $("#accountForm").reset();
  $("#accountCurrency").value = state.settings.baseCurrency;
  renderAccountRateField();
  $("#accountFormTitle").textContent = "新增账户";
  $("#accountSubmitButton").textContent = "添加账户";
  $("#cancelAccountEdit").hidden = true;
  $("#deleteAccountFromForm").hidden = true;
  $("#deleteAccountFromForm").removeAttribute("data-delete-account");
}

function openAccountSheet() {
  const accountSheet = $("#accountSheet");
  if (accountSheet?.parentElement?.classList.contains("view")) {
    document.querySelector("main")?.appendChild(accountSheet);
  }
  accountSheet.hidden = false;
  document.body.classList.add("sheet-open");
  window.setTimeout(() => $("#accountForm").elements.name.focus(), 0);
}

function openSettingsSheet(sheetId) {
  const sheet = $(`#${sheetId}`);
  if (!sheet) return;
  if (sheetId === "currencySettingsSheet") {
    currencyManageMode = false;
    selectedCurrencyCodes.clear();
    renderCurrencyOptions();
  }
  if (sheetId === "backupSettingsSheet") {
    renderBackupOverview();
    renderCsvExportControls();
  }
  if (sheetId === "appearanceSettingsSheet") applyTheme();
  if (sheetId === "typeSettingsSheet") {
    typeDraft = structuredClone(state.settings.accountTypeGroups);
    typeDraftDirty = false;
    typeManageMode = false;
    selectedTypeGroupIds.clear();
    selectedTypeIds.clear();
    renderTypeManager();
  }
  if (sheetId === "healthScopeSheet") {
    const config = healthConfig();
    const denominatorConfig = healthDenominatorConfig();
    if (isCustomHealthCardKey(activeHealthScopeKind)) {
      const existing = activeCustomHealthCard();
      customHealthDraft = structuredClone(existing || {
        id: customHealthCardId(activeHealthScopeKind) || id(),
        name: "自定义占比",
        note: "",
        denominatorMode: "custom",
        numeratorBasis: "balance",
        denominatorBasis: "balance",
        numeratorScope: defaultHealthScopeForCard("custom", typeGroups()),
        denominatorScope: defaultHealthScopeForCard("custom", typeGroups()),
      });
      customHealthDraft.numeratorScope = scopeWithAccountSelection(customHealthDraft.numeratorScope);
      customHealthDraft.denominatorScope = scopeWithAccountSelection(customHealthDraft.denominatorScope);
      activeCustomHealthScopePart = "numerator";
      healthScopeDraft = null;
      healthDenominatorScopeDraft = null;
    } else {
      customHealthDraft = null;
      activeCustomHealthScopePart = "numerator";
      healthScopeDraft = scopeWithAccountSelection(config[activeHealthScopeKind] || defaultHealthScopeForCard(activeHealthScopeKind, typeGroups()));
      healthDenominatorScopeDraft = HEALTH_DENOMINATOR_SCOPE_KEYS.includes(activeHealthScopeKind)
        ? scopeWithAccountSelection(denominatorConfig[activeHealthScopeKind] || defaultHealthScopeForCard("custom", typeGroups()))
        : null;
    }
    healthScopeDraftDirty = false;
    renderHealthScopeManager();
  }
  if (sheetId === "tagSettingsSheet") {
    tagDraft = normalizeSnapshotTagSettings(state.settings.snapshotTags, state.snapshots);
    tagDraftDirty = false;
    tagManageMode = false;
    selectedTagNames.clear();
    renderTagManager();
  }
  sheet.hidden = false;
  document.body.classList.add("sheet-open");
}

async function closeSettingsSheet(sheet) {
  if (!sheet) return;
  if (sheet.id === "typeSettingsSheet" && typeDraftDirty) {
    syncTypeDraftFromInputs();
    const saveChanges = await confirmDialog("账户类型还有未保存的修改。\n\n点击“确定”保存修改；点击“取消”放弃修改并退出。", {
      title: "保存账户类型修改",
      confirmText: "保存修改",
      cancelText: "放弃修改",
    });
    if (saveChanges && !(await saveTypeDraft())) return;
  }
  if (sheet.id === "healthScopeSheet" && healthScopeDraftDirty) {
    const saveChanges = await confirmDialog("资产健康口径还有未保存的修改。\n\n点击“确定”保存配置；点击“取消”放弃修改并退出。", {
      title: "保存资产健康口径修改",
      confirmText: "保存配置",
      cancelText: "放弃修改",
    });
    if (saveChanges && !(await saveHealthScopeDraft())) return;
  }
  if (sheet.id === "tagSettingsSheet" && tagDraftDirty) {
    syncTagDraftFromInputs();
    const saveChanges = await confirmDialog("快照标签还有未保存的修改。\n\n点击“确定”保存修改；点击“取消”放弃修改并退出。", {
      title: "保存快照标签修改",
      confirmText: "保存修改",
      cancelText: "放弃修改",
    });
    if (saveChanges && !(await saveTagDraft())) return;
  }
  if (sheet.id === "typeSettingsSheet") {
    typeDraft = null;
    typeDraftDirty = false;
    typeManageMode = false;
    selectedTypeGroupIds.clear();
    selectedTypeIds.clear();
  }
  if (sheet.id === "healthScopeSheet") {
    healthScopeDraft = null;
    healthDenominatorScopeDraft = null;
    customHealthDraft = null;
    activeCustomHealthScopePart = "numerator";
    healthScopeDraftDirty = false;
  }
  if (sheet.id === "currencySettingsSheet") {
    currencyManageMode = false;
    selectedCurrencyCodes.clear();
  }
  if (sheet.id === "tagSettingsSheet") {
    tagDraft = null;
    tagDraftDirty = false;
    tagManageMode = false;
    selectedTagNames.clear();
  }
  sheet.hidden = true;
  if ($$(".sheet-backdrop:not([hidden])").length === 0) document.body.classList.remove("sheet-open");
}

function syncTypeDraftFromInputs() {
  if (!typeDraft) return;
  typeDraft.forEach((group) => {
    const groupInput = $(`[data-type-group-name="${group.id}"]`);
    if (groupInput) group.name = groupInput.value.trim();
    group.types.forEach((type) => {
      const typeInput = $(`[data-type-name="${type.id}"]`);
      if (typeInput) type.name = typeInput.value.trim();
    });
  });
}

async function saveTypeDraft() {
  if (!typeDraft) return true;
  syncTypeDraftFromInputs();
  if (typeDraft.some((group) => !group.name || group.types.some((type) => !type.name))) {
    await alertDialog("账户类型的大类和小类名称都不能为空。");
    return false;
  }
  state.settings.accountTypeGroups = structuredClone(typeDraft);
  state.settings.healthConfig = normalizeHealthConfig(state.settings.healthConfig, state.settings.accountTypeGroups);
  state.settings.healthDenominatorConfig = normalizeHealthDenominatorConfig(state.settings.healthDenominatorConfig, state.settings.accountTypeGroups);
  state.settings.healthCustomCards = normalizeHealthCustomCards(state.settings.healthCustomCards, state.settings.accountTypeGroups);
  typeDraftDirty = false;
  saveState();
  renderAll();
  return true;
}

async function saveTagDraft() {
  if (!tagDraft) return true;
  const before = state.settings.snapshotTags || [];
  const renameMap = new Map();
  $$(`#snapshotTagManager [data-tag-name]`).forEach((input) => {
    const oldName = input.dataset.tagName;
    const newName = input.value.trim();
    if (oldName && newName && oldName !== newName) renameMap.set(oldName, newName);
  });
  syncTagDraftFromInputs();
  if (tagDraft.some((tag) => !tag)) {
    await alertDialog("标签名称不能为空。");
    return false;
  }
  state.settings.snapshotTags = normalizeSnapshotTagSettings(tagDraft, state.snapshots).filter((tag) => tagDraft.includes(tag));
  state.snapshots.forEach((snapshot) => {
    snapshot.tags = [...new Set((snapshot.tags || [])
      .map((tag) => renameMap.get(tag) || tag)
      .filter((tag) => state.settings.snapshotTags.includes(tag)))];
  });
  before.forEach((tag) => {
    if (!state.settings.snapshotTags.includes(tag)) selectedTagNames.delete(tag);
  });
  tagDraftDirty = false;
  saveState();
  renderAll();
  return true;
}

function closeAccountSheet() {
  $("#accountSheet").hidden = true;
  document.body.classList.remove("sheet-open");
  resetAccountForm();
}

function openSnapshotSheet(snapshotId = null) {
  const snapshotSheet = $("#snapshotSheet");
  if (snapshotSheet?.parentElement?.classList.contains("view")) {
    document.querySelector("main")?.appendChild(snapshotSheet);
  }
  editingSnapshotId = snapshotId;
  renderSnapshotForm();
  snapshotSheet.hidden = false;
  document.body.classList.add("sheet-open");
  window.setTimeout(() => $("#snapshotDate").focus(), 0);
}

function closeSnapshotSheet() {
  $("#snapshotRateDialog").hidden = true;
  $("#snapshotSheet").hidden = true;
  editingSnapshotId = null;
  snapshotRateDraft = null;
  snapshotInlineTagAdding = false;
  snapshotInlineTagDraft = "";
  $("#snapshotForm").dataset.editingSnapshotId = "";
  $("#snapshotDate").value = localDateString();
  if ($$(".sheet-backdrop:not([hidden])").length === 0) document.body.classList.remove("sheet-open");
}

function openSnapshotHistorySheet(mode = "edit") {
  const historySheet = $("#snapshotHistorySheet");
  if (historySheet?.parentElement?.classList.contains("view")) {
    document.querySelector("main")?.appendChild(historySheet);
  }
  snapshotHistoryMode = mode;
  if (mode === "report") {
    snapshotManageMode = false;
    selectedSnapshotIds.clear();
    showAllSnapshots = true;
    setIconHeading($("#snapshotHistoryTitle"), "calendar", "\u9009\u62e9\u5386\u53f2\u5feb\u7167");
  } else {
    setIconHeading($("#snapshotHistoryTitle"), "calendar", "\u5386\u53f2\u5feb\u7167");
  }
  renderSnapshots();
  $("#snapshotHistorySheet").hidden = false;
  document.body.classList.add("sheet-open");
  window.setTimeout(() => $("#snapshotSearchInput").focus(), 0);
}

function closeSnapshotHistorySheet() {
  $("#snapshotHistorySheet").hidden = true;
  snapshotHistoryMode = "edit";
  if ($$(".sheet-backdrop:not([hidden])").length === 0) document.body.classList.remove("sheet-open");
}

function startAccountEdit(accountId) {
  const account = state.accounts.find((item) => item.id === accountId);
  if (!account) return;
  editingAccountId = accountId;
  const form = $("#accountForm");
  form.elements.name.value = account.name;
  form.elements.type.value = account.type;
  form.elements.group.value = account.group || "";
  form.elements.currency.value = account.currency;
  renderAccountRateField();
  const currentBalance = accountCurrentBalance(account.id);
  editingAccountBalanceInitial = currentBalance === "" ? "" : String(Number(currentBalance));
  form.elements.currentBalance.value = editingAccountBalanceInitial;
  editingAccountCostInitial = account.costBasis === "" || account.costBasis === undefined ? "" : String(Number(account.costBasis));
  form.elements.costBasis.value = editingAccountCostInitial;
  form.elements.note.value = account.note || "";
  form.elements.includeInNetWorth.checked = account.includeInNetWorth !== false;
  form.elements.archived.checked = Boolean(account.archived);
  $("#accountFormTitle").textContent = "编辑账户";
  $("#accountSubmitButton").textContent = "保存修改";
  $("#cancelAccountEdit").hidden = false;
  $("#deleteAccountFromForm").hidden = false;
  $("#deleteAccountFromForm").dataset.deleteAccount = account.id;
  openAccountSheet();
}

function dropSide(clientY, target) {
  const positionElement = target.matches("[data-drop-group]") ? target.querySelector(":scope > .account-group-heading") || target : target;
  const rect = positionElement.getBoundingClientRect();
  return clientY >= rect.top + rect.height / 2 ? "after" : "before";
}

function dragPlacement(type, source, target) {
  if (type === "group") {
    syncGroupOrder();
    const order = state.settings.accountGroupOrder;
    return order.indexOf(source) < order.indexOf(target) ? "after" : "before";
  }
  const sourceAccount = state.accounts.find((account) => account.id === source);
  if (!sourceAccount) return "before";
  const order = state.accounts
    .filter((account) => !account.archived && accountGroupName(account) === accountGroupName(sourceAccount))
    .map((account) => account.id);
  return order.indexOf(source) < order.indexOf(target) ? "after" : "before";
}

function reorderAccount(accountId, targetId, side = "before") {
  if (accountId === targetId) return;
  const account = state.accounts.find((item) => item.id === accountId);
  const target = state.accounts.find((item) => item.id === targetId);
  if (!account || !target || accountGroupName(account) !== accountGroupName(target) || account.archived !== target.archived) return;
  state.accounts = state.accounts.filter((item) => item.id !== accountId);
  let targetIndex = state.accounts.findIndex((item) => item.id === targetId);
  if (side === "after") targetIndex += 1;
  state.accounts.splice(targetIndex, 0, account);
}

function reorderGroup(groupName, targetName, side = "before") {
  if (groupName === targetName) return;
  syncGroupOrder();
  const order = state.settings.accountGroupOrder.filter((name) => name !== groupName);
  let targetIndex = order.indexOf(targetName);
  if (targetIndex < 0) return;
  if (side === "after") targetIndex += 1;
  order.splice(targetIndex, 0, groupName);
  state.settings.accountGroupOrder = order;
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js?v=139&ui=8").catch(() => {});
  }
}

bindUIShellDetection();
bindThemePreference();
bindEvents();
applyTheme();
renderAll();
scheduleVisibleChartRender();
registerServiceWorker();
