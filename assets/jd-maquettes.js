/* jd-maquettes.js : comportements des maquettes statiques (pas pour la production).
   En production : menu = widget Elementor « Menu » (Nav Menu), en-tête collant = réglage « Effets de défilement »,
   formulaire = widget Formulaire d'Elementor Pro (validation serveur). Voir NOTES-elementor.md. */
(function () {
  "use strict";
  var header = document.querySelector(".jd-header");

  /* En-tête : verre au défilement */
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Menu mobile : bouton 48 x 48, aria-expanded, Échap pour fermer, focus rendu au bouton */
  var burger = document.querySelector(".jd-burger");
  var nav = document.getElementById("jd-nav");
  function setOpen(open) {
    if (!header || !burger) return;
    header.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    if (open && nav) { var first = nav.querySelector("a"); if (first) first.focus(); }
  }
  if (burger) {
    burger.addEventListener("click", function () { setOpen(!header.classList.contains("is-open")); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("is-open")) { setOpen(false); burger.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (header.classList.contains("is-open") && !header.contains(e.target)) setOpen(false);
    });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", function (m) { if (m.matches) setOpen(false); });
  }

  /* Rails horizontaux : flèches précédent / suivant */
  document.querySelectorAll("[data-rail]").forEach(function (wrap) {
    var rail = wrap.querySelector(".jd-rail");
    var prev = wrap.querySelector("[data-rail-prev]");
    var next = wrap.querySelector("[data-rail-next]");
    if (!rail) return;
    function step() { var c = rail.firstElementChild; return c ? c.getBoundingClientRect().width + 20 : 300; }
    function update() {
      var max = rail.scrollWidth - rail.clientWidth - 2;
      if (prev) prev.disabled = rail.scrollLeft <= 2;
      if (next) next.disabled = rail.scrollLeft >= max;
      var nav = wrap.querySelector(".jd-rail__nav");
      if (nav) nav.hidden = max <= 0;
    }
    if (prev) prev.addEventListener("click", function () { rail.scrollBy({ left: -step(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { rail.scrollBy({ left: step(), behavior: "smooth" }); });
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  /* Formulaire : validation de démonstration (messages texte, aria-invalid, focus sur le 1er champ en erreur) */
  document.querySelectorAll("form[data-jd-form]").forEach(function (form) {
    var rules = {
      name: function (v) { return v.trim().length >= 2 && v.trim().length <= 80 ? "" : "Indiquez votre nom."; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Indiquez une adresse email valide, par exemple vous@exemple.fr."; },
      subject: function (v) { return v ? "" : "Choisissez un sujet."; },
      message: function (v) { return v.trim().length >= 20 ? "" : "Votre message doit faire au moins 20 caractères."; },
      consent: function (v, el) { return el.checked ? "" : "Cochez la case pour que je puisse traiter votre message."; }
    };
    function check(el) {
      var rule = rules[el.name]; if (!rule) return true;
      var msg = rule(el.value, el);
      var field = el.closest(".jd-field");
      var err = document.getElementById(el.id + "-error");
      var help = el.getAttribute("data-help");
      if (msg) {
        if (!err) { err = document.createElement("p"); err.className = "jd-field__error"; err.id = el.id + "-error"; field.appendChild(err); }
        err.textContent = msg;
        el.setAttribute("aria-invalid", "true");
        el.setAttribute("aria-describedby", (help ? help + " " : "") + err.id);
        field.classList.add("jd-field--error");
        return false;
      }
      if (err) err.remove();
      el.removeAttribute("aria-invalid");
      if (help) el.setAttribute("aria-describedby", help); else el.removeAttribute("aria-describedby");
      field.classList.remove("jd-field--error");
      return true;
    }
    var touched = false;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      touched = true;
      var firstBad = null;
      Array.prototype.forEach.call(form.elements, function (el) { if (el.name && !check(el) && !firstBad) firstBad = el; });
      if (firstBad) { firstBad.focus(); return; }
      var btn = form.querySelector("[type=submit]");
      btn.setAttribute("aria-busy", "true"); btn.disabled = true; btn.textContent = "Envoi en cours…";
      setTimeout(function () {
        var ok = document.getElementById(form.getAttribute("data-success"));
        if (ok) { form.hidden = true; ok.hidden = false; ok.focus(); }
      }, 700);
    });
    form.addEventListener("focusout", function (e) { if (touched && e.target.name) check(e.target); });
    form.addEventListener("change", function (e) { if (touched && e.target.name) check(e.target); });
  });
})();
