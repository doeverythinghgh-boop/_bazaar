/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
(function(window){
  "use strict";

  const currentSubTypes = {}; // To remember selection per category

  // Helper to ensure langu is always available
  const L = (key, replacements) => {
    if (typeof window.langu === 'function') return window.langu(key, replacements);
    return key;
  };

  function renderTable(container, titleEl, noteEl, category, onRowSelect) {
    const data = window.dataMap[category];
    if (!data) return;

    // Clear title and add text + dropdown if needed
    if (titleEl) {
      const translatedTitle = L(data.title);
      titleEl.innerHTML = `<span id="tableTitleText-${category}">📋 ${translatedTitle}</span>`;
    }

    let activeRows = data.rows;
    let activeColumns = data.columns;
    let activeNote = data.note || '';

    if (data.subTypes) {
      const subKeys = Object.keys(data.subTypes);
      const currentKey = currentSubTypes[category] || subKeys[0];
      currentSubTypes[category] = currentKey;

      const subData = data.subTypes[currentKey];
      activeRows = subData.rows;
      activeColumns = subData.columns;
      activeNote = subData.note || data.note || `cs_table_standard_note`;

      // Create Select Dropdown
      const select = document.createElement('select');
      select.id = `subCategorySelect-${category}`;
      select.className = 'sub-category-select';
      select.style.marginRight = '15px';

      subKeys.forEach((key, idx) => {
        const opt = document.createElement('option');
        opt.id = `subCategoryOption-${category}-${key}`;
        opt.value = key;
        opt.textContent = L(data.subTypes[key].name);
        if (key === currentKey) opt.selected = true;
        select.appendChild(opt);
      });

      select.addEventListener('change', (e) => {
        currentSubTypes[category] = e.target.value;
        renderTable(container, titleEl, noteEl, category, onRowSelect);
      });

      if (titleEl) titleEl.appendChild(select);
    }

    if (noteEl) {
      const translatedNote = L(activeNote, { note: '' });
      const interactionHint = L('cs_table_interaction_note', { note: translatedNote });
      noteEl.textContent = interactionHint;
      noteEl.id = `tableNote-${category}`;
    }

    if (container) {
      let html = `<table id="mainTable-${category}">`;
      html += `<thead id="mainTableHead-${category}"><tr id="mainTableHeadRow-${category}">`;
      activeColumns.forEach((col, idx) => {
        html += `<th id="mainTableHeadCell-${category}-${idx}">${L(col)}</th>`;
      });
      html += `</tr></thead><tbody id="mainTableBody-${category}">`;

      activeRows.forEach((row, index) => {
        html += `<tr id="mainTableRow-${category}-${index}" data-index="${index}">`;
        row.forEach((cell, cellIdx) => {
          html += `<td id="mainTableCell-${category}-${index}-${cellIdx}">${L(cell)}</td>`;
        });
        html += `</tr>`;
      });

      html += `</tbody></table>`;
      container.innerHTML = html;

      const rows = container.querySelectorAll('tr[data-index]');
      rows.forEach(rowEl => {
        rowEl.addEventListener('click', () => {
          selectRow(container, category, parseInt(rowEl.dataset.index), onRowSelect, activeColumns, activeRows);
        });
      });

      if (rows.length > 0) {
        selectRow(container, category, 0, onRowSelect, activeColumns, activeRows);
      }
    }
  }

  function selectRow(container, category, rowIndex, onRowSelect, activeColumns, activeRows) {
    const rowData = activeRows[rowIndex];
    if (!container) return;
    const rows = container.querySelectorAll('tr[data-index]');

    rows.forEach(r => r.classList.remove('selected-row'));
    const targetRow = container.querySelector(`tr[data-index="${rowIndex}"]`);
    if (targetRow) targetRow.classList.add('selected-row');

    const customValues = {};
    activeColumns.forEach((col, i) => {
      const val = rowData[i];
      const translatedCol = L(col);

      if (col === 'cs_label_chest' || col === 'cs_label_chest_cm' || translatedCol.includes('الصدر')) customValues.chest = val;
      if (col === 'cs_label_length' || col === 'cs_label_length_cm' || translatedCol.includes('الطول')) customValues.length = val;
      if (col === 'cs_label_waist' || col === 'cs_label_waist_cm' || translatedCol.includes('الخصر')) customValues.waist = val;
      if (col === 'cs_label_hips' || col === 'cs_label_hips_cm' || translatedCol.includes('الأرداف')) customValues.hip = val;
      if (col === 'cs_label_width' || col === 'cs_label_width_cm' || translatedCol.includes('العرض')) customValues.width = val;
      if (col === 'cs_label_abaya_length' || col === 'cs_label_abaya_length_cm' || translatedCol.includes('طول العباية')) customValues.length = val;
      if (col === 'cs_label_foot_length' || col === 'cs_label_foot_length_cm' || translatedCol.includes('طول القدم')) customValues.footLength = val;
      if (col === 'cs_label_type' || col === 'cs_label_type' || translatedCol === 'النوع') customValues.type = val;
      if (col === 'cs_label_age' || col === 'cs_label_approx_age' || translatedCol === 'العمر' || translatedCol === 'العمر التقريبي') customValues.age = val;
      if (col === 'cs_label_size' || translatedCol === 'المقاس') customValues.sizeLabel = val;
    });

    // Handle height for kids clothing
    if (category === 'kids') {
      activeColumns.forEach((col, i) => {
        if (col === 'cs_label_length_cm' || L(col) === 'الطول (سم)') customValues.height = rowData[i];
      });
    }

    // Add subType info for SVG engine
    customValues.subType = currentSubTypes[category];

    if (onRowSelect) onRowSelect(category, customValues);
  }

  window.TableManager = { renderTable };
})(window);
