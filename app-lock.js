"use strict";

// Device-only credentials; never part of business state or portable backups.
const APP_LOCK_KEY = "asset-snapshot-book-v1-app-lock";
const APP_LOCK_TRANSACTION_KEY = `${APP_LOCK_KEY}-transaction`;
const APP_LOCK_DATA_KEYS = ["asset-snapshot-book-v1", "asset-snapshot-book-v1-recovery", "asset-snapshot-book-v1-corrupt", APP_LOCK_KEY];
const APP_LOCK_INTRO = "应用锁用于防止他人随手查看界面，不加密本地数据或导出的备份。密码仅保存在当前设备，不随备份导出。忘记密码后，可用完整 JSON 备份恢复，可选择重新开启应用锁；备份之后新增的记录将无法保留。";
let appLockConfig = null;
let appIsLocked = false;
let appLockMode = "unlock";
let appLockBusy = false;
let appLockHiddenAt = null;
let appLockPendingBackup = null;
let appLockReadyResolve = null;
let appLockStartupError = "";
let appLockScreenRevision = 0;
let appLockReturnScroll = 0;

function restoreLockTransaction() {
  const raw = localStorage.getItem(APP_LOCK_TRANSACTION_KEY);
  if (!raw) return;
  const journal = JSON.parse(raw);
  if (!journal || !APP_LOCK_DATA_KEYS.every(key => journal[key] === null || typeof journal[key] === "string")) {
    throw new Error("恢复记录异常，请保留站点数据并重试。");
  }
  for (const key of APP_LOCK_DATA_KEYS) {
    if (journal[key] === null) localStorage.removeItem(key);
    else localStorage.setItem(key, journal[key]);
  }
  localStorage.removeItem(APP_LOCK_TRANSACTION_KEY);
}

// Run before app.js reads its main data, so interrupted recovery is rolled back first.
try { restoreLockTransaction(); } catch (error) { appLockStartupError = error.message; }

const APP_LOCK_TIMEOUTS = [60, 120, 300, 600, 0];
function appLockTimeout(config = appLockConfig) {
  return APP_LOCK_TIMEOUTS.includes(config?.autoLockSeconds) ? config.autoLockSeconds : 60;
}
function saveAppLockTimeout(value) {
  const seconds = Number(value);
  if (!appLockConfig || !APP_LOCK_TIMEOUTS.includes(seconds)) return;
  const next = { ...appLockConfig, autoLockSeconds: seconds };
  try {
    localStorage.setItem(APP_LOCK_KEY, JSON.stringify(next));
    appLockConfig = next;
    document.querySelector("#appLockTimeoutStatus").textContent = "已保存，仅对当前设备生效。";
  } catch {
    document.querySelector("#appLockTimeoutStatus").textContent = "保存失败，已保留原设置。";
  }
  renderAppLockSettings();
}

function readAppLock() {
  const raw = localStorage.getItem(APP_LOCK_KEY);
  if (!raw) return null;
  const value = JSON.parse(raw);
  if (value.version !== 1 || !/^[a-f0-9]{32}$/.test(value.salt) || !/^[a-f0-9]{64}$/.test(value.hash)) {
    throw new Error("应用锁配置异常，请从完整 JSON 备份恢复。");
  }
  return value;
}

async function appLockHash(pin, salt) {
  if (!crypto.subtle) throw new Error("当前环境不支持密码校验，请使用 HTTPS 或本机 localhost 地址。");
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${pin}`));
  return Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2, "0")).join("");
}

async function newAppLockConfig(pin) {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, "0")).join("");
  return { version: 1, salt, hash: await appLockHash(pin, salt), autoLockSeconds: appLockTimeout() };
}

function appLockStatus(message = "") {
  document.querySelector("#appLockStatus").textContent = message;
}

function clearAppLockInputs() {
  document.querySelectorAll("#appLockScreen input[type=password]").forEach(input => { input.value = ""; });
}

function showAppLock(mode = "unlock") {
  if (!document.documentElement.classList.contains("app-lock-visible")) appLockReturnScroll = window.scrollY || 0;
  appLockScreenRevision += 1;
  appLockMode = mode;
  appLockPendingBackup = null;
  clearAppLockInputs();
  document.querySelector("#appLockFile").value = "";
  document.querySelector("#appLockBackupSummary").textContent = "";
  document.querySelector("#appLockRecoveryConfirm").checked = false;
  document.querySelector("#appLockRecoveryEnable").checked = false;
  appLockStatus();
  document.documentElement.classList.add("app-lock-visible");
  const titles = { unlock: "输入应用锁密码", enable: "开启应用锁", change: "修改应用锁密码", disable: "关闭应用锁", recover: "从备份恢复" };
  document.querySelector("#appLockTitle").textContent = titles[mode];
  document.querySelector("#appLockOldRow").hidden = !["unlock", "change", "disable"].includes(mode);
  document.querySelector("#appLockNewFields").hidden = !["enable", "change"].includes(mode);
  document.querySelector("#appLockRecoveryFields").hidden = mode !== "recover";
  document.querySelector("#appLockForgot").hidden = mode !== "unlock";
  document.querySelector("#appLockCancel").hidden = mode === "unlock";
  document.querySelector("#appLockSubmit").textContent = {unlock:"解锁",enable:"开启应用锁",change:"保存新密码",disable:"关闭应用锁",recover:"恢复备份"}[mode];
  document.querySelector("#appLockSubmit").disabled = Boolean(appLockStartupError);
  if (appLockStartupError) appLockStatus("上次恢复尚未完成回滚，请刷新重试。原站点数据请勿清除。");
  requestAnimationFrame(() => {
    if (mode === "recover") document.querySelector("#appLockFile").focus({ preventScroll: true });
    else document.querySelector(["unlock", "change", "disable"].includes(mode) ? "#appLockOld" : "#appLockNew").focus({ preventScroll: true });
  });
}

function finishAppUnlock() {
  document.activeElement?.blur?.();
  appIsLocked = false;
  clearAppLockInputs();
  appLockPendingBackup = null;
  document.documentElement.classList.remove("app-lock-visible", "app-lock-initializing");
  restoreAppLockScroll();
  renderAppLockSettings();
  appLockReadyResolve?.();
  appLockReadyResolve = null;
}

// Keyboard dismissal can resize the visual viewport after the form disappears.
function restoreAppLockScroll() {
  const revision = appLockScreenRevision;
  const viewport = window.visualViewport;
  let stopped = false;
  const restore = () => {
    if (!stopped && revision === appLockScreenRevision && !document.documentElement.classList.contains("app-lock-visible")) {
      window.scrollTo({ top: appLockReturnScroll, left: 0, behavior: "instant" });
    }
  };
  const stop = () => {
    stopped = true;
    viewport?.removeEventListener("resize", restore);
    window.removeEventListener("pointerdown", stop);
    window.removeEventListener("touchstart", stop);
    window.removeEventListener("wheel", stop);
    window.removeEventListener("keydown", stop);
  };
  restore();
  requestAnimationFrame(restore);
  viewport?.addEventListener("resize", restore);
  for (const event of ["pointerdown", "touchstart", "wheel", "keydown"]) window.addEventListener(event, stop, { once: true, passive: true });
  window.setTimeout(stop, 800);
}

function lockAppNow() {
  if (!appLockConfig && !appIsLocked) return;
  appIsLocked = true;
  showAppLock();
}

function renderAppLockSettings() {
  const enabled = Boolean(appLockConfig);
  const timeout = document.querySelector("#appLockTimeout");
  timeout.disabled = !enabled;
  timeout.value = String(appLockTimeout());
  document.querySelector("#appLockSettingsStatus").textContent = enabled ? "已开启 · 四位数密码" : "未开启 · 仅本机生效";
  for (const button of document.querySelectorAll("[data-app-lock-action]")) {
    button.hidden = button.dataset.appLockAction === "enable" ? enabled : !enabled;
  }
}

async function recoverAppLockBackup(config) {
  if (!appLockPendingBackup || !document.querySelector("#appLockRecoveryConfirm").checked) {
    throw new Error("请先选择有效的完整 JSON 备份，并确认覆盖当前数据。");
  }
  const oldState = structuredClone(state);
  const journal = Object.fromEntries(APP_LOCK_DATA_KEYS.map(key => [key, localStorage.getItem(key)]));
  localStorage.setItem(APP_LOCK_TRANSACTION_KEY, JSON.stringify(journal));
  try {
    importJsonContent("", appLockPendingBackup);
    const restored = localStorage.getItem(STORAGE_KEY);
    localStorage.setItem(RECOVERY_STORAGE_KEY, restored);
    localStorage.removeItem(CORRUPT_STORAGE_KEY);
    if (config) localStorage.setItem(APP_LOCK_KEY, JSON.stringify(config));
    else localStorage.removeItem(APP_LOCK_KEY);
    localStorage.removeItem(APP_LOCK_TRANSACTION_KEY);
  } catch (error) {
    state = oldState;
    try { restoreLockTransaction(); } catch {
      appLockStartupError = "恢复回滚未完成";
      throw new Error("恢复未完成，请刷新重试回滚。请勿清除站点数据。");
    }
    throw new Error("恢复失败，原数据与原密码已保留。请检查存储空间后重试。");
  }
  appLockConfig = config;
  appLockReturnScroll = 0;
  resetInteractionState();
  // Old editor drafts and generated backup text must not expose replaced data.
  document.querySelectorAll(".sheet-backdrop, .snapshot-rate-backdrop, .import-preview-backdrop").forEach(sheet => { sheet.hidden = true; });
  document.querySelector("#backupText").value = "";
  syncSheetScrollLock();
  renderAll();
}

async function submitAppLock(event) {
  event.preventDefault();
  if (appLockBusy || appLockStartupError) return;
  appLockBusy = true;
  const submit = document.querySelector("#appLockSubmit");
  submit.disabled = true;
  const mode = appLockMode;
  const revision = appLockScreenRevision;
  try {
    const oldPin = document.querySelector("#appLockOld").value;
    const pin = document.querySelector("#appLockNew").value;
    if (["unlock", "change", "disable"].includes(mode)) {
      if (!/^[0-9]{4}$/.test(oldPin) || !appLockConfig || await appLockHash(oldPin, appLockConfig.salt) !== appLockConfig.hash) {
        throw new Error("密码不正确，请输入四位数字密码。");
      }
    }
    if (revision !== appLockScreenRevision) throw new Error("锁定状态已变化，请重新操作。");
    const recoveryWithLock = mode === "recover" && document.querySelector("#appLockRecoveryEnable").checked;
    if (["enable", "change"].includes(mode) || recoveryWithLock) {
      if (!/^[0-9]{4}$/.test(pin)) throw new Error("新密码须为四位数字，可包含前导零。");
      if (pin !== document.querySelector("#appLockRepeat").value) throw new Error("两次新密码不一致，请重新输入。");
      const config = await newAppLockConfig(pin);
      if (revision !== appLockScreenRevision) throw new Error("锁定状态已变化，请重新操作。");
      if (mode === "recover") await recoverAppLockBackup(config);
      else {
        localStorage.setItem(APP_LOCK_KEY, JSON.stringify(config));
        appLockConfig = config;
      }
    }
    if (mode === "recover" && !recoveryWithLock) await recoverAppLockBackup(null);
    if (mode === "disable") {
      localStorage.removeItem(APP_LOCK_KEY);
      appLockConfig = null;
    }
    finishAppUnlock();
  } catch (error) { appLockStatus(error.message || "操作失败，请重试。"); }
  finally { appLockBusy = false; submit.disabled = Boolean(appLockStartupError); }
}

function initAppLock() {
  document.querySelector("#appLockIntro").textContent = APP_LOCK_INTRO;
  document.querySelector("#appLockForm").addEventListener("submit", submitAppLock);
  document.querySelector("#appLockRecoveryEnable").addEventListener("change", event => {
    if (appLockMode !== "recover") return;
    document.querySelector("#appLockNewFields").hidden = !event.target.checked;
    clearAppLockInputs();
    document.querySelector("#appLockSubmit").textContent = event.target.checked ? "恢复并开启应用锁" : "恢复备份";
  });
  document.querySelector("#appLockTimeout").addEventListener("change", event => saveAppLockTimeout(event.target.value));
  document.querySelector("#appLockForgot").addEventListener("click", () => { if (!appLockBusy) showAppLock("recover"); });
  document.querySelector("#appLockCancel").addEventListener("click", () => {
    if (appLockBusy) return;
    if (appIsLocked) showAppLock(); else finishAppUnlock();
  });
  document.querySelectorAll("[data-app-lock-action]").forEach(button => button.addEventListener("click", () => {
    if (button.dataset.appLockAction === "lock") lockAppNow();
    else showAppLock(button.dataset.appLockAction);
  }));
  document.querySelector("#appLockFile").addEventListener("change", async event => {
    appLockPendingBackup = null;
    document.querySelector("#appLockBackupSummary").textContent = "";
    document.querySelector("#appLockRecoveryConfirm").checked = false;
    const file = event.target.files[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!isPlainObject(imported.settings) || imported.exportMode) throw new Error("请选择完整 JSON 备份，不支持时间段数据包或 CSV。");
      if (appLockMode !== "recover" || document.querySelector("#appLockFile").files[0] !== file) return;
      const normalized = normalizeJsonImportData(imported);
      validateJsonImportData(normalized.data);
      appLockPendingBackup = normalized.data;
      document.querySelector("#appLockBackupSummary").textContent = `所选备份：${normalized.data.accounts.length} 个账户，${normalized.data.snapshots.length} 条快照。`;
      appLockStatus("备份预检通过。请确认覆盖；也可选择设置新密码。");
    } catch (error) { appLockStatus(error.message || "备份无效，当前数据未修改。"); }
  });
  document.addEventListener("visibilitychange", () => {
    if (!appLockConfig) return;
    if (document.hidden) {
      appLockHiddenAt = Date.now();
      document.documentElement.classList.add("app-lock-concealed");
    } else {
      if (appLockTimeout() > 0 && appLockHiddenAt !== null && Date.now() - appLockHiddenAt >= appLockTimeout() * 1000) lockAppNow();
      appLockHiddenAt = null;
      document.documentElement.classList.remove("app-lock-concealed");
    }
  });
  window.addEventListener("pageshow", event => { if (event.persisted && appLockConfig) lockAppNow(); });
  window.addEventListener("storage", event => {
    if ([APP_LOCK_KEY, APP_LOCK_TRANSACTION_KEY].includes(event.key)) {
      document.documentElement.classList.add("app-lock-concealed");
      // Do not read business state while another tab is in a recovery transaction.
      if (!localStorage.getItem(APP_LOCK_TRANSACTION_KEY)) location.reload();
    }
  });
  document.addEventListener("keydown", event => {
    if (!document.documentElement.classList.contains("app-lock-visible")) return;
    event.stopImmediatePropagation();
    if (event.key === "Escape" && !appIsLocked && !appLockBusy) finishAppUnlock();
  }, true);
  try { appLockConfig = readAppLock(); } catch (error) { appIsLocked = true; appLockStatus(error.message); }
  renderAppLockSettings();
  appIsLocked = appIsLocked || Boolean(appLockConfig) || Boolean(appLockStartupError);
  document.documentElement.classList.remove("app-lock-initializing");
  if (!appIsLocked) return Promise.resolve();
  showAppLock();
  appLockReturnScroll = 0;
  return new Promise(resolve => { appLockReadyResolve = resolve; });
}
