import { c as createComponent } from './astro-component_I0zML0fX.mjs';
import 'piccolore';
import { m as maybeRenderHead, r as renderTemplate, l as renderComponent } from './entrypoint_DERourIW.mjs';
import { $ as $$BaseLayout } from './BaseLayout_3q2rzx1a.mjs';
import 'clsx';

const $$TopBar = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$TopBar;
  const {
    initials = "ML",
    name = "María López Herrera",
    idInfo = "CC 1.052.487.903 · Afiliada activa"
  } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="topbar"> <div class="topbar-left"> <div class="avatar">${initials}</div> <div> <div class="topbar-name">${name}</div> <div class="topbar-id">${idInfo}</div> </div> </div> <div class="topbar-right"> <button class="logout-btn" onclick="logoutFunc()">Cerrar sesión</button> </div> </div>`;
}, "C:/Users/USER/Gestion-Inteligente-de-Auxilios-Cooperativos/src/components/TopBar.astro", void 0);

const $$NavigationTabs = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div class="tabs" id="mainTabs"> <div class="tab active" onclick="switchTab('tramites')">Mis trámites</div> <div class="tab" onclick="switchTab('nueva')">Nueva solicitud</div> <div class="tab" onclick="switchTab('programas')">Programas disponibles</div> <div class="tab" onclick="switchTab('notificaciones')">Notificaciones</div> </div>`;
}, "C:/Users/USER/Gestion-Inteligente-de-Auxilios-Cooperativos/src/components/NavigationTabs.astro", void 0);

var __freeze$4 = Object.freeze;
var __defProp$4 = Object.defineProperty;
var __template$4 = (cooked, raw) => __freeze$4(__defProp$4(cooked, "raw", { value: __freeze$4(raw || cooked.slice()) }));
var _a$4;
const $$MisTramites = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate(_a$4 || (_a$4 = __template$4(["", `<div id="view-tramites"> <div class="summary-grid"> <div class="sum-card"> <div class="sum-label">Trámites totales</div> <div class="sum-val" id="stat-totales">0</div> <div class="sum-sub" id="stat-totales-sub">Sin trámites actuales</div> </div> <div class="sum-card"> <div class="sum-label">Último estado</div> <div class="sum-val" id="stat-estado" style="color:var(--text-secondary);">Ninguno</div> <div class="sum-sub" id="stat-estado-sub">-</div> </div> <div class="sum-card"> <div class="sum-label">Beneficio recibido</div> <div class="sum-val">$0</div> <div class="sum-sub">Acumulado 2026</div> </div> </div> <div class="card"> <div class="sec-title"> <span class="sec-title-dot"></span> Mis solicitudes
</div> <!-- Contenedor inyectado dinamicamente --> <div id="tramites-container"> <div style="text-align: center; padding: 2rem 1rem; color: var(--text-secondary); font-size: 13px;">
Cargando trámites...
</div> </div> </div> <!-- Panel IA --> <div class="ia-panel"> <div class="ia-head" id="ia-head"> <span class="ia-title">Análisis IA</span> </div> <div id="ia-content"> <div class="ia-item" style="color:var(--text-secondary);">
No hay análisis de IA activos en este momento.
</div> </div> </div> <!-- Modal Detalle --> <div class="modal-overlay" id="tramite-modal"> <div class="modal-content"> <div class="tr-top" style="margin-bottom: 12px;"> <span class="tr-name" id="modal-title" style="font-size: 16px;">Detalle</span> <span class="modal-close" onclick="closeDetalleModal()">✕</span> </div> <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;"> <strong>ID de Radicado:</strong> <span id="modal-id">...</span> </div> <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;"> <strong>Fecha:</strong> <span id="modal-fecha">...</span> </div> <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;"> <strong>Estado actual:</strong> <span id="modal-estado">...</span> </div> <div class="progress-track" style="margin-bottom: 8px;"> <div class="progress-bar" id="modal-progress" style="width:0%;"></div> </div> <div style="font-size: 12px; color: var(--text-primary); text-align: center; margin-bottom: 1rem;">
Paso actual: <strong id="modal-step">...</strong> </div> <!-- Área de IA en modal --> <div id="modal-ia-box" style="display:none; margin-bottom: 1rem; padding: 10px; background: var(--red-50); border: 0.5px solid var(--red-400); border-radius: var(--radius-md);"> <div style="font-size: 12px; font-weight: 500; color: var(--red-800); margin-bottom: 4px;">Análisis de Riesgo de Rechazo (IA)</div> <div id="modal-ia-rejection-content" style="font-size: 12px; color: var(--text-primary);"></div> </div> <button type="button" class="cancel-btn" id="btn-ia-reject" style="width: 100%; border-color: var(--teal-400); color: var(--teal-400); margin-bottom: 8px; font-weight: 500;">
✨ Analizar riesgo de rechazo (IA)
</button> <div style="display: flex; gap: 8px;"> <button class="submit-btn" style="flex: 1; padding: 8px; font-size: 13px;" onclick="closeDetalleModal()">Cerrar panel</button> <button class="cancel-btn" id="btn-delete-tramite" style="flex: 1; margin-top: 0; padding: 8px; font-size: 13px; border-color: var(--red-400); color: var(--red-400);">Eliminar</button> </div> </div> </div> </div>  <script>
  function renderTramites() {
    const tramites = JSON.parse(localStorage.getItem('tramites') || '[]');
    
    // Update Stats
    document.getElementById('stat-totales').textContent = tramites.length;
    document.getElementById('stat-totales-sub').textContent = tramites.length === 0 ? 'Sin trámites actuales' : (tramites.length + ' trámite(s)');
    
    if (tramites.length > 0) {
      const ultimo = tramites[0];
      const estadoEl = document.getElementById('stat-estado');
      estadoEl.textContent = ultimo.estado;
      
      // Color dependiente del estado
      if (ultimo.estado === 'Aprobado') estadoEl.style.color = 'var(--green-400)';
      else if (ultimo.estado === 'En estudio') estadoEl.style.color = 'var(--amber-400)';
      else if (ultimo.estado === 'Negado') estadoEl.style.color = 'var(--red-400)';
      else estadoEl.style.color = 'var(--blue-600)';
      
      document.getElementById('stat-estado-sub').textContent = ultimo.name;
    } else {
      document.getElementById('stat-estado').textContent = 'Ninguno';
      document.getElementById('stat-estado').style.color = 'var(--text-secondary)';
      document.getElementById('stat-estado-sub').textContent = '-';
    }

    // Update List
    const container = document.getElementById('tramites-container');
    if (tramites.length === 0) {
      container.innerHTML = \`
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-secondary); font-size: 13px;">
          No tienes solicitudes de trámites actualmente.
        </div>\`;
    } else {
      container.innerHTML = tramites.map(tr => \`
        <div class="tramite-row">
          <div class="tr-top">
            <span class="tr-name">\${tr.name}</span>
            <div style="display: flex; gap: 6px; align-items: center;">
              \${tr.riesgo ? \`<span class="badge" style="background:var(--gray-bg); color:var(--text-secondary); border:none;">Factibilidad: \${tr.riesgo}</span>\` : ''}
              <span class="badge \${tr.estadoClass}">\${tr.estado}</span>
            </div>
          </div>
          <div class="tr-mid">
            <span class="tr-tipo">\${tr.tipoBadge}</span>
            <span class="tr-date">\${tr.fechaText}</span>
          </div>
          <div class="progress-track">
            <div class="progress-bar \${tr.progClass}" style="width:\${tr.progWidth}%;"></div>
          </div>
          <div class="tr-foot">
            <span class="tr-step">\${tr.stepText}</span>
            <span class="\${tr.estado === 'Negado' ? 'tr-link-red' : 'tr-link'}" onclick="openDetalleModal(\${tr.id})">\${tr.actionText}</span>
          </div>
        </div>
      \`).join('');
    }

    // Update IA Panel
    const iaContainer = document.getElementById('ia-content');
    const iaHead = document.getElementById('ia-head');
    
    const enEstudioList = tramites.filter(t => t.estado === 'En estudio');
    
    if (enEstudioList.length > 0) {
      if (!document.getElementById('ia-pulse-loader')) {
        iaHead.insertAdjacentHTML('afterbegin', '<div class="ia-pulse" id="ia-pulse-loader"></div>');
      }
      
      iaContainer.innerHTML = \`
        <div class="ia-item"><span class="ia-ic" style="color:var(--green-400);">✓</span> Identidad verificada con documento adjunto</div>
        <div class="ia-item"><span class="ia-ic" style="color:var(--amber-600);">⏳</span> Revisando documentación del evento (\${enEstudioList[0].name})...</div>
        <div class="ia-item" style="color:var(--text-secondary);"><span class="ia-ic">◯</span> Revisión de comité (pendiente resultado IA)</div>
      \`;
    } else {
      const pulse = document.getElementById('ia-pulse-loader');
      if (pulse) pulse.remove();
      
      iaContainer.innerHTML = \`
        <div class="ia-item" style="color:var(--text-secondary);">
          No hay análisis de IA activos en este momento.
        </div>
      \`;
    }
  }

  // Lógica Modal
  function openDetalleModal(id) {
    const tramites = JSON.parse(localStorage.getItem('tramites') || '[]');
    const tr = tramites.find(t => t.id === id);
    if (!tr) return;

    document.getElementById('modal-title').textContent = tr.name;
    document.getElementById('modal-id').textContent = tr.id;
    document.getElementById('modal-fecha').textContent = tr.fechaText;
    
    const est = document.getElementById('modal-estado');
    est.textContent = tr.estado;
    est.className = \`badge \${tr.estadoClass}\`;
    
    const prog = document.getElementById('modal-progress');
    prog.style.width = tr.progWidth + '%';
    // set color based on class
    prog.className = \`progress-bar \${tr.progClass}\`;

    document.getElementById('modal-step').textContent = tr.stepText;
    document.getElementById('btn-delete-tramite').onclick = () => deleteTramite(id);

    // Reset AI box
    document.getElementById('modal-ia-box').style.display = 'none';
    const btnIa = document.getElementById('btn-ia-reject');
    btnIa.style.display = (tr.descripcion) ? 'block' : 'none';
    btnIa.innerHTML = '✨ Analizar riesgo de rechazo (IA)';
    btnIa.onclick = () => analizarRechazoIA(id);

    document.getElementById('tramite-modal').classList.add('active');
  }

  function deleteTramite(id) {
    if(!confirm("¿Estás seguro de que deseas eliminar esta solicitud permanentemente?")) return;
    
    let tramites = JSON.parse(localStorage.getItem('tramites') || '[]');
    const target = tramites.find(t => t.id === id);

    tramites = tramites.filter(t => t.id !== id);
    localStorage.setItem('tramites', JSON.stringify(tramites));
    
    if(target) {
      let notifs = JSON.parse(localStorage.getItem('notificaciones') || '[]');
      notifs.unshift({
        iconClass: "b-gray",
        iconText: "✕",
        messageHtml: \`Has borrado permanentemente la solicitud <strong>\${target.name}</strong>.\`,
        time: "Justo ahora"
      });
      localStorage.setItem('notificaciones', JSON.stringify(notifs));
      window.dispatchEvent(new Event('notifsUpdated'));
    }

    closeDetalleModal();
    renderTramites();
  }

  async function analizarRechazoIA(id) {
    const tramites = JSON.parse(localStorage.getItem('tramites') || '[]');
    const tr = tramites.find(t => t.id === id);
    if (!tr || !tr.descripcion) return;

    const btn = document.getElementById('btn-ia-reject');
    const box = document.getElementById('modal-ia-box');
    const content = document.getElementById('modal-ia-rejection-content');

    const originalBtnHTML = btn.innerHTML;
    btn.innerHTML = '✨ Analizando...';
    btn.disabled = true;
    
    box.style.display = 'block';
    content.innerHTML = '<span style="color:var(--text-secondary);">Generando análisis de riesgo...</span>';

    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-53dd7b237c854688aaf4c82f3956c9c0'
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system", 
              content: "Eres un estricto auditor del comité de evaluación de auxilios cooperativos de BeneficIA. Se te proporciona la descripción de una solicitud de auxilio. Tu tarea es encontrar las razones concretas por las cuales esta solicitud ESALTAMENTE RIESGOSA y SERÁ RECHAZADA. Identifica fallas lógicas, falta explícita de justificación gravosa, falta de contundencia u omisiones de detalles clave que todo comité exige. Responde en un solo párrafo corto y MUY DIRECTO indicando el motivo por el cual no procede. NO uses etiquetas markdown como asteriscos, hashtags o subrayados."
            },
            {
              role: "user",
              content: \`Tipo de auxilio: \${tr.name}. Descripción del usuario: \${tr.descripcion}\`
            }
          ],
          temperature: 0.4
        })
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      const iaText = data.choices[0].message.content;
      // Filter out markdown just in case
      const cleanText = iaText.replace(/[*_#\`~>]/g, '');
      content.innerHTML = cleanText;

    } catch(err) {
      console.error(err);
      content.innerHTML = \`<span style="color: var(--red-400);">Hubo un error contactando a la IA. Revisa la consola.</span>\`;
    } finally {
      btn.innerHTML = originalBtnHTML;
      btn.disabled = false;
    }
  }

  function closeDetalleModal() {
    document.getElementById('tramite-modal').classList.remove('active');
  }

  // Initial Render
  document.addEventListener('DOMContentLoaded', () => {
    // Only run if on actual dashboard, wait slightly to make sure localStorage is readable
    setTimeout(renderTramites, 50);
  });
  
  // Custom event listener for updates
  window.addEventListener('tramitesUpdated', renderTramites);
<\/script>`], ["", `<div id="view-tramites"> <div class="summary-grid"> <div class="sum-card"> <div class="sum-label">Trámites totales</div> <div class="sum-val" id="stat-totales">0</div> <div class="sum-sub" id="stat-totales-sub">Sin trámites actuales</div> </div> <div class="sum-card"> <div class="sum-label">Último estado</div> <div class="sum-val" id="stat-estado" style="color:var(--text-secondary);">Ninguno</div> <div class="sum-sub" id="stat-estado-sub">-</div> </div> <div class="sum-card"> <div class="sum-label">Beneficio recibido</div> <div class="sum-val">$0</div> <div class="sum-sub">Acumulado 2026</div> </div> </div> <div class="card"> <div class="sec-title"> <span class="sec-title-dot"></span> Mis solicitudes
</div> <!-- Contenedor inyectado dinamicamente --> <div id="tramites-container"> <div style="text-align: center; padding: 2rem 1rem; color: var(--text-secondary); font-size: 13px;">
Cargando trámites...
</div> </div> </div> <!-- Panel IA --> <div class="ia-panel"> <div class="ia-head" id="ia-head"> <span class="ia-title">Análisis IA</span> </div> <div id="ia-content"> <div class="ia-item" style="color:var(--text-secondary);">
No hay análisis de IA activos en este momento.
</div> </div> </div> <!-- Modal Detalle --> <div class="modal-overlay" id="tramite-modal"> <div class="modal-content"> <div class="tr-top" style="margin-bottom: 12px;"> <span class="tr-name" id="modal-title" style="font-size: 16px;">Detalle</span> <span class="modal-close" onclick="closeDetalleModal()">✕</span> </div> <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;"> <strong>ID de Radicado:</strong> <span id="modal-id">...</span> </div> <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;"> <strong>Fecha:</strong> <span id="modal-fecha">...</span> </div> <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;"> <strong>Estado actual:</strong> <span id="modal-estado">...</span> </div> <div class="progress-track" style="margin-bottom: 8px;"> <div class="progress-bar" id="modal-progress" style="width:0%;"></div> </div> <div style="font-size: 12px; color: var(--text-primary); text-align: center; margin-bottom: 1rem;">
Paso actual: <strong id="modal-step">...</strong> </div> <!-- Área de IA en modal --> <div id="modal-ia-box" style="display:none; margin-bottom: 1rem; padding: 10px; background: var(--red-50); border: 0.5px solid var(--red-400); border-radius: var(--radius-md);"> <div style="font-size: 12px; font-weight: 500; color: var(--red-800); margin-bottom: 4px;">Análisis de Riesgo de Rechazo (IA)</div> <div id="modal-ia-rejection-content" style="font-size: 12px; color: var(--text-primary);"></div> </div> <button type="button" class="cancel-btn" id="btn-ia-reject" style="width: 100%; border-color: var(--teal-400); color: var(--teal-400); margin-bottom: 8px; font-weight: 500;">
✨ Analizar riesgo de rechazo (IA)
</button> <div style="display: flex; gap: 8px;"> <button class="submit-btn" style="flex: 1; padding: 8px; font-size: 13px;" onclick="closeDetalleModal()">Cerrar panel</button> <button class="cancel-btn" id="btn-delete-tramite" style="flex: 1; margin-top: 0; padding: 8px; font-size: 13px; border-color: var(--red-400); color: var(--red-400);">Eliminar</button> </div> </div> </div> </div>  <script>
  function renderTramites() {
    const tramites = JSON.parse(localStorage.getItem('tramites') || '[]');
    
    // Update Stats
    document.getElementById('stat-totales').textContent = tramites.length;
    document.getElementById('stat-totales-sub').textContent = tramites.length === 0 ? 'Sin trámites actuales' : (tramites.length + ' trámite(s)');
    
    if (tramites.length > 0) {
      const ultimo = tramites[0];
      const estadoEl = document.getElementById('stat-estado');
      estadoEl.textContent = ultimo.estado;
      
      // Color dependiente del estado
      if (ultimo.estado === 'Aprobado') estadoEl.style.color = 'var(--green-400)';
      else if (ultimo.estado === 'En estudio') estadoEl.style.color = 'var(--amber-400)';
      else if (ultimo.estado === 'Negado') estadoEl.style.color = 'var(--red-400)';
      else estadoEl.style.color = 'var(--blue-600)';
      
      document.getElementById('stat-estado-sub').textContent = ultimo.name;
    } else {
      document.getElementById('stat-estado').textContent = 'Ninguno';
      document.getElementById('stat-estado').style.color = 'var(--text-secondary)';
      document.getElementById('stat-estado-sub').textContent = '-';
    }

    // Update List
    const container = document.getElementById('tramites-container');
    if (tramites.length === 0) {
      container.innerHTML = \\\`
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-secondary); font-size: 13px;">
          No tienes solicitudes de trámites actualmente.
        </div>\\\`;
    } else {
      container.innerHTML = tramites.map(tr => \\\`
        <div class="tramite-row">
          <div class="tr-top">
            <span class="tr-name">\\\${tr.name}</span>
            <div style="display: flex; gap: 6px; align-items: center;">
              \\\${tr.riesgo ? \\\`<span class="badge" style="background:var(--gray-bg); color:var(--text-secondary); border:none;">Factibilidad: \\\${tr.riesgo}</span>\\\` : ''}
              <span class="badge \\\${tr.estadoClass}">\\\${tr.estado}</span>
            </div>
          </div>
          <div class="tr-mid">
            <span class="tr-tipo">\\\${tr.tipoBadge}</span>
            <span class="tr-date">\\\${tr.fechaText}</span>
          </div>
          <div class="progress-track">
            <div class="progress-bar \\\${tr.progClass}" style="width:\\\${tr.progWidth}%;"></div>
          </div>
          <div class="tr-foot">
            <span class="tr-step">\\\${tr.stepText}</span>
            <span class="\\\${tr.estado === 'Negado' ? 'tr-link-red' : 'tr-link'}" onclick="openDetalleModal(\\\${tr.id})">\\\${tr.actionText}</span>
          </div>
        </div>
      \\\`).join('');
    }

    // Update IA Panel
    const iaContainer = document.getElementById('ia-content');
    const iaHead = document.getElementById('ia-head');
    
    const enEstudioList = tramites.filter(t => t.estado === 'En estudio');
    
    if (enEstudioList.length > 0) {
      if (!document.getElementById('ia-pulse-loader')) {
        iaHead.insertAdjacentHTML('afterbegin', '<div class="ia-pulse" id="ia-pulse-loader"></div>');
      }
      
      iaContainer.innerHTML = \\\`
        <div class="ia-item"><span class="ia-ic" style="color:var(--green-400);">✓</span> Identidad verificada con documento adjunto</div>
        <div class="ia-item"><span class="ia-ic" style="color:var(--amber-600);">⏳</span> Revisando documentación del evento (\\\${enEstudioList[0].name})...</div>
        <div class="ia-item" style="color:var(--text-secondary);"><span class="ia-ic">◯</span> Revisión de comité (pendiente resultado IA)</div>
      \\\`;
    } else {
      const pulse = document.getElementById('ia-pulse-loader');
      if (pulse) pulse.remove();
      
      iaContainer.innerHTML = \\\`
        <div class="ia-item" style="color:var(--text-secondary);">
          No hay análisis de IA activos en este momento.
        </div>
      \\\`;
    }
  }

  // Lógica Modal
  function openDetalleModal(id) {
    const tramites = JSON.parse(localStorage.getItem('tramites') || '[]');
    const tr = tramites.find(t => t.id === id);
    if (!tr) return;

    document.getElementById('modal-title').textContent = tr.name;
    document.getElementById('modal-id').textContent = tr.id;
    document.getElementById('modal-fecha').textContent = tr.fechaText;
    
    const est = document.getElementById('modal-estado');
    est.textContent = tr.estado;
    est.className = \\\`badge \\\${tr.estadoClass}\\\`;
    
    const prog = document.getElementById('modal-progress');
    prog.style.width = tr.progWidth + '%';
    // set color based on class
    prog.className = \\\`progress-bar \\\${tr.progClass}\\\`;

    document.getElementById('modal-step').textContent = tr.stepText;
    document.getElementById('btn-delete-tramite').onclick = () => deleteTramite(id);

    // Reset AI box
    document.getElementById('modal-ia-box').style.display = 'none';
    const btnIa = document.getElementById('btn-ia-reject');
    btnIa.style.display = (tr.descripcion) ? 'block' : 'none';
    btnIa.innerHTML = '✨ Analizar riesgo de rechazo (IA)';
    btnIa.onclick = () => analizarRechazoIA(id);

    document.getElementById('tramite-modal').classList.add('active');
  }

  function deleteTramite(id) {
    if(!confirm("¿Estás seguro de que deseas eliminar esta solicitud permanentemente?")) return;
    
    let tramites = JSON.parse(localStorage.getItem('tramites') || '[]');
    const target = tramites.find(t => t.id === id);

    tramites = tramites.filter(t => t.id !== id);
    localStorage.setItem('tramites', JSON.stringify(tramites));
    
    if(target) {
      let notifs = JSON.parse(localStorage.getItem('notificaciones') || '[]');
      notifs.unshift({
        iconClass: "b-gray",
        iconText: "✕",
        messageHtml: \\\`Has borrado permanentemente la solicitud <strong>\\\${target.name}</strong>.\\\`,
        time: "Justo ahora"
      });
      localStorage.setItem('notificaciones', JSON.stringify(notifs));
      window.dispatchEvent(new Event('notifsUpdated'));
    }

    closeDetalleModal();
    renderTramites();
  }

  async function analizarRechazoIA(id) {
    const tramites = JSON.parse(localStorage.getItem('tramites') || '[]');
    const tr = tramites.find(t => t.id === id);
    if (!tr || !tr.descripcion) return;

    const btn = document.getElementById('btn-ia-reject');
    const box = document.getElementById('modal-ia-box');
    const content = document.getElementById('modal-ia-rejection-content');

    const originalBtnHTML = btn.innerHTML;
    btn.innerHTML = '✨ Analizando...';
    btn.disabled = true;
    
    box.style.display = 'block';
    content.innerHTML = '<span style="color:var(--text-secondary);">Generando análisis de riesgo...</span>';

    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-53dd7b237c854688aaf4c82f3956c9c0'
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system", 
              content: "Eres un estricto auditor del comité de evaluación de auxilios cooperativos de BeneficIA. Se te proporciona la descripción de una solicitud de auxilio. Tu tarea es encontrar las razones concretas por las cuales esta solicitud ESALTAMENTE RIESGOSA y SERÁ RECHAZADA. Identifica fallas lógicas, falta explícita de justificación gravosa, falta de contundencia u omisiones de detalles clave que todo comité exige. Responde en un solo párrafo corto y MUY DIRECTO indicando el motivo por el cual no procede. NO uses etiquetas markdown como asteriscos, hashtags o subrayados."
            },
            {
              role: "user",
              content: \\\`Tipo de auxilio: \\\${tr.name}. Descripción del usuario: \\\${tr.descripcion}\\\`
            }
          ],
          temperature: 0.4
        })
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      const iaText = data.choices[0].message.content;
      // Filter out markdown just in case
      const cleanText = iaText.replace(/[*_#\\\`~>]/g, '');
      content.innerHTML = cleanText;

    } catch(err) {
      console.error(err);
      content.innerHTML = \\\`<span style="color: var(--red-400);">Hubo un error contactando a la IA. Revisa la consola.</span>\\\`;
    } finally {
      btn.innerHTML = originalBtnHTML;
      btn.disabled = false;
    }
  }

  function closeDetalleModal() {
    document.getElementById('tramite-modal').classList.remove('active');
  }

  // Initial Render
  document.addEventListener('DOMContentLoaded', () => {
    // Only run if on actual dashboard, wait slightly to make sure localStorage is readable
    setTimeout(renderTramites, 50);
  });
  
  // Custom event listener for updates
  window.addEventListener('tramitesUpdated', renderTramites);
<\/script>`])), maybeRenderHead());
}, "C:/Users/USER/Gestion-Inteligente-de-Auxilios-Cooperativos/src/components/views/MisTramites.astro", void 0);

var __freeze$3 = Object.freeze;
var __defProp$3 = Object.defineProperty;
var __template$3 = (cooked, raw) => __freeze$3(__defProp$3(cooked, "raw", { value: __freeze$3(raw || cooked.slice()) }));
var _a$3;
const $$NuevaSolicitud = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate(_a$3 || (_a$3 = __template$3(["", `<div id="view-nueva" style="display:none;"> <form id="form-nueva-sol" class="card" onsubmit="submitNuevaSolicitud(event)"> <div class="sec-title"> <span class="sec-title-dot"></span> Nueva solicitud de auxilio
</div> <!-- Selector de tipo principal visible como tabs --> <div class="s-tabs" id="sTabs"> <button type="button" class="s-tab active" data-tipo="Calamidad" onclick="selTipo(this,'Calamidad')">
Calamidad
</button> <button type="button" class="s-tab" data-tipo="Enfermedad" onclick="selTipo(this,'Enfermedad')">Enfermedad</button> <button type="button" class="s-tab" data-tipo="Educación" onclick="selTipo(this,'Educación')">Educación</button> <button type="button" class="s-tab" data-tipo="Natalidad" onclick="selTipo(this,'Natalidad')">Natalidad</button> <button type="button" class="s-tab" data-tipo="Fallecimiento" onclick="selTipo(this,'Fallecimiento')">
Fallecimiento
</button> </div> <!-- hidden input to store active tab type and risk level --> <input type="hidden" id="tipoPrincipal" value="Calamidad"> <input type="hidden" id="factibilidadNivel" value=""> <!-- Campos del formulario --> <div class="form-row"> <div> <label class="flabel">Tipo de evento</label> <select class="fselect" id="tipoEvento" required> <option value="">Seleccione una opción</option> <option>Desastre natural</option> <option>Incendio de vivienda</option> <option>Desplazamiento forzado</option> <option>Pérdida total de bienes</option> </select> </div> <div> <label class="flabel">Fecha del evento</label> <input class="finput" type="date" id="fechaEvento" required> </div> </div> <div class="form-row-1"> <label class="flabel">Descripción de la situación</label> <textarea class="ftextarea" id="descripcionEvento" rows="2" style="overflow: hidden; resize: none; min-height: 80px;" required placeholder="Describa su situación con el mayor detalle posible. La IA analizará su caso automáticamente para agilizar la evaluación..." oninput="handleDescInput()" onblur="handleDescBlur()"></textarea> <div id="ai-status-indicator" style="font-size: 11px; color: var(--teal-400); margin-top: 6px; font-style: italic; display: none;">
✨ Analizando automáticamente tu caso...
</div> </div> <!-- Carga de documentos --> <div class="upload-box" onclick="alert('Seleccionar archivo...')"> <div class="upl-text">Adjuntar documentos</div> <div class="upl-sub">
Cédula, certificados, soportes del evento · PDF, JPG, PNG — máximo 20 MB
        por archivo
</div> </div> <!-- Lista de requisitos --> <div class="sec-title" style="font-size:12px;margin-bottom:8px;"> <span class="sec-title-dot"></span> Documentos requeridos
</div> <div class="req-list" id="dynamic-req-list"> <div style="font-size: 11px; color: var(--text-secondary); font-style: italic;">
Selecciona un tipo de evento para ver los documentos específicos requeridos.
</div> </div> <button type="submit" class="submit-btn" id="btn-submit-solicitud">
Enviar solicitud para evaluación IA
</button> <button type="button" class="cancel-btn" onclick="switchTab('tramites')">Cancelar — volver a mis trámites</button> </form> </div> <script>
  function selTipo(el, tipo) {
    document
      .querySelectorAll("#sTabs .s-tab")
      .forEach((t) => t.classList.remove("active"));
    el.classList.add("active");
    document.getElementById("tipoPrincipal").value = tipo;

    const opciones = {
      Calamidad: [
        "Desastre natural",
        "Incendio de vivienda",
        "Desplazamiento forzado",
        "Pérdida total de bienes",
      ],
      Enfermedad: [
        "Enfermedad grave o crónica",
        "Hospitalización prolongada",
        "Tratamiento oncológico",
        "Cirugía de alto costo",
      ],
      Educación: [
        "Matrícula universitaria",
        "Útiles y materiales escolares",
        "Transporte escolar",
        "Beca de estudios",
      ],
      Natalidad: ["Parto reciente", "Adopción", "Embarazo de alto riesgo"],
      Fallecimiento: [
        "Gastos funerarios",
        "Apoyo familiar por pérdida",
        "Seguro de vida por fallecimiento",
      ],
    };

    const sel = document.getElementById("tipoEvento");
    sel.innerHTML = '<option value="">Seleccione una opción</option>';
    (opciones[tipo] || []).forEach((o) => {
      const opt = document.createElement("option");
      opt.textContent = o;
      opt.value = o;
      sel.appendChild(opt);
    });
  }

  function submitNuevaSolicitud(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-solicitud');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Enviando...';
    btn.disabled = true;

    // Recolectar datos
    const tipo = document.getElementById("tipoPrincipal").value;
    const subTipo = document.getElementById("tipoEvento").value;
    const descripcion = document.getElementById("descripcionEvento").value;

    const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    const dateFormatted = new Date().toLocaleDateString('es-CO', dateOptions);

    const nuevoTramite = {
      id: Date.now(),
      name: "Auxilio por " + subTipo.toLowerCase(),
      estado: "En estudio",
      estadoClass: "b-amber",
      progClass: "pb-amber",
      progWidth: "30", // Progress for "En estudio"
      tipoBadge: tipo,
      fechaText: "Radicado " + dateFormatted,
      stepText: "Validación inicial IA · En progreso",
      actionText: "Ver detalle",
      descripcion: descripcion,
      riesgo: document.getElementById("factibilidadNivel").value
    };

    setTimeout(() => {
      // Guardar en localStorage
      let tramites = JSON.parse(localStorage.getItem('tramites') || '[]');
      // Insertar al inicio de la lista
      tramites.unshift(nuevoTramite);
      localStorage.setItem('tramites', JSON.stringify(tramites));

      // Generar notificacion
      let notifs = JSON.parse(localStorage.getItem('notificaciones') || '[]');
      notifs.unshift({
        iconClass: "b-blue",
        iconText: "N",
        messageHtml: \`Nueva solicitud radicada: <strong>Auxilio por \${subTipo.toLowerCase()}</strong>. En espera de evaluación.\`,
        time: "Justo ahora"
      });
      localStorage.setItem('notificaciones', JSON.stringify(notifs));
      window.dispatchEvent(new Event('notifsUpdated'));

      // Limpiar formulario y restaurar botón
      document.getElementById('form-nueva-sol').reset();
      btn.innerHTML = originalText;
      btn.disabled = false;

      // Disparar evento personalizado para que MisTramites lo atrape y recargue
      window.dispatchEvent(new Event('tramitesUpdated'));

      // Mandar a la vista de trámites
      switchTab('tramites');
    }, 800); // 800ms de simulacion
  }

  async function analizarConIA() {
    const descripcion = document.getElementById('descripcionEvento').value;
    const subTipo = document.getElementById('tipoEvento').value;
    const indicator = document.getElementById('ai-status-indicator');
    const reqList = document.getElementById('dynamic-req-list');

    if (!descripcion || !subTipo) return;

    indicator.style.display = 'block';
    indicator.textContent = '✨ Analizando automáticamente tu caso...';
    
    reqList.innerHTML = \`<div style="font-size: 12px; color: var(--blue-600); text-align: center; padding: 10px;">
        Generando recomendaciones de documentos con IA...
      </div>\`;

    try {
      const response = await fetch('/api/deepseek', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system", 
              content: "Eres un asistente del portal BeneficIA. Tu tarea es analizar la situación reportada por el usuario para solicitar un auxilio cooperativo. Responde de manera amable y MUY BREVE. Primero indica claramente el nivel de FACTIBILIDAD (Alta, Media o Baja) explicando en una frase por qué. Segundo, proporciona una lista simple (con el guión medio '-') de los 2 o 3 documentos críticos requeridos. NO uses negritas (asteriscos dobles) ni hashtags, redacta en texto totalmente plano."
            },
            {
              role: "user",
              content: \`Tipo de auxilio solicitado: \${subTipo}. Descripción del usuario: \${descripcion}\`
            }
          ],
          temperature: 0.3
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      const iaText = data.choices[0].message.content;
      
      // format as simple html and strip common markdown characters just in case
      const cleanText = iaText.replace(/[*_#\`~>]/g, '');
      
      const matchRiesgo = cleanText.match(/FACTIBILIDAD(?:\\\\s*:\\\\s*|\\\\s+)(Alta|Media|Baja)/i);
      if (matchRiesgo) {
         document.getElementById('factibilidadNivel').value = matchRiesgo[1];
      }
      
      const formattedHTML = cleanText
        .split('\\n')
        .map(line => {
           line = line.trim();
           if (line.startsWith('-')) {
             return \`<div class="req-item"><span class="req-pend" style="color:var(--teal-400);">✦</span> \${line.substring(1).trim()}</div>\`;
           } else if (line.length > 0) {
             return \`<div style="font-size: 13px; color: var(--text-primary); margin-bottom: 8px;">\${line}</div>\`;
           }
           return '';
        })
        .join('');

      reqList.innerHTML = \`<div style="padding: 10px; background: var(--teal-50); border: 0.5px solid var(--teal-400); border-radius: var(--radius-md);">\${formattedHTML}</div>\`;

      // Dispatch AI generation notification
      let notifs = JSON.parse(localStorage.getItem('notificaciones') || '[]');
      notifs.unshift({
        iconClass: "b-amber",
        iconText: "AI",
        messageHtml: \`Análisis de validación preliminar completado por IA. Factibilidad calculada: <strong>\${matchRiesgo ? matchRiesgo[1] : 'Evaluada'}</strong>.\`,
        time: "Justo ahora"
      });
      localStorage.setItem('notificaciones', JSON.stringify(notifs));
      window.dispatchEvent(new Event('notifsUpdated'));

    } catch(err) {
      console.error(err);
      reqList.innerHTML = \`<div style="font-size: 12px; color: var(--red-400); text-align: center; padding: 10px;">
        Hubo un error contactando a la IA. Revisa la consola para más detalles.
      </div>\`;
    } finally {
      indicator.textContent = '✨ Análisis de factibilidad completado.';
      setTimeout(() => { indicator.style.display = 'none'; }, 2000);
    }
  }

  // Auto-analysis debounce logic
  let aiAnalyzeTimeout = null;

  function handleDescInput() {
    const descInput = document.getElementById('descripcionEvento');
    if (!descInput) return;
    
    // Auto-resize logic
    descInput.style.height = 'auto';
    descInput.style.height = descInput.scrollHeight + 'px';
    
    if (aiAnalyzeTimeout) clearTimeout(aiAnalyzeTimeout);
    
    const text = descInput.value.trim();
    if (text.length > 10) {
      aiAnalyzeTimeout = setTimeout(() => {
        analizarConIA();
      }, 2000);
    }
  }

  function handleDescBlur() {
    const descInput = document.getElementById('descripcionEvento');
    if (!descInput) return;
    
    const text = descInput.value.trim();
    if (text.length > 10) {
      if (aiAnalyzeTimeout) clearTimeout(aiAnalyzeTimeout);
      analizarConIA();
    }
  }
<\/script>`], ["", `<div id="view-nueva" style="display:none;"> <form id="form-nueva-sol" class="card" onsubmit="submitNuevaSolicitud(event)"> <div class="sec-title"> <span class="sec-title-dot"></span> Nueva solicitud de auxilio
</div> <!-- Selector de tipo principal visible como tabs --> <div class="s-tabs" id="sTabs"> <button type="button" class="s-tab active" data-tipo="Calamidad" onclick="selTipo(this,'Calamidad')">
Calamidad
</button> <button type="button" class="s-tab" data-tipo="Enfermedad" onclick="selTipo(this,'Enfermedad')">Enfermedad</button> <button type="button" class="s-tab" data-tipo="Educación" onclick="selTipo(this,'Educación')">Educación</button> <button type="button" class="s-tab" data-tipo="Natalidad" onclick="selTipo(this,'Natalidad')">Natalidad</button> <button type="button" class="s-tab" data-tipo="Fallecimiento" onclick="selTipo(this,'Fallecimiento')">
Fallecimiento
</button> </div> <!-- hidden input to store active tab type and risk level --> <input type="hidden" id="tipoPrincipal" value="Calamidad"> <input type="hidden" id="factibilidadNivel" value=""> <!-- Campos del formulario --> <div class="form-row"> <div> <label class="flabel">Tipo de evento</label> <select class="fselect" id="tipoEvento" required> <option value="">Seleccione una opción</option> <option>Desastre natural</option> <option>Incendio de vivienda</option> <option>Desplazamiento forzado</option> <option>Pérdida total de bienes</option> </select> </div> <div> <label class="flabel">Fecha del evento</label> <input class="finput" type="date" id="fechaEvento" required> </div> </div> <div class="form-row-1"> <label class="flabel">Descripción de la situación</label> <textarea class="ftextarea" id="descripcionEvento" rows="2" style="overflow: hidden; resize: none; min-height: 80px;" required placeholder="Describa su situación con el mayor detalle posible. La IA analizará su caso automáticamente para agilizar la evaluación..." oninput="handleDescInput()" onblur="handleDescBlur()"></textarea> <div id="ai-status-indicator" style="font-size: 11px; color: var(--teal-400); margin-top: 6px; font-style: italic; display: none;">
✨ Analizando automáticamente tu caso...
</div> </div> <!-- Carga de documentos --> <div class="upload-box" onclick="alert('Seleccionar archivo...')"> <div class="upl-text">Adjuntar documentos</div> <div class="upl-sub">
Cédula, certificados, soportes del evento · PDF, JPG, PNG — máximo 20 MB
        por archivo
</div> </div> <!-- Lista de requisitos --> <div class="sec-title" style="font-size:12px;margin-bottom:8px;"> <span class="sec-title-dot"></span> Documentos requeridos
</div> <div class="req-list" id="dynamic-req-list"> <div style="font-size: 11px; color: var(--text-secondary); font-style: italic;">
Selecciona un tipo de evento para ver los documentos específicos requeridos.
</div> </div> <button type="submit" class="submit-btn" id="btn-submit-solicitud">
Enviar solicitud para evaluación IA
</button> <button type="button" class="cancel-btn" onclick="switchTab('tramites')">Cancelar — volver a mis trámites</button> </form> </div> <script>
  function selTipo(el, tipo) {
    document
      .querySelectorAll("#sTabs .s-tab")
      .forEach((t) => t.classList.remove("active"));
    el.classList.add("active");
    document.getElementById("tipoPrincipal").value = tipo;

    const opciones = {
      Calamidad: [
        "Desastre natural",
        "Incendio de vivienda",
        "Desplazamiento forzado",
        "Pérdida total de bienes",
      ],
      Enfermedad: [
        "Enfermedad grave o crónica",
        "Hospitalización prolongada",
        "Tratamiento oncológico",
        "Cirugía de alto costo",
      ],
      Educación: [
        "Matrícula universitaria",
        "Útiles y materiales escolares",
        "Transporte escolar",
        "Beca de estudios",
      ],
      Natalidad: ["Parto reciente", "Adopción", "Embarazo de alto riesgo"],
      Fallecimiento: [
        "Gastos funerarios",
        "Apoyo familiar por pérdida",
        "Seguro de vida por fallecimiento",
      ],
    };

    const sel = document.getElementById("tipoEvento");
    sel.innerHTML = '<option value="">Seleccione una opción</option>';
    (opciones[tipo] || []).forEach((o) => {
      const opt = document.createElement("option");
      opt.textContent = o;
      opt.value = o;
      sel.appendChild(opt);
    });
  }

  function submitNuevaSolicitud(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-solicitud');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Enviando...';
    btn.disabled = true;

    // Recolectar datos
    const tipo = document.getElementById("tipoPrincipal").value;
    const subTipo = document.getElementById("tipoEvento").value;
    const descripcion = document.getElementById("descripcionEvento").value;

    const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    const dateFormatted = new Date().toLocaleDateString('es-CO', dateOptions);

    const nuevoTramite = {
      id: Date.now(),
      name: "Auxilio por " + subTipo.toLowerCase(),
      estado: "En estudio",
      estadoClass: "b-amber",
      progClass: "pb-amber",
      progWidth: "30", // Progress for "En estudio"
      tipoBadge: tipo,
      fechaText: "Radicado " + dateFormatted,
      stepText: "Validación inicial IA · En progreso",
      actionText: "Ver detalle",
      descripcion: descripcion,
      riesgo: document.getElementById("factibilidadNivel").value
    };

    setTimeout(() => {
      // Guardar en localStorage
      let tramites = JSON.parse(localStorage.getItem('tramites') || '[]');
      // Insertar al inicio de la lista
      tramites.unshift(nuevoTramite);
      localStorage.setItem('tramites', JSON.stringify(tramites));

      // Generar notificacion
      let notifs = JSON.parse(localStorage.getItem('notificaciones') || '[]');
      notifs.unshift({
        iconClass: "b-blue",
        iconText: "N",
        messageHtml: \\\`Nueva solicitud radicada: <strong>Auxilio por \\\${subTipo.toLowerCase()}</strong>. En espera de evaluación.\\\`,
        time: "Justo ahora"
      });
      localStorage.setItem('notificaciones', JSON.stringify(notifs));
      window.dispatchEvent(new Event('notifsUpdated'));

      // Limpiar formulario y restaurar botón
      document.getElementById('form-nueva-sol').reset();
      btn.innerHTML = originalText;
      btn.disabled = false;

      // Disparar evento personalizado para que MisTramites lo atrape y recargue
      window.dispatchEvent(new Event('tramitesUpdated'));

      // Mandar a la vista de trámites
      switchTab('tramites');
    }, 800); // 800ms de simulacion
  }

  async function analizarConIA() {
    const descripcion = document.getElementById('descripcionEvento').value;
    const subTipo = document.getElementById('tipoEvento').value;
    const indicator = document.getElementById('ai-status-indicator');
    const reqList = document.getElementById('dynamic-req-list');

    if (!descripcion || !subTipo) return;

    indicator.style.display = 'block';
    indicator.textContent = '✨ Analizando automáticamente tu caso...';
    
    reqList.innerHTML = \\\`<div style="font-size: 12px; color: var(--blue-600); text-align: center; padding: 10px;">
        Generando recomendaciones de documentos con IA...
      </div>\\\`;

    try {
      const response = await fetch('/api/deepseek', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system", 
              content: "Eres un asistente del portal BeneficIA. Tu tarea es analizar la situación reportada por el usuario para solicitar un auxilio cooperativo. Responde de manera amable y MUY BREVE. Primero indica claramente el nivel de FACTIBILIDAD (Alta, Media o Baja) explicando en una frase por qué. Segundo, proporciona una lista simple (con el guión medio '-') de los 2 o 3 documentos críticos requeridos. NO uses negritas (asteriscos dobles) ni hashtags, redacta en texto totalmente plano."
            },
            {
              role: "user",
              content: \\\`Tipo de auxilio solicitado: \\\${subTipo}. Descripción del usuario: \\\${descripcion}\\\`
            }
          ],
          temperature: 0.3
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      const iaText = data.choices[0].message.content;
      
      // format as simple html and strip common markdown characters just in case
      const cleanText = iaText.replace(/[*_#\\\`~>]/g, '');
      
      const matchRiesgo = cleanText.match(/FACTIBILIDAD(?:\\\\\\\\s*:\\\\\\\\s*|\\\\\\\\s+)(Alta|Media|Baja)/i);
      if (matchRiesgo) {
         document.getElementById('factibilidadNivel').value = matchRiesgo[1];
      }
      
      const formattedHTML = cleanText
        .split('\\\\n')
        .map(line => {
           line = line.trim();
           if (line.startsWith('-')) {
             return \\\`<div class="req-item"><span class="req-pend" style="color:var(--teal-400);">✦</span> \\\${line.substring(1).trim()}</div>\\\`;
           } else if (line.length > 0) {
             return \\\`<div style="font-size: 13px; color: var(--text-primary); margin-bottom: 8px;">\\\${line}</div>\\\`;
           }
           return '';
        })
        .join('');

      reqList.innerHTML = \\\`<div style="padding: 10px; background: var(--teal-50); border: 0.5px solid var(--teal-400); border-radius: var(--radius-md);">\\\${formattedHTML}</div>\\\`;

      // Dispatch AI generation notification
      let notifs = JSON.parse(localStorage.getItem('notificaciones') || '[]');
      notifs.unshift({
        iconClass: "b-amber",
        iconText: "AI",
        messageHtml: \\\`Análisis de validación preliminar completado por IA. Factibilidad calculada: <strong>\\\${matchRiesgo ? matchRiesgo[1] : 'Evaluada'}</strong>.\\\`,
        time: "Justo ahora"
      });
      localStorage.setItem('notificaciones', JSON.stringify(notifs));
      window.dispatchEvent(new Event('notifsUpdated'));

    } catch(err) {
      console.error(err);
      reqList.innerHTML = \\\`<div style="font-size: 12px; color: var(--red-400); text-align: center; padding: 10px;">
        Hubo un error contactando a la IA. Revisa la consola para más detalles.
      </div>\\\`;
    } finally {
      indicator.textContent = '✨ Análisis de factibilidad completado.';
      setTimeout(() => { indicator.style.display = 'none'; }, 2000);
    }
  }

  // Auto-analysis debounce logic
  let aiAnalyzeTimeout = null;

  function handleDescInput() {
    const descInput = document.getElementById('descripcionEvento');
    if (!descInput) return;
    
    // Auto-resize logic
    descInput.style.height = 'auto';
    descInput.style.height = descInput.scrollHeight + 'px';
    
    if (aiAnalyzeTimeout) clearTimeout(aiAnalyzeTimeout);
    
    const text = descInput.value.trim();
    if (text.length > 10) {
      aiAnalyzeTimeout = setTimeout(() => {
        analizarConIA();
      }, 2000);
    }
  }

  function handleDescBlur() {
    const descInput = document.getElementById('descripcionEvento');
    if (!descInput) return;
    
    const text = descInput.value.trim();
    if (text.length > 10) {
      if (aiAnalyzeTimeout) clearTimeout(aiAnalyzeTimeout);
      analizarConIA();
    }
  }
<\/script>`])), maybeRenderHead());
}, "C:/Users/USER/Gestion-Inteligente-de-Auxilios-Cooperativos/src/components/views/NuevaSolicitud.astro", void 0);

var __freeze$2 = Object.freeze;
var __defProp$2 = Object.defineProperty;
var __template$2 = (cooked, raw) => __freeze$2(__defProp$2(cooked, "raw", { value: __freeze$2(raw || cooked.slice()) }));
var _a$2;
const $$ProgramasDisponibles = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_a$2 || (_a$2 = __template$2(["", '<div id="view-programas" style="display:none;"> <div class="card"> <div class="sec-title"> <span class="sec-title-dot"></span> Programas disponibles para ti\n</div> <div id="prog-container"> <!-- injected via JS --> </div> </div> </div> <script>\n  const programasHardcoded = [\n    {\n      name: "Beca de Excelencia Estudiantil",\n      badgeClass: "b-blue",\n      badgeText: "Convocatoria Abierta",\n      desc: "Apoyo económico para asociados o sus hijos en programas de educación superior que mantengan un promedio superior a 4.2.",\n      progress: 75,\n      progressColor: "var(--blue-400)",\n      progressText: "75% del presupuesto anual ejecutado",\n      tipoPrincipal: "Educación",\n      subTipo: "Beca de estudios"\n    },\n    {\n      name: "Auxilio Solidario por Calamidad",\n      badgeClass: "b-amber",\n      badgeText: "Fondo de Emergencia",\n      desc: "Cobertura inmediata ante afectaciones graves por desastres naturales o siniestros en la vivienda principal del asociado.",\n      progress: 40,\n      progressColor: "var(--amber-400)",\n      progressText: "Fondo con alta disponibilidad",\n      tipoPrincipal: "Calamidad",\n      subTipo: "Desastre natural"\n    },\n    {\n      name: "Kit de Bienvenida Maternidad",\n      badgeClass: "b-green",\n      badgeText: "Beneficio Permanente",\n      desc: "Apoyo para gastos de natalidad y adecuación inicial entregado a los asociados por el nacimiento o adopción de un hijo.",\n      progress: 90,\n      progressColor: "var(--green-400)",\n      progressText: "Cierre de convocatorias próximo",\n      tipoPrincipal: "Natalidad",\n      subTipo: "Parto reciente"\n    }\n  ];\n\n  function renderProgramas() {\n    const container = document.getElementById(\'prog-container\');\n    container.innerHTML = programasHardcoded.map(prog => `\n      <div class="prog-item">\n        <div class="prog-head">\n          <div class="prog-name">${prog.name}</div>\n          <span class="badge ${prog.badgeClass}">${prog.badgeText}</span>\n        </div>\n        <div class="prog-desc" style="color:var(--text-secondary); font-size:13px; line-height:1.5; margin-bottom:12px;">${prog.desc}</div>\n        <div class="prog-track">\n          <div class="prog-fill" style="width:${prog.progress}%; background:${prog.progressColor};"></div>\n        </div>\n        <div class="prog-foot">\n          <span>${prog.progressText}</span>\n          <span class="prog-apply" style="cursor:pointer; color:var(--teal-600); font-weight:500;" onclick="aplicarPrograma(\'${prog.tipoPrincipal}\', \'${prog.subTipo}\')">Aplicar ahora →</span>\n        </div>\n      </div>\n    `).join(\'\');\n  }\n\n  function aplicarPrograma(tipoPrincipal, subTipo) {\n    switchTab(\'nueva\');\n    \n    // Simular que el tab se procesa\n    setTimeout(() => {\n      const tabEl = document.querySelector(\\`.s-tab[data-tipo="\\${tipoPrincipal}"]\\`);\n      if(tabEl) {\n         selTipo(tabEl, tipoPrincipal);\n         \n         setTimeout(() => {\n           const subSelect = document.getElementById(\'tipoEvento\');\n           if (subSelect && subTipo) {\n             subSelect.value = subTipo;\n           }\n         }, 50);\n      }\n    }, 50);\n  }\n\n  document.addEventListener(\'DOMContentLoaded\', () => {\n    setTimeout(renderProgramas, 50);\n  });\n<\/script>'], ["", '<div id="view-programas" style="display:none;"> <div class="card"> <div class="sec-title"> <span class="sec-title-dot"></span> Programas disponibles para ti\n</div> <div id="prog-container"> <!-- injected via JS --> </div> </div> </div> <script>\n  const programasHardcoded = [\n    {\n      name: "Beca de Excelencia Estudiantil",\n      badgeClass: "b-blue",\n      badgeText: "Convocatoria Abierta",\n      desc: "Apoyo económico para asociados o sus hijos en programas de educación superior que mantengan un promedio superior a 4.2.",\n      progress: 75,\n      progressColor: "var(--blue-400)",\n      progressText: "75% del presupuesto anual ejecutado",\n      tipoPrincipal: "Educación",\n      subTipo: "Beca de estudios"\n    },\n    {\n      name: "Auxilio Solidario por Calamidad",\n      badgeClass: "b-amber",\n      badgeText: "Fondo de Emergencia",\n      desc: "Cobertura inmediata ante afectaciones graves por desastres naturales o siniestros en la vivienda principal del asociado.",\n      progress: 40,\n      progressColor: "var(--amber-400)",\n      progressText: "Fondo con alta disponibilidad",\n      tipoPrincipal: "Calamidad",\n      subTipo: "Desastre natural"\n    },\n    {\n      name: "Kit de Bienvenida Maternidad",\n      badgeClass: "b-green",\n      badgeText: "Beneficio Permanente",\n      desc: "Apoyo para gastos de natalidad y adecuación inicial entregado a los asociados por el nacimiento o adopción de un hijo.",\n      progress: 90,\n      progressColor: "var(--green-400)",\n      progressText: "Cierre de convocatorias próximo",\n      tipoPrincipal: "Natalidad",\n      subTipo: "Parto reciente"\n    }\n  ];\n\n  function renderProgramas() {\n    const container = document.getElementById(\'prog-container\');\n    container.innerHTML = programasHardcoded.map(prog => \\`\n      <div class="prog-item">\n        <div class="prog-head">\n          <div class="prog-name">\\${prog.name}</div>\n          <span class="badge \\${prog.badgeClass}">\\${prog.badgeText}</span>\n        </div>\n        <div class="prog-desc" style="color:var(--text-secondary); font-size:13px; line-height:1.5; margin-bottom:12px;">\\${prog.desc}</div>\n        <div class="prog-track">\n          <div class="prog-fill" style="width:\\${prog.progress}%; background:\\${prog.progressColor};"></div>\n        </div>\n        <div class="prog-foot">\n          <span>\\${prog.progressText}</span>\n          <span class="prog-apply" style="cursor:pointer; color:var(--teal-600); font-weight:500;" onclick="aplicarPrograma(\'\\${prog.tipoPrincipal}\', \'\\${prog.subTipo}\')">Aplicar ahora →</span>\n        </div>\n      </div>\n    \\`).join(\'\');\n  }\n\n  function aplicarPrograma(tipoPrincipal, subTipo) {\n    switchTab(\'nueva\');\n    \n    // Simular que el tab se procesa\n    setTimeout(() => {\n      const tabEl = document.querySelector(\\\\\\`.s-tab[data-tipo="\\\\\\${tipoPrincipal}"]\\\\\\`);\n      if(tabEl) {\n         selTipo(tabEl, tipoPrincipal);\n         \n         setTimeout(() => {\n           const subSelect = document.getElementById(\'tipoEvento\');\n           if (subSelect && subTipo) {\n             subSelect.value = subTipo;\n           }\n         }, 50);\n      }\n    }, 50);\n  }\n\n  document.addEventListener(\'DOMContentLoaded\', () => {\n    setTimeout(renderProgramas, 50);\n  });\n<\/script>'])), maybeRenderHead());
}, "C:/Users/USER/Gestion-Inteligente-de-Auxilios-Cooperativos/src/components/views/ProgramasDisponibles.astro", void 0);

var __freeze$1 = Object.freeze;
var __defProp$1 = Object.defineProperty;
var __template$1 = (cooked, raw) => __freeze$1(__defProp$1(cooked, "raw", { value: __freeze$1(raw || cooked.slice()) }));
var _a$1;
const $$Notificaciones = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_a$1 || (_a$1 = __template$1(["", `<div id="view-notificaciones" style="display:none;"> <div class="card"> <div class="sec-title" style="display: flex; justify-content: space-between; align-items: center;"> <div><span class="sec-title-dot"></span> Mis notificaciones</div> <button class="cancel-btn" style="padding: 4px 8px; font-size: 11px;" onclick="clearNotificaciones()">Borrar todo</button> </div> <div id="notif-container"> <div style="text-align: center; padding: 2rem 1rem; color: var(--text-secondary); font-size: 13px;">
Cargando notificaciones...
</div> </div> </div> </div> <script>
  function renderNotificaciones() {
    const notifs = JSON.parse(localStorage.getItem('notificaciones') || '[]');
    const container = document.getElementById('notif-container');

    if (notifs.length === 0) {
      container.innerHTML = \`
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-secondary); font-size: 13px;">
          No tienes notificaciones recientes.
        </div>\`;
    } else {
      container.innerHTML = notifs.map(n => \`
        <div class="notif-item">
          <div class="notif-icon \${n.iconClass}">\${n.iconText}</div>
          <div>
            <div class="notif-msg">\${n.messageHtml}</div>
            <div class="notif-time">\${n.time}</div>
          </div>
        </div>
      \`).join('');
    }
  }

  function clearNotificaciones() {
    localStorage.removeItem('notificaciones');
    renderNotificaciones();
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderNotificaciones, 50);
  });
  
  window.addEventListener('notifsUpdated', renderNotificaciones);
<\/script>`], ["", `<div id="view-notificaciones" style="display:none;"> <div class="card"> <div class="sec-title" style="display: flex; justify-content: space-between; align-items: center;"> <div><span class="sec-title-dot"></span> Mis notificaciones</div> <button class="cancel-btn" style="padding: 4px 8px; font-size: 11px;" onclick="clearNotificaciones()">Borrar todo</button> </div> <div id="notif-container"> <div style="text-align: center; padding: 2rem 1rem; color: var(--text-secondary); font-size: 13px;">
Cargando notificaciones...
</div> </div> </div> </div> <script>
  function renderNotificaciones() {
    const notifs = JSON.parse(localStorage.getItem('notificaciones') || '[]');
    const container = document.getElementById('notif-container');

    if (notifs.length === 0) {
      container.innerHTML = \\\`
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-secondary); font-size: 13px;">
          No tienes notificaciones recientes.
        </div>\\\`;
    } else {
      container.innerHTML = notifs.map(n => \\\`
        <div class="notif-item">
          <div class="notif-icon \\\${n.iconClass}">\\\${n.iconText}</div>
          <div>
            <div class="notif-msg">\\\${n.messageHtml}</div>
            <div class="notif-time">\\\${n.time}</div>
          </div>
        </div>
      \\\`).join('');
    }
  }

  function clearNotificaciones() {
    localStorage.removeItem('notificaciones');
    renderNotificaciones();
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderNotificaciones, 50);
  });
  
  window.addEventListener('notifsUpdated', renderNotificaciones);
<\/script>`])), maybeRenderHead());
}, "C:/Users/USER/Gestion-Inteligente-de-Auxilios-Cooperativos/src/components/views/Notificaciones.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "BeneficIA Social — Portal Personal" }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", " ", " ", " ", " ", " ", ' <script>\n    // Si no está el flag de sesión, mandarlo al login\n    if (localStorage.getItem("isLoggedIn") !== "true") {\n      window.location.href = "/login";\n    }\n  <\/script> '])), renderComponent($$result2, "TopBar", $$TopBar, { "initials": "U", "name": "Usuario", "idInfo": "Afiliado" }), renderComponent($$result2, "NavigationTabs", $$NavigationTabs, {}), renderComponent($$result2, "MisTramites", $$MisTramites, {}), renderComponent($$result2, "NuevaSolicitud", $$NuevaSolicitud, {}), renderComponent($$result2, "ProgramasDisponibles", $$ProgramasDisponibles, {}), renderComponent($$result2, "Notificaciones", $$Notificaciones, {})) })}`;
}, "C:/Users/USER/Gestion-Inteligente-de-Auxilios-Cooperativos/src/pages/index.astro", void 0);

const $$file = "C:/Users/USER/Gestion-Inteligente-de-Auxilios-Cooperativos/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
