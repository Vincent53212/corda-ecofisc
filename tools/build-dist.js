"use strict";
/* ============================================================================
   Construit le paquet de déploiement cPanel :  deploiement/dist/
   Exécution :   node tools/build-dist.js     (depuis le dossier Appli/)

   Contenu produit (à téléverser TEL QUEL à la racine du sous-domaine
   ecofisc.corda.consulting via cPanel → File Manager) :
     · index.html    (= orchestrateur.html, renommé)
     · rules.js      (moteur + catalogue)
     · demo-data.js  (projet Démo, données fictives)
     · .htaccess     (en-têtes de sécurité : CSP, nosniff, anti-iframe…)
   ============================================================================ */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'deploiement', 'dist');
fs.mkdirSync(DIST, { recursive: true });

fs.copyFileSync(path.join(ROOT, 'orchestrateur.html'), path.join(DIST, 'index.html'));
fs.copyFileSync(path.join(ROOT, 'rules.js'),           path.join(DIST, 'rules.js'));
fs.copyFileSync(path.join(ROOT, 'demo-data.js'),       path.join(DIST, 'demo-data.js'));

/* .htaccess — en-têtes de sécurité (révision B : CSP + en-têtes via .htaccess).
   CSP : la page n'a le droit de parler qu'à ses propres fichiers, aux polices
   Google, au CDN d'ExcelJS et (Partie C) à Supabase. Tout le reste est bloqué. */
const htaccess = `# ecofisc.corda.consulting — en-têtes de sécurité (générés par tools/build-dist.js)
AddDefaultCharset utf-8

<IfModule mod_headers.c>
  Header always set Content-Security-Policy "default-src 'none'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://*.supabase.co; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "DENY"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
</IfModule>

# Toujours servir la dernière version de l'app (pas de vieille page en cache)
<IfModule mod_headers.c>
  <FilesMatch "\\.(html|js)$">
    Header set Cache-Control "no-cache, must-revalidate"
  </FilesMatch>
</IfModule>
`;
fs.writeFileSync(path.join(DIST, '.htaccess'), htaccess, 'utf8');

const files = fs.readdirSync(DIST).map(f => {
  const s = fs.statSync(path.join(DIST, f));
  return `  ${f.padEnd(14)} ${(s.size/1024).toFixed(1)} Ko`;
});
console.log('Paquet prêt → deploiement/dist/\n' + files.join('\n'));
