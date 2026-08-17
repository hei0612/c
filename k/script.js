let userProfile = {
  gender: 'male',
  age: 25,
  height: 170,
  weight: 65,
  activity: 1.55,
  goal: 1.0,
  diet: 'balanced'
};

let todayData = {
  date: getTodayStr(),
  goalCal: 2000,
  goalP: 125,
  goalC: 250,
  goalF: 56,
  items: []
};

let historyData = [];
let customRecipes = [];
let calculatedTarget = { cal: 2000, p: 125, c: 250, f: 56 };

const MEAL_NAMES = {
  breakfast: '🌅 早餐',
  lunch: '☀️ 午餐',
  dinner: '🌙 晚餐',
  snack: '🍿 小食 / 飲品'
};

const totalCalEl = document.getElementById('total-cal');
const goalCalDisplay = document.getElementById('goal-cal-display');
const statusTextEl = document.getElementById('status-text');
const progressFillEl = document.getElementById('progress-fill');
const currentDateDisplay = document.getElementById('current-date-display');
const itemCountEl = document.getElementById('item-count');
const mealSectionsContainer = document.getElementById('meal-sections-container');

window.addEventListener('DOMContentLoaded', () => {
  loadDataFromStorage();
  checkDateRollover();
  currentDateDisplay.textContent = todayData.date;
  populateProfileInputs();
  renderCustomRecipesUI();
  updateTodayUI();
  renderHistoryUI();
});

function getTodayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function switchTab(tabName) {
  document.getElementById('tab-btn-today').classList.toggle('active', tabName === 'today');
  document.getElementById('tab-btn-calc').classList.toggle('active', tabName === 'calc');
  document.getElementById('tab-btn-history').classList.toggle('active', tabName === 'history');
  document.getElementById('tab-btn-guide').classList.toggle('active', tabName === 'guide');
  
  document.getElementById('tab-today').classList.toggle('active', tabName === 'today');
  document.getElementById('tab-calc').classList.toggle('active', tabName === 'calc');
  document.getElementById('tab-history').classList.toggle('active', tabName === 'history');
  document.getElementById('tab-guide').classList.toggle('active', tabName === 'guide');

  if (tabName === 'history') {
    renderHistoryUI();
    draw7DayChart();
  }
}

function saveDataToStorage() {
  localStorage.setItem('calorie_pro_today', JSON.stringify(todayData));
  localStorage.setItem('calorie_pro_history', JSON.stringify(historyData));
  localStorage.setItem('calorie_pro_profile', JSON.stringify(userProfile));
  localStorage.setItem('calorie_pro_recipes', JSON.stringify(customRecipes));
}

function loadDataFromStorage() {
  const savedToday = localStorage.getItem('calorie_pro_today');
  if (savedToday) { try { todayData = JSON.parse(savedToday); } catch (e) {} }

  const savedHistory = localStorage.getItem('calorie_pro_history');
  if (savedHistory) { try { historyData = JSON.parse(savedHistory); } catch (e) {} }

  const savedProfile = localStorage.getItem('calorie_pro_profile');
  if (savedProfile) { try { userProfile = JSON.parse(savedProfile); } catch (e) {} }

  const savedRecipes = localStorage.getItem('calorie_pro_recipes');
  if (savedRecipes) { try { customRecipes = JSON.parse(savedRecipes); } catch (e) {} }
}

function checkDateRollover() {
  const todayStr = getTodayStr();
  if (todayData.date && todayData.date !== todayStr) {
    if (todayData.items && todayData.items.length > 0) {
      archiveDataRecord(todayData);
    }
    todayData = {
      date: todayStr,
      goalCal: todayData.goalCal || 2000,
      goalP: todayData.goalP || 125,
      goalC: todayData.goalC || 250,
      goalF: todayData.goalF || 56,
      items: []
    };
    saveDataToStorage();
  }
}

function populateProfileInputs() {
  document.getElementById('calc-gender').value = userProfile.gender || 'male';
  document.getElementById('calc-age').value = userProfile.age || 25;
  document.getElementById('calc-height').value = userProfile.height || 170;
  document.getElementById('calc-weight').value = userProfile.weight || 65;
  document.getElementById('calc-activity').value = userProfile.activity || 1.55;
  document.getElementById('calc-goal').value = userProfile.goal || 1.0;
  document.getElementById('calc-diet').value = userProfile.diet || 'balanced';
}

function calculateMetrics() {
  userProfile.gender = document.getElementById('calc-gender').value;
  userProfile.age = parseFloat(document.getElementById('calc-age').value) || 25;
  userProfile.height = parseFloat(document.getElementById('calc-height').value) || 170;
  userProfile.weight = parseFloat(document.getElementById('calc-weight').value) || 65;
  userProfile.activity = parseFloat(document.getElementById('calc-activity').value) || 1.55;
  userProfile.goal = parseFloat(document.getElementById('calc-goal').value) || 1.0;
  userProfile.diet = document.getElementById('calc-diet').value;
  saveDataToStorage();

  const { gender, age, height, weight, activity, goal, diet } = userProfile;

  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  bmr += (gender === 'male') ? 5 : -161;

  const tdee = bmr * activity;
  const targetCal = Math.round(tdee * goal);

  let pRatio = 0.25, cRatio = 0.50, fRatio = 0.25;
  if (diet === 'high_protein') { pRatio = 0.35; cRatio = 0.40; fRatio = 0.25; }
  else if (diet === 'low_carb') { pRatio = 0.30; cRatio = 0.25; fRatio = 0.45; }

  const pGrams = Math.round((targetCal * pRatio) / 4);
  const cGrams = Math.round((targetCal * cRatio) / 4);
  const fGrams = Math.round((targetCal * fRatio) / 9);

  calculatedTarget = { cal: targetCal, p: pGrams, c: cGrams, f: fGrams };

  document.getElementById('res-bmr').textContent = Math.round(bmr);
  document.getElementById('res-tdee').textContent = Math.round(tdee);
  document.getElementById('res-target').textContent = targetCal;
  document.getElementById('res-protein').textContent = `${pGrams}g`;
  document.getElementById('res-carbs').textContent = `${cGrams}g`;
  document.getElementById('res-fat').textContent = `${fGrams}g`;

  document.getElementById('calc-result-card').style.display = 'block';
}

function applyCalculatedGoal() {
  todayData.goalCal = calculatedTarget.cal;
  todayData.goalP = calculatedTarget.p;
  todayData.goalC = calculatedTarget.c;
  todayData.goalF = calculatedTarget.f;

  saveDataToStorage();
  updateTodayUI();
  alert('已成功同步目標卡路里與三大營養素配額！');
  switchTab('today');
}

document.getElementById('add-btn').addEventListener('click', () => {
  const meal = document.getElementById('food-meal').value;
  const name = document.getElementById('food-name').value.trim();
  const cal = parseInt(document.getElementById('food-cal').value) || 0;
  const p = parseInt(document.getElementById('food-p').value) || 0;
  const c = parseInt(document.getElementById('food-c').value) || 0;
  const f = parseInt(document.getElementById('food-f').value) || 0;

  if (!name || cal <= 0) {
    alert('請輸入有效的食物名稱與卡路里！');
    return;
  }

  addFoodItem(meal, name, cal, p, c, f);
  document.getElementById('food-name').value = '';
  document.getElementById('food-cal').value = '';
  document.getElementById('food-p').value = '';
  document.getElementById('food-c').value = '';
  document.getElementById('food-f').value = '';
});

function quickAdd(meal, name, cal, p, c, f) { addFoodItem(meal, name, cal, p, c, f); }

function addFoodItem(meal, name, calories, p, c, f) {
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  todayData.items.push({ id: Date.now(), meal, name, calories, p, c, f, time: timeStr });
  saveDataToStorage();
  updateTodayUI();
}

function deleteFoodItem(id) {
  todayData.items = todayData.items.filter(item => item.id !== id);
  saveDataToStorage();
  updateTodayUI();
}

function clearTodayList() {
  if (confirm('確定清空今日所有紀錄？')) {
    todayData.items = [];
    saveDataToStorage();
    updateTodayUI();
  }
}

function copyYesterdayMeal() {
  const currentMeal = document.getElementById('food-meal').value;
  if (historyData.length === 0) {
    alert('尚無歷史紀錄可供複製！');
    return;
  }
  
  const lastRecord = historyData[0];
  const targetItems = (lastRecord.items || []).filter(item => item.meal === currentMeal);

  if (targetItems.length === 0) {
    alert(`昨日【${MEAL_NAMES[currentMeal]}】無紀錄！`);
    return;
  }

  targetItems.forEach(item => {
    addFoodItem(item.meal, `${item.name} (複製)`, item.calories, item.p || 0, item.c || 0, item.f || 0);
  });
  alert(`已成功複製昨日 ${MEAL_NAMES[currentMeal]} 的 ${targetItems.length} 項食物！`);
}

function saveCurrentMealAsRecipe() {
  const mealType = document.getElementById('food-meal').value;
  const currentMealItems = todayData.items.filter(i => i.meal === mealType);
  
  if (currentMealItems.length === 0) {
    alert('當前餐次沒有食物可儲存！');
    return;
  }

  const recipeName = prompt('請輸入此食譜組合名稱（例如：高蛋白減脂早餐）：');
  if (!recipeName) return;

  const totalCal = currentMealItems.reduce((s, i) => s + i.calories, 0);
  const totalP = currentMealItems.reduce((s, i) => s + (i.p || 0), 0);
  const totalC = currentMealItems.reduce((s, i) => s + (i.c || 0), 0);
  const totalF = currentMealItems.reduce((s, i) => s + (i.f || 0), 0);

  customRecipes.push({
    id: Date.now(),
    name: recipeName,
    meal: mealType,
    cal: totalCal,
    p: totalP,
    c: totalC,
    f: totalF
  });

  saveDataToStorage();
  renderCustomRecipesUI();
  alert(`食譜【${recipeName}】已儲存！已加入下方快捷標籤。`);
}

function renderCustomRecipesUI() {
  const container = document.getElementById('quick-tags-container');
  if (!container) return;

  document.querySelectorAll('.recipe-tag').forEach(el => el.remove());

  customRecipes.forEach(recipe => {
    const tag = document.createElement('span');
    tag.className = 'tag recipe-tag';
    tag.style.borderColor = 'var(--accent-color)';
    tag.style.background = '#fff7ed';
    tag.style.color = '#c2410c';
    tag.textContent = `⭐ ${recipe.name} (${recipe.cal}k)`;
    tag.onclick = () => quickAdd(recipe.meal, recipe.name, recipe.cal, recipe.p, recipe.c, recipe.f);
    container.appendChild(tag);
  });
}

async function searchFoodAPI() {
  const query = document.getElementById('off-search-input').value.trim();
  const resultsContainer = document.getElementById('api-search-results');
  if (!query) return;

  resultsContainer.innerHTML = '🔍 搜尋中...';

  try {
    const isBarcode = /^\d+$/.test(query);
    let apiUrl = isBarcode 
      ? `https://world.openfoodfacts.org/api/v2/product/${query}.json`
      : `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5`;

    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP 狀態碼 ${res.status}`);

    const data = await res.json();
    resultsContainer.innerHTML = '';

    let products = [];
    if (isBarcode && data.product) {
      products = [data.product];
    } else if (data.products && data.products.length > 0) {
      products = data.products.slice(0, 5);
    }

    if (products.length === 0) {
      resultsContainer.innerHTML = '<div class="muted-text">未找到相關食品資料，請嘗試其他關鍵字或輸入包裝條碼</div>';
      return;
    }

    products.forEach(p => {
      const name = p.product_name || p.product_name_zh || p.product_name_en || '未命名食品';
      const nut = p.nutriments || {};
      const cal = Math.round(nut['energy-kcal_100g'] || nut['energy-kcal'] || (nut['energy-kj_100g'] ? nut['energy-kj_100g'] / 4.184 : 0));
      const protein = Math.round(nut.proteins_100g || nut.proteins || 0);
      const carbs = Math.round(nut.carbohydrates_100g || nut.carbohydrates || 0);
      const fat = Math.round(nut.fat_100g || nut.fat || 0);

      const itemDiv = document.createElement('div');
      itemDiv.style.cssText = 'padding: 6px; border-bottom: 1px solid #eee; cursor: pointer; display: flex; justify-content: space-between; font-size: 0.8rem;';
      itemDiv.innerHTML = `
        <span><strong>${escapeHtml(name)}</strong> (每100g)</span>
        <span style="color:var(--primary-dark);">${cal} kcal | P:${protein} C:${carbs} F:${fat}</span>
      `;
      itemDiv.onclick = () => {
        document.getElementById('food-name').value = `${name} (100g)`;
        document.getElementById('food-cal').value = cal;
        document.getElementById('food-p').value = protein;
        document.getElementById('food-c').value = carbs;
        document.getElementById('food-f').value = fat;
        resultsContainer.innerHTML = '';
      };
      resultsContainer.appendChild(itemDiv);
    });
  } catch (err) {
    console.error('OFF API Error:', err);
    resultsContainer.innerHTML = `<span style="color:red; font-size:0.75rem;">❌ 連線失敗：${err.message}</span>`;
  }
}

function triggerAIUpload() {
  const apiKey = document.getElementById('gemini-api-key').value.trim();
  if (!apiKey) {
    alert('請先輸入 Gemini API Key！');
    return;
  }
  document.getElementById('ai-photo-input').click();
}

async function handleAIPhotoUpload(event) {
  const file = event.target.files[0];
  const apiKey = document.getElementById('gemini-api-key').value.trim();
  const statusEl = document.getElementById('ai-status');

  if (!file) return;
  if (!apiKey) {
    alert('請先輸入 Gemini API Key！');
    return;
  }

  statusEl.textContent = '⏳ AI 正在辨識食物並估算熱量...';

  const reader = new FileReader();
  reader.onload = async function (e) {
    const base64Data = e.target.result.split(',')[1];
    const promptText = `分析這張圖片中的食物，估算總卡路里與三大營養素。只返回標準 JSON 格式，不要有任何 Markdown 或多餘文字：{"name": "食物名稱", "calories": 數字, "p": 蛋白質g數, "c": 碳水g數, "f": 脂肪g數}`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: promptText },
              { inline_data: { mime_type: file.type, data: base64Data } }
            ]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP Status ${response.status}`);
      }

      const resData = await response.json();
      const rawText = resData.candidates[0].content.parts[0].text;
      const cleanJson = JSON.parse(rawText.replace(/```json|```/g, '').trim());

      document.getElementById('food-name').value = cleanJson.name || 'AI 辨識食物';
      document.getElementById('food-cal').value = cleanJson.calories || 0;
      document.getElementById('food-p').value = cleanJson.p || 0;
      document.getElementById('food-c').value = cleanJson.c || 0;
      document.getElementById('food-f').value = cleanJson.f || 0;
      statusEl.textContent = `✅ 辨識成功：${cleanJson.name}`;
    } catch (err) {
      console.error('Gemini API Error:', err);
      statusEl.textContent = `❌ 分析失敗：${err.message || '請檢查 API Key、網路或圖片'}`;
    }
  };
  reader.readAsDataURL(file);
}

function updateTodayUI() {
  let totalCal = 0, totalP = 0, totalC = 0, totalF = 0;

  todayData.items.forEach(i => {
    totalCal += i.calories;
    totalP += (i.p || 0);
    totalC += (i.c || 0);
    totalF += (i.f || 0);
  });

  const goalCal = todayData.goalCal || 2000;
  const goalP = todayData.goalP || 125;
  const goalC = todayData.goalC || 250;
  const goalF = todayData.goalF || 56;

  totalCalEl.textContent = totalCal;
  goalCalDisplay.textContent = goalCal;
  itemCountEl.textContent = `${todayData.items.length} 項紀錄`;

  const remCal = goalCal - totalCal;
  if (remCal >= 0) {
    statusTextEl.textContent = `仲可以食 ${remCal} kcal`;
    statusTextEl.style.color = 'var(--text-muted)';
  } else {
    statusTextEl.textContent = `⚠️ 超標 ${Math.abs(remCal)} kcal！`;
    statusTextEl.style.color = 'var(--danger-color)';
  }

  progressFillEl.style.width = `${Math.min((totalCal / goalCal) * 100, 100)}%`;
  progressFillEl.style.backgroundColor = totalCal > goalCal ? 'var(--danger-color)' : 'var(--primary-color)';

  document.getElementById('total-p').textContent = totalP;
  document.getElementById('target-p').textContent = goalP;
  document.getElementById('fill-p').style.width = `${Math.min((totalP / goalP) * 100, 100)}%`;

  document.getElementById('total-c').textContent = totalC;
  document.getElementById('target-c').textContent = goalC;
  document.getElementById('fill-c').style.width = `${Math.min((totalC / goalC) * 100, 100)}%`;

  document.getElementById('total-f').textContent = totalF;
  document.getElementById('target-f').textContent = goalF;
  document.getElementById('fill-f').style.width = `${Math.min((totalF / goalF) * 100, 100)}%`;

  renderCategorizedMealList();
}

function renderCategorizedMealList() {
  mealSectionsContainer.innerHTML = '';

  if (todayData.items.length === 0) {
    mealSectionsContainer.innerHTML = '<div class="empty-state">今日暫未有紀錄，今餐食咗咩？</div>';
    return;
  }

  const categories = ['breakfast', 'lunch', 'dinner', 'snack'];

  categories.forEach(catKey => {
    const catItems = todayData.items.filter(i => (i.meal || 'lunch') === catKey);
    if (catItems.length === 0) return;

    const catCal = catItems.reduce((sum, item) => sum + item.calories, 0);
    const mealGroup = document.createElement('div');
    mealGroup.className = 'meal-group';

    let itemsHTML = catItems.map(item => `
      <li class="food-item">
        <div>
          <div style="font-weight:500;">${escapeHtml(item.name)}</div>
          <div class="macro-badges">
            ${item.time ? item.time + ' • ' : ''} P:${item.p||0}g | C:${item.c||0}g | F:${item.f||0}g
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:var(--accent-color); font-weight:bold;">${item.calories} k</span>
          <button class="btn-delete" onclick="deleteFoodItem(${item.id})">&times;</button>
        </div>
      </li>
    `).join('');

    mealGroup.innerHTML = `
      <div class="meal-group-header">
        <span>${MEAL_NAMES[catKey]}</span>
        <span style="color:var(--primary-dark);">${catCal} kcal</span>
      </div>
      <ul class="food-list">${itemsHTML}</ul>
    `;

    mealSectionsContainer.appendChild(mealGroup);
  });
}

function draw7DayChart() {
  const canvas = document.getElementById('trend-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    
    let cal = 0;
    if (dateStr === todayData.date) {
      cal = todayData.items.reduce((s, item) => s + item.calories, 0);
    } else {
      const h = historyData.find(x => x.date === dateStr);
      cal = h ? h.total : 0;
    }
    days.push({ label, cal });
  }

  const padding = 30;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  const maxCal = Math.max(todayData.goalCal * 1.3, ...days.map(d => d.cal), 2500);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  const goalY = height - padding - (todayData.goalCal / maxCal) * chartH;
  ctx.strokeStyle = '#e67e22';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(padding, goalY);
  ctx.lineTo(width - padding, goalY);
  ctx.stroke();
  ctx.setLineDash([]);

  const points = days.map((d, index) => {
    const x = padding + (chartW / (days.length - 1)) * index;
    const y = height - padding - (d.cal / maxCal) * chartH;
    return { x, y, cal: d.cal, label: d.label };
  });

  ctx.strokeStyle = '#2ecc71';
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();

  points.forEach(pt => {
    ctx.fillStyle = pt.cal > todayData.goalCal ? '#e74c3c' : '#2ecc71';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7f8c8d';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pt.label, pt.x, height - 8);

    if (pt.cal > 0) {
      ctx.fillStyle = '#2c3e50';
      ctx.fillText(`${pt.cal}`, pt.x, pt.y - 8);
    }
  });
}

function archiveTodayManual() {
  if (todayData.items.length === 0) {
    alert('今日尚未有紀錄，無法歸檔！');
    return;
  }
  if (confirm(`將今日 (${todayData.date}) 歸檔至歷史紀錄？`)) {
    archiveDataRecord(todayData);
    alert('歸檔成功！');
    renderHistoryUI();
  }
}

function archiveDataRecord(recordObj) {
  const totalCal = recordObj.items.reduce((sum, item) => sum + item.calories, 0);
  const totalP = recordObj.items.reduce((sum, item) => sum + (item.p || 0), 0);
  const totalC = recordObj.items.reduce((sum, item) => sum + (item.c || 0), 0);
  const totalF = recordObj.items.reduce((sum, item) => sum + (item.f || 0), 0);

  const existingIdx = historyData.findIndex(h => h.date === recordObj.date);
  const newEntry = {
    date: recordObj.date,
    goal: recordObj.goalCal,
    total: totalCal,
    p: totalP,
    c: totalC,
    f: totalF,
    items: [...recordObj.items]
  };

  if (existingIdx >= 0) historyData[existingIdx] = newEntry;
  else historyData.unshift(newEntry);

  saveDataToStorage();
}

function renderHistoryUI() {
  const totalDays = historyData.length;
  let avgCal = 0, passDays = 0;

  if (totalDays > 0) {
    avgCal = Math.round(historyData.reduce((s, h) => s + h.total, 0) / totalDays);
    passDays = historyData.filter(h => h.total <= h.goal).length;
  }

  document.getElementById('stat-days').textContent = totalDays;
  document.getElementById('stat-avg').textContent = avgCal;
  document.getElementById('stat-rate').textContent = totalDays > 0 ? Math.round((passDays / totalDays) * 100) + '%' : '0%';

  const historyListEl = document.getElementById('history-list');
  historyListEl.innerHTML = '';

  if (historyData.length === 0) {
    historyListEl.innerHTML = '<div class="empty-state">尚無歷史紀錄。</div>';
    return;
  }

  historyData.forEach((record) => {
    const isSuccess = record.total <= record.goal;
    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:bold;">📅 ${record.date}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">
            熱量: ${record.total} / ${record.goal} kcal (P:${record.p||0}g C:${record.c||0}g F:${record.f||0}g)
          </div>
        </div>
        <span class="badge ${isSuccess ? 'badge-success' : 'badge-danger'}">
          ${isSuccess ? '✅ 達標' : '⚠️ 超標'}
        </span>
      </div>
    `;
    historyListEl.appendChild(card);
  });
}

function clearAllHistory() {
  if (confirm('⚠️ 確定要清空所有歷史紀錄？此動作無法撤銷！')) {
    historyData = [];
    saveDataToStorage();
    renderHistoryUI();
    draw7DayChart();
  }
}

function exportDataJSON() {
  const dataToExport = {
    profile: userProfile,
    today: todayData,
    history: historyData,
    recipes: customRecipes,
    exportDate: new Date().toISOString()
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
  downloadFile(dataStr, `calorie_pro_backup_${getTodayStr()}.json`);
}

function exportDataCSV() {
  let csv = "\uFEFF";
  csv += "日期,餐次,食物名稱,卡路里(kcal),蛋白質(g),碳水化合物(g),脂肪(g)\n";

  todayData.items.forEach(i => {
    csv += `"${todayData.date}","${MEAL_NAMES[i.meal] || i.meal}","${i.name}",${i.calories},${i.p||0},${i.c||0},${i.f||0}\n`;
  });

  historyData.forEach(h => {
    (h.items || []).forEach(i => {
      csv += `"${h.date}","${MEAL_NAMES[i.meal] || i.meal}","${i.name}",${i.calories},${i.p||0},${i.c||0},${i.f||0}\n`;
    });
  });

  const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  downloadFile(dataStr, `calorie_pro_records_${getTodayStr()}.csv`);
}

function downloadFile(dataStr, fileName) {
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", fileName);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importDataJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported.today || imported.history) {
        if (imported.profile) userProfile = imported.profile;
        if (imported.today) todayData = imported.today;
        if (imported.history) historyData = imported.history;
        if (imported.recipes) customRecipes = imported.recipes;

        saveDataToStorage();
        populateProfileInputs();
        renderCustomRecipesUI();
        updateTodayUI();
        renderHistoryUI();
        draw7DayChart();
        alert('🎉 資料成功匯入！');
      }
    } catch (err) {
      alert('讀取失敗，請確認是否為標準 JSON 備份檔！');
    }
  };
  reader.readAsText(file);
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}