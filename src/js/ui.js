
"use strict";


/* ============================================================
Fonction pour réinitialiser les filtres
============================================================ */
export function resetFilters() {
    
    const checkboxes = document.querySelectorAll('.sidebar input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
  }