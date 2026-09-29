/* Preview edits share the existing editor controls and draft/save pipeline. */
(function () {
  const sheet = document.getElementById('previewSheet');
  const grid = document.getElementById('editorGrid');
  if (!sheet || !grid) return;
  let selected = null;
  const panel = document.createElement('aside');
  panel.id = 'directEdit'; panel.hidden = true;
  panel.setAttribute('aria-label', '譜面快速編輯');
  panel.innerHTML = '<header><strong id="directEditTitle">編輯小節</strong><button type="button" data-nav="prev">上一小節</button><button type="button" data-nav="next">下一小節</button><button type="button" data-nav="close">完成</button></header><p>修改會同步到預覽與草稿；完成後仍請按「儲存」。</p><div class="direct-edit-body"></div>';
  document.body.append(panel);
  const hint = document.createElement('p'); hint.className = 'direct-edit-hint';
  hint.textContent = '點一下譜上的音或小節，就能直接修改。'; sheet.before(hint);
  function original() {
    return selected && grid.querySelectorAll('.row-editor')[selected.row]?.querySelectorAll('.measure-card')[selected.measure];
  }
  function highlight() {
    sheet.querySelectorAll('[data-source-row]').forEach(m => m.classList.toggle('direct-selected', !!selected && +m.dataset.sourceRow === selected.row && +m.dataset.sourceMeasure === selected.measure));
  }
  function fill(noteIndex) {
    const card = original(); if (!card) return close();
    const clone = card.cloneNode(true);
    clone.querySelector('h4').remove();
    clone.querySelectorAll('.note-row.head').forEach(e => e.remove());
    const labels = {pitch:'音高',units:'拍值',bowing:'弓法',fingering:'指法',upperNote:'上方小音',slurGroup:'連弓組',underlineDepth:'底線'};
    clone.querySelectorAll('[data-note-field]').forEach(input => {
      const label = document.createElement('label'); label.textContent = labels[input.dataset.noteField];
      input.before(label); label.append(input);
    });
    panel.querySelector('.direct-edit-body').replaceChildren(clone);
    document.getElementById('directEditTitle').textContent = '第 ' + (selected.row + 1) + ' 行・第 ' + (selected.measure + 1) + ' 小節';
    panel.hidden = false; highlight();
    if (noteIndex != null) {
      const visibleRows = [...card.querySelectorAll('[data-note-index].note-row')].filter(r => r.querySelector('[data-note-field="pitch"]').value.trim());
      const index = visibleRows[noteIndex]?.dataset.noteIndex;
      const field = clone.querySelector('.note-row[data-note-index="' + index + '"] [data-note-field="pitch"]');
      if (field) { field.focus({preventScroll:true}); field.scrollIntoView({block:'nearest'}); }
    }
  }
  function close() { panel.hidden = true; const old = selected; selected = null; highlight(); if(old) sheet.querySelector('[data-source-row="'+old.row+'"][data-source-measure="'+old.measure+'"]')?.focus({preventScroll:true}); }
  function open(event) {
    const measure = event.target.closest('[data-source-row]'); if(!measure) return;
    selected = {row:+measure.dataset.sourceRow,measure:+measure.dataset.sourceMeasure};
    const note = event.target.closest('[data-source-note]'); fill(note ? +note.dataset.sourceNote : null);
  }
  sheet.addEventListener('click', open);
  sheet.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' ') {e.preventDefault();open(e);} });
  function sync(e) {
    const card=original(); if(!card) return;
    const input=e.target; let target;
    if(input.dataset.noteField) {
      const index=input.closest('[data-note-index]').dataset.noteIndex;
      target=card.querySelector('.note-row[data-note-index="'+index+'"] [data-note-field="'+input.dataset.noteField+'"]');
    } else if(input.dataset.field) target=card.querySelector('[data-field="'+input.dataset.field+'"]');
    if(target) {target.value=input.value;target.dispatchEvent(new Event('input',{bubbles:true}));}
  }
  panel.addEventListener('input',sync); panel.addEventListener('change',sync);
  panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}});
  panel.addEventListener('click',e=>{
    const button=e.target.closest('button'); if(!button) return;
    const nav=button.dataset.nav;
    if(nav==='close') return close();
    if(nav) {
      const list=[...sheet.querySelectorAll('[data-source-row]')];
      const index=list.findIndex(m=>+m.dataset.sourceRow===selected.row && +m.dataset.sourceMeasure===selected.measure);
      const next=list[index+(nav==='next'?1:-1)];
      if(next){selected={row:+next.dataset.sourceRow,measure:+next.dataset.sourceMeasure};fill();next.scrollIntoView({block:'center',behavior:'smooth'});} return;
    }
    if(button.dataset.action) {
      const card=original(); if(!card)return;
      let selector='[data-action="'+button.dataset.action+'"]';
      if(button.dataset.noteIndex!=null) selector+='[data-note-index="'+button.dataset.noteIndex+'"]';
      card.querySelector(selector)?.click(); fill();
    }
  });
  new MutationObserver(highlight).observe(sheet,{childList:true,subtree:true});
  document.getElementById('pieceSelect')?.addEventListener('change',close);
})();
