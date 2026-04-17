import { c as createComponent } from './astro-component_I0zML0fX.mjs';
import 'piccolore';
import { r as renderTemplate, n as renderSlot, o as renderHead } from './entrypoint_DERourIW.mjs';
import 'clsx';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$BaseLayout;
  const { title } = Astro2.props;
  return renderTemplate(_a || (_a = __template(['<html lang="es"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>', "</title>", '</head> <body> <div class="page"> ', ' </div> <script>\n      /* ── Global Scripts ── */\n      function switchTab(name) {\n        const views = ["tramites", "nueva", "programas", "notificaciones"];\n        views.forEach((v) => {\n          const el = document.getElementById("view-" + v);\n          if (el) el.style.display = v === name ? "block" : "none";\n        });\n        document.querySelectorAll("#mainTabs .tab").forEach((t, i) => {\n          if (views[i]) t.classList.toggle("active", views[i] === name);\n        });\n      }\n\n      function logoutFunc() {\n        localStorage.removeItem("isLoggedIn");\n        window.location.href = "/login";\n      }\n    <\/script> </body> </html>'])), title, renderHead(), renderSlot($$result, $$slots["default"]));
}, "C:/Users/USER/Gestion-Inteligente-de-Auxilios-Cooperativos/src/layouts/BaseLayout.astro", void 0);

export { $$BaseLayout as $ };
