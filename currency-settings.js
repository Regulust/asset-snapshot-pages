"use strict";
let currencyDraft = null;
let currencyDraftOriginal = "";
let currencyPendingRates = {};
let currencyEditorBusy = false;
const CURRENCY_FIELDS = ["baseCurrency", "enabledCurrencies", "customCurrencies", "deletedCurrencyCodes", "rates"];
function currencyConfigCopy(settings) {
  return Object.fromEntries(CURRENCY_FIELDS.map(key => [key, structuredClone(settings[key] ?? (key === "rates" ? {} : []))]));
}
function draftCurrencies() {
  return [...currencies, ...(currencyDraft.customCurrencies || [])].filter(item => !(currencyDraft.deletedCurrencyCodes || []).includes(item.code));
}
function currencyDraftDirty() {
  return currencyDraft && (Object.keys(currencyPendingRates).length > 0 || JSON.stringify(currencyDraft) !== currencyDraftOriginal || [...$("#customCurrencyForm").elements].some(input => input.name && input.value));
}
function beginCurrencyDraft() {
  currencyDraft = currencyConfigCopy(state.settings);
  currencyDraftOriginal = JSON.stringify(currencyDraft);
  currencyPendingRates = {};
  currencyManageMode = false;
  selectedCurrencyCodes.clear();
  $("#customCurrencyForm").reset();
  $("#customCurrencyDetails").open = false;
  $("#currencyConfigDetails").open = false;
  setCurrencyConfigStatus("");
  renderCurrencyDraft();
}
function flushCurrencyRates() {
  const baseRate = Number(currencyDraft.rates[currencyDraft.baseCurrency]);
  if (!Number.isFinite(baseRate) || baseRate <= 0) throw new Error("主货币汇率无效，请先填写有效汇率。");
  const updates = {};
  for (const [code, raw] of Object.entries(currencyPendingRates)) {
    if (!currencyDraft.enabledCurrencies.includes(code)) continue;
    const value = Number(raw);
    if (!String(raw).trim() || !Number.isFinite(value) || value <= 0 || !Number.isFinite(value * baseRate) || value * baseRate <= 0) throw new Error(`${code} 汇率必须是有效正数。`);
    updates[code] = value * baseRate;
  }
  Object.assign(currencyDraft.rates, updates);
  currencyPendingRates = {};
}
function renderCurrencyDraft() {
  if (!currencyDraft) return;
  const base = currencyDraft.baseCurrency;
  const used = new Set(state.accounts.map(account => account.currency));
  const available = draftCurrencies();
  $("#baseCurrency").innerHTML = available.map(item => `<option value="${escapeHtml(item.code)}">${escapeHtml(item.code)} · ${escapeHtml(item.name)}</option>`).join("");
  $("#baseCurrency").value = base;
  renderManageButton($("#toggleCurrencyManage"), currencyManageMode, "批量删除");
  $("#deleteSelectedCurrencies").hidden = !currencyManageMode;
  $("#deleteSelectedCurrencies").disabled = !selectedCurrencyCodes.size;
  $("#currencyChoices").innerHTML = available.map(item => {
    const locked = item.code === base || used.has(item.code);
    const enabled = locked || currencyDraft.enabledCurrencies.includes(item.code);
    const relative = Number(currencyDraft.rates[item.code]) / Number(currencyDraft.rates[base]);
    const value = currencyPendingRates[item.code] ?? (Number.isFinite(relative) && relative > 0 ? String(Number(relative.toPrecision(10))) : "");
    return `<div class="currency-editor-row">
      <div class="currency-editor-name">${currencyManageMode ? `<input type="checkbox" data-select-currency="${escapeHtml(item.code)}" aria-label="选择 ${escapeHtml(item.code)}" ${selectedCurrencyCodes.has(item.code) ? "checked" : ""} ${locked ? "disabled" : ""}>` : ""}
      <label><input type="checkbox" data-enable-currency="${escapeHtml(item.code)}" aria-label="启用 ${escapeHtml(item.code)}" ${enabled ? "checked" : ""} ${locked ? "disabled" : ""}><span><b>${escapeHtml(item.code)}</b> ${escapeHtml(item.name)}</span></label>${locked ? '<small>使用中</small>' : ''}</div>
      ${enabled ? `<label class="currency-editor-rate"><span>1 ${escapeHtml(item.code)} =</span><input data-currency-rate="${escapeHtml(item.code)}" aria-label="${escapeHtml(item.code)} 兑换 ${escapeHtml(base)} 汇率" type="number" step="any" min="0" value="${item.code === base ? '1' : escapeHtml(value)}" ${item.code === base ? "disabled" : ""}><span>${escapeHtml(base)}</span></label>` : '<span class="meta">未启用</span>'}
    </div>`;
  }).join("");
}
async function saveCurrencyDraft() {
  if (!currencyDraft || currencyEditorBusy) return;
  try {
    if ([...$("#customCurrencyForm").elements].some(input => input.name && input.value)) throw new Error("请先点击“加入列表”，或清空尚未添加的货币信息。");
    flushCurrencyRates();
    const known = new Set(draftCurrencies().map(item => item.code));
    const required = [currencyDraft.baseCurrency, ...state.accounts.map(account => account.currency)];
    if (required.some(code => !known.has(code) || !currencyDraft.enabledCurrencies.includes(code))) throw new Error("主货币和账户使用的币种必须保留并启用。");
    for (const code of currencyDraft.enabledCurrencies) {
      const rate = Number(currencyDraft.rates[code]);
      if (!Number.isFinite(rate) || rate <= 0) throw new Error(`请填写 ${code} 的有效正数汇率。`);
    }
    const changedRates = Object.entries(currencyDraft.rates).some(([code, value]) => value !== state.settings.rates[code]);
    const previous = structuredClone(state);
    currencyEditorBusy = true;
    Object.assign(state.settings, structuredClone(currencyDraft));
    if (changedRates) syncLatestSnapshotRates();
    if (!saveState()) { state = previous; throw new Error("保存失败，原数据已保留；请检查存储空间后重试。"); }
    currencyDraft = null;
    currencyPendingRates = {};
    renderAll();
    await closeSettingsSheet($("#currencySettingsSheet"));
  } catch (error) { setCurrencyConfigStatus(error.message, "error"); }
  finally { currencyEditorBusy = false; }
}
async function prepareCurrencyImport(content) {
  const imported = JSON.parse(content);
  if (!isPlainObject(imported) || typeof imported.baseCurrency !== "string" || !Array.isArray(imported.enabledCurrencies) || !isPlainObject(imported.rates)) throw new Error("请选择本应用导出的货币配置 JSON。");
  const required = [imported.baseCurrency, ...imported.enabledCurrencies];
  if (Object.values(imported.rates).some(value => typeof value !== "number" || !Number.isFinite(value) || value <= 0) || required.some(code => !Object.hasOwn(imported.rates,code))) throw new Error("配置缺少汇率或含无效汇率，未导入。");
  if (imported.customCurrencies !== undefined && (!Array.isArray(imported.customCurrencies) || imported.customCurrencies.some(item => !isPlainObject(item) || !/^[A-Z0-9]{2,6}$/.test(item.code) || typeof item.name !== "string" || !item.name.trim() || typeof item.symbol !== "string" || !item.symbol.trim()))) throw new Error("自定义货币信息无效，未导入。");
  const normalized = normalizeCurrencySettings(imported, state.accounts, state.settings);
  if (normalized.baseCurrency !== imported.baseCurrency || imported.enabledCurrencies.some(code => !normalized.enabledCurrencies.includes(code))) throw new Error("配置包含无法识别的主货币或启用币种，未导入。");
  const current = currencyDraft;
  const labels = {baseCurrency:"主货币", enabledCurrencies:"启用币种",customCurrencies:"自定义币种",deletedCurrencyCodes:"删除列表",rates:"汇率"};
  const changed = CURRENCY_FIELDS.filter(key => JSON.stringify(normalized[key]) !== JSON.stringify(current[key])).map(key => labels[key]);
  const ok = await confirmDialog(`主货币：${current.baseCurrency} → ${normalized.baseCurrency}。\n启用币种：${current.enabledCurrencies.length} → ${normalized.enabledCurrencies.length}。\n${changed.length ? `变更项：${changed.join("、")}` : "配置没有变化"}；账户正在使用的币种会保留。\n\n${currencyDraftDirty() ? "当前未保存修改将被替换。" : ""}确认后仅更新草稿，点击保存设置才生效。`, {title:"导入货币配置",confirmText:"载入草稿",cancelText:"取消"});
  if (!ok || currencyDraft !== current) return;
  currencyDraft = currencyConfigCopy(normalized);
  currencyPendingRates = {};
  selectedCurrencyCodes.clear();
  $("#customCurrencyForm").reset();
  renderCurrencyDraft();
  setCurrencyConfigStatus("已载入草稿，请检查后保存设置。");
}
function bindCurrencySettings() {
  $("#currencyForm").addEventListener("submit", event => { event.preventDefault(); saveCurrencyDraft(); });
  $("#currencyCancel").addEventListener("click", () => closeSettingsSheet($("#currencySettingsSheet")));
  $("#currencyChoices").addEventListener("input", event => {
    if (event.target.dataset.currencyRate) currencyPendingRates[event.target.dataset.currencyRate] = event.target.value;
  });
  $("#currencyChoices").addEventListener("change", event => {
    const input = event.target;
    if (input.dataset.selectCurrency) {
      if (input.checked) selectedCurrencyCodes.add(input.dataset.selectCurrency); else selectedCurrencyCodes.delete(input.dataset.selectCurrency);
      $("#deleteSelectedCurrencies").disabled = !selectedCurrencyCodes.size;
    }
    if (input.dataset.enableCurrency) {
      const code = input.dataset.enableCurrency;
      currencyDraft.enabledCurrencies = input.checked ? [...new Set([...currencyDraft.enabledCurrencies, code])] : currencyDraft.enabledCurrencies.filter(item => item !== code);
      renderCurrencyDraft();
    }
  });
  $("#baseCurrency").addEventListener("change", event => {
    try {
      flushCurrencyRates();
      const code = event.target.value;
      if (!(Number(currencyDraft.rates[code]) > 0)) throw new Error("请先启用该货币并填写汇率，再设为主货币。");
      currencyDraft.baseCurrency = code;
      currencyDraft.enabledCurrencies = [...new Set([...currencyDraft.enabledCurrencies, code])];
      renderCurrencyDraft();
      setCurrencyConfigStatus("");
    } catch (error) { event.target.value = currencyDraft.baseCurrency; setCurrencyConfigStatus(error.message,"error"); }
  });
  $("#toggleCurrencyManage").addEventListener("click", () => { currencyManageMode = !currencyManageMode; selectedCurrencyCodes.clear(); renderCurrencyDraft(); });
  $("#deleteSelectedCurrencies").addEventListener("click", async () => {
    const draft = currencyDraft;
    const selected = [...selectedCurrencyCodes];
    const used = new Set([draft.baseCurrency, ...state.accounts.map(account => account.currency)]);
    if (selected.some(code => used.has(code))) return setCurrencyConfigStatus("主货币或账户使用的币种不能删除。","error");
    if (!selected.length || !await confirmDialog(`从草稿删除：${selected.join("、")}？保存设置后生效。`,{title:"删除币种",confirmText:"删除",cancelText:"取消"}) || currencyDraft !== draft) return;
    draft.enabledCurrencies = draft.enabledCurrencies.filter(code => !selected.includes(code));
    draft.customCurrencies = draft.customCurrencies.filter(item => !selected.includes(item.code));
    draft.deletedCurrencyCodes = [...new Set([...draft.deletedCurrencyCodes, ...selected.filter(code => currencies.some(item => item.code === code))])];
    selected.forEach(code => { delete draft.rates[code]; delete currencyPendingRates[code]; });
    selectedCurrencyCodes.clear();renderCurrencyDraft();
  });
  $("#customCurrencyForm").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const code=form.elements.code.value.trim().toUpperCase(),name=form.elements.name.value.trim(),symbol=form.elements.symbol.value.trim();
    if (!/^[A-Z0-9]{2,6}$/.test(code) || !name || !symbol) return setCurrencyConfigStatus("请填写 2–6 位货币代码、名称和符号。","error");
    if (draftCurrencies().some(item=>item.code===code)) return setCurrencyConfigStatus(`${code} 已存在。`,"error");
    currencyDraft.deletedCurrencyCodes=currencyDraft.deletedCurrencyCodes.filter(item=>item!==code);
    if (!currencies.some(item=>item.code===code)) currencyDraft.customCurrencies.push({code,name,symbol,rate:1});
    currencyDraft.enabledCurrencies.push(code);
    currencyPendingRates[code]="";
    form.reset();renderCurrencyDraft();setCurrencyConfigStatus(`已加入 ${code}，请填写汇率并保存。`);
  });
  $("#chooseCurrencyConfig").addEventListener("click",()=>$("#importCurrencyConfig").click());
  $("#importCurrencyConfig").addEventListener("change",async event=>{
    const file=event.target.files[0],draft=currencyDraft;if(!file)return;
    try {const content=await readFile(file);if(currencyDraft===draft)await prepareCurrencyImport(content);} catch(error){setCurrencyConfigStatus(error.message,"error");}
    event.target.value="";
  });
  $("#exportCurrencyConfig").addEventListener("click",()=>{
    if(currencyDraftDirty())return setCurrencyConfigStatus("请先保存或放弃草稿修改，再导出已保存配置。","error");
    const ok=download(`asset-currency-settings-${new Date().toISOString().slice(0,10)}.json`,currencySettingsPayload(),"application/json;charset=utf-8");
    setCurrencyConfigStatus(ok?"已导出已保存配置。":"导出失败。",ok?"success":"error");
  });
}
