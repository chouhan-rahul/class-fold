# 📝 Change Log

All notable changes to the **Class Fold** extension will be documented in this file.

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
