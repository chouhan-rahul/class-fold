# 📝 Change Log

All notable changes to the **Class Fold** extension will be documented in this file.

## [0.1.1] - 2026-11-20

### 🐛 Fixed & Improved
- **Fixed Marketplace Badges:** Corrected repository URLs and shield badge paths in `package.json` to link directly to `chouhan-rahul/class-fold` instead of broken placeholder URLs.
- **Updated GitHub Component Labels:** Replaced leftover template labels in `.github/labels.yml` with dedicated Class Fold component labels (`fold: engine`, `fold: classes`, `fold: images`, `fold: svg`, `fold: custom`, `hover-preview`, `badges-decorations`, `status-bar`, `commands`).
- **Added PayPal Sponsor Links:** Added PayPal donation links to `.github/FUNDING.yml` and issue template contact configuration.
- **CI Workflow Security Permissions:** Added explicit `permissions: { contents: read }` to `.github/workflows/ci.yml` resolving CodeQL alert.
- **Dependency Security Patch:** Patched `minimatch` dependency to `^11.0.1` (resolved to `11.0.9`) resolving Dependabot vulnerability.
- **Comprehensive Link Audit:** Verified all repository, documentation, contributing, security, and issue links across the entire project.

---

## [0.1.0] - 2026-11-17

### 🎉 Initial Release

- **⚡ Inline Attribute Folding:** Automatically folds long HTML `class`, JSX `className`, template literals, and Vue `:class` attributes into clean, minimal masks.
- **🖼️ Image & Base64 Folding:** Collapses extensive Base64 Data URIs (`data:image/...`) and lengthy image URLs in `src` and `srcset` attributes.
- **📐 SVG Path Folding:** Condenses extensive vector graphic path definitions (`d="..."`) and coordinate lists (`points="..."`).
- **🔍 Rich Hover Tooltips:** Interactive hover preview displaying class token counts, character lengths, and visual thumbnail previews for image sources.
- **🖱️ Smooth Auto-Unfold:** Automatically unfolds attributes when the cursor enters the folded range and smoothly restores the fold when moving away.
- **⚙️ Custom Pattern Matching:** User-configurable regular expression support for folding custom attributes.
- **🎨 Configurable Styling:** Support for multiple badge styles (`minimal`, `pill`, `bordered`), type-specific mask characters, and customizable minimum fold lengths.
- **📊 Status Bar Integration:** Live status bar counter displaying the count of folded items (`$(fold) Class Fold: X`) with one-click toggle functionality.
- **⌨️ Commands & Keybindings:**
  - `Alt + Z` (`Class Fold: Toggle Folding (Global)`) – Toggle inline folding workspace-wide.
  - `Alt + L` (`Class Fold: Toggle Fold on Current Line`) – Temporarily expand or collapse the current line.
  - `Class Fold: Copy Folded Content Under Cursor` – Quickly copy full attribute text to clipboard.
  - `Class Fold: Unfold All in Active File` – Expand all folded attributes in the active document.
  - `Class Fold: Re-Fold All in Active File` – Re-apply all folds in the active document.

[0.1.1]: https://github.com/chouhan-rahul/class-fold/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/chouhan-rahul/class-fold/releases/tag/v0.1.0
