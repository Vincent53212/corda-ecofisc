"use strict";
/* ============================================================================
   Construit le paquet de déploiement cPanel :  deploiement/dist/  — v2
   Exécution :   node tools/build-dist.js     (depuis le dossier Appli/)

   « Coffre-fort » : le paquet ne contient AUCUN contenu métier — ni moteur,
   ni catalogue, ni données de démo (tout vit dans Supabase). Le JavaScript
   de la page est MINIFIÉ (dissuasion + poids), un en-tête de droit d'auteur
   est apposé, et le site est non indexable (cercle fermé).

   Contenu produit (à téléverser TEL QUEL à la racine du sous-domaine) :
     · index.html   (= orchestrateur.html, JS minifié, © Corda)
     · .htaccess    (en-têtes de sécurité : CSP, nosniff, anti-iframe…)
     · robots.txt   (non indexé)
   ============================================================================ */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const os = require('node:os');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'deploiement', 'dist');
fs.mkdirSync(DIST, { recursive: true });
/* purge des artefacts d'anciennes versions (rules.js/demo-data.js ne se déploient plus) */
for (const f of ['rules.js', 'demo-data.js']) {
  const p = path.join(DIST, f);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

let html = fs.readFileSync(path.join(ROOT, 'orchestrateur.html'), 'utf8');

/* ---- minifier le script inline (esbuild via npx — cache local après le 1er appel) ---- */
const m = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
if (!m) throw new Error('script inline introuvable');
const tmpIn = path.join(os.tmpdir(), 'orch-inline.js');
const tmpOut = path.join(os.tmpdir(), 'orch-inline.min.js');
fs.writeFileSync(tmpIn, m[1], 'utf8');
execFileSync('npx', ['-y', 'esbuild', tmpIn, '--minify', '--charset=utf8', '--target=es2019', '--legal-comments=none', `--outfile=${tmpOut}`], { stdio: 'pipe', shell: process.platform === 'win32' });
const minJS = fs.readFileSync(tmpOut, 'utf8').trim();
html = html.replace(m[0], '<script>/*! © 2026 Corda — corda.consulting — tous droits réservés */' + minJS + '</script></body>');

/* ---- retirer les commentaires HTML/CSS/JS restants (rien à lire pour un curieux) ---- */
html = html.replace(/<!--[\s\S]*?-->/g, '');
html = html.replace(/\/\*(?!\!)[\s\S]*?\*\//g, ''); /* commentaires CSS (garde les /*! légaux) */
html = html.replace(/\n{3,}/g, '\n\n');

/* ---- en-tête de droit d'auteur ---- */
html = html.replace('<!DOCTYPE html>', '').replace(/^\s*/, '');
html = `<!DOCTYPE html>
<!-- ============================================================
  © 2026 Corda (corda.consulting) — Tous droits réservés.
  Orchestrateur — analyse multicritère de mesures écofiscales.
  Grille scientifique : F. Tremblay-Racicot et J. Couture (ENAP/CERGO).
  Reproduction ou réutilisation interdite sans autorisation écrite.
============================================================ -->
` + html;

fs.writeFileSync(path.join(DIST, 'index.html'), html, 'utf8');

/* ---- .htaccess — en-têtes de sécurité (révision B : CSP + en-têtes) ---- */
const htaccess = `# ecofisc.corda.consulting — en-têtes de sécurité (générés par tools/build-dist.js)
AddDefaultCharset utf-8

<IfModule mod_headers.c>
  Header always set Content-Security-Policy "default-src 'none'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://*.supabase.co; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "DENY"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  Header always set X-Robots-Tag "noindex, nofollow"
</IfModule>

# Toujours servir la dernière version de l'app (pas de vieille page en cache)
<IfModule mod_headers.c>
  <FilesMatch "\\.(html|js)$">
    Header set Cache-Control "no-cache, must-revalidate"
  </FilesMatch>
</IfModule>
`;
fs.writeFileSync(path.join(DIST, '.htaccess'), htaccess, 'utf8');
fs.writeFileSync(path.join(DIST, 'robots.txt'), 'User-agent: *\nDisallow: /\n', 'utf8');

const files = fs.readdirSync(DIST).map(f => {
  const s = fs.statSync(path.join(DIST, f));
  return `  ${f.padEnd(12)} ${(s.size / 1024).toFixed(1)} Ko`;
});
console.log('Paquet prêt → deploiement/dist/\n' + files.join('\n'));
