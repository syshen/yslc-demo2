// 使用 Script Properties 存取 Supabase URL 和 Key
function getSupabaseCredentials() {
  const scriptProperties = PropertiesService.getScriptProperties();
  return {
    SUPABASE_URL: scriptProperties.getProperty('SUPABASE_URL'),
    SUPABASE_KEY: scriptProperties.getProperty('SUPABASE_KEY'),
  };
}

function syncSheetToSupabase(tableName, fields, sheetName) {
  const ui = SpreadsheetApp.getUi();
  const uiResponse = ui.alert(
    '同步確認',
    '同步操作將比對 Google Sheets 和 Supabase 資料，是否繼續？',
    ui.ButtonSet.YES_NO
  );

  // 如果用戶選擇 "NO"，則取消同步
  if (uiResponse == ui.Button.NO) {
    ui.alert('同步已取消');
    return;
  }

  const credentials = getSupabaseCredentials();
  const SUPABASE_URL = credentials.SUPABASE_URL;
  const SUPABASE_KEY = credentials.SUPABASE_KEY;

  // 發送 GET 請求到 Supabase 獲取現有資料
  const options = {
    method: 'get',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  };

  const fieldList = fields.join(',');
  const response = UrlFetchApp.fetch(
    `${SUPABASE_URL}/rest/v1/${tableName}?select=${fieldList}`,
    options
  );
  const supabaseData = JSON.parse(response.getContentText());
  const supabaseDataMap = {};
  supabaseData.forEach((row) => {
    supabaseDataMap[row.id] = row;
  });

  // 獲取 Google Spreadsheet 中的數據
  // const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length === 0 || (data.length === 1 && data[0][0].trim() === '')) {
    // 目前 Sheet 中是空的
    sheet.clear(); // 清除現有數據
    // 插入標題行
    const keys = Object.keys(supabaseData[0]);
    sheet.appendRow(keys);

    // 插入數據行
    supabaseData.forEach((row) => {
      const values = keys.map((key) => row[key]);
      sheet.appendRow(values);
    });
    ui.alert('同步完成');
    return;
  }

  const headers = data[0];
  const idIndex = headers.indexOf('id');

  // 準備更新和插入的資料
  const updateData = [];
  const insertData = [];
  const newRows = [];

  const sheetDataMap = {};
  data.slice(1).forEach((row) => {
    const rowData = {};
    headers.forEach((header, index) => {
      rowData[header] = row[index];
    });
    const id = row[idIndex];
    if (id) {
      sheetDataMap[id] = rowData;
      if (supabaseDataMap[id]) {
        // 如果 Supabase 中已存在該 id，則更新
        const supabaseRow = supabaseDataMap[id];
        const needsUpdate = headers.some((header) =>
          rowData[header] === ''
            ? supabaseRow[header] !== null
            : rowData[header] !== supabaseRow[header]
        );
        if (needsUpdate) {
          updateData.push(rowData);
        }
      } else {
        // 如果 Supabase 中不存在該 id，則新增到 Sheet 中
        newRows.push(rowData);
      }
    } else {
      // 如果 id 為空，則插入
      const insertRowData = {};
      headers.forEach((header, index) => {
        if (header !== 'id') {
          insertRowData[header] = row[index];
        }
      });
      insertData.push(insertRowData);
    }
  });

  // 在 Sheet 中添加新的行
  newRows.forEach((rowData) => {
    const newRow = headers.map((header) => rowData[header]);
    sheet.appendRow(newRow);
  });

  // 發送更新請求到 Supabase
  if (updateData.length > 0) {
    for (let i = 0; i < updateData.length; i++) {
      const update = updateData[i];
      const id = parseInt(update['id']);
      delete update['id'];
      const updateOptions = {
        method: 'patch',
        contentType: 'application/json',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        payload: JSON.stringify(update),
      };
      Logger.log(parseInt(update['id']));
      const updateResponse = UrlFetchApp.fetch(
        `${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${id}`,
        updateOptions
      );
      Logger.log(updateResponse.getContentText());
    }
  }

  // 發送插入請求到 Supabase
  if (insertData.length > 0) {
    const insertOptions = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      payload: JSON.stringify(insertData),
    };
    const insertResponse = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/${tableName}`, insertOptions);
    Logger.log(insertResponse.getContentText());
  }

  ui.alert('同步完成');
}

// 添加自定義選單
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Custom Menu')
    .addItem('同步客戶表單', 'syncSheetToSupabaseCustomers')
    .addItem('同步產品表單', 'syncSheetToSupabaseProducts')
    .addToUi();
}

// 包裝函數，以便在選單中調用
function syncSheetToSupabaseCustomers() {
  syncSheetToSupabase(
    'customers',
    ['id', 'name', 'group_id', 'contact_phone_1', 'contact_phone_2', 'shipping_address'],
    '客戶名單'
  );
}

function syncSheetToSupabaseProducts() {
  syncSheetToSupabase(
    'products',
    ['id', 'name', 'product_id', 'unit', 'unit_price', 'spec'],
    '產品清單'
  );
}
