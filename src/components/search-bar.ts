import { LitElement, html, css } from "lit";
import "./tag-chip-list.ts";
import "./photo-grid.ts";
import type { PhotoItem } from "./photo-grid.ts";

export class SearchBar extends LitElement {
  static properties = {
    vocabulary: { type: Array },
    _query: { type: String, state: true },
    _suggestions: { type: Array, state: true },
    _results: { type: Array, state: true },
    _matchedTags: { type: Array, state: true },
    _loading: { type: Boolean, state: true },
    _searched: { type: Boolean, state: true },
  };

  declare vocabulary: string[];
  declare private _query: string;
  declare private _suggestions: string[];
  declare private _results: PhotoItem[];
  declare private _matchedTags: string[];
  declare private _loading: boolean;
  declare private _searched: boolean;

  constructor() {
    super();
    this.vocabulary = [];
    this._query = "";
    this._suggestions = [];
    this._results = [];
    this._matchedTags = [];
    this._loading = false;
    this._searched = false;
  }

  static styles = css`
    :host {
      display: block;
    }
    .search-form {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .search-input {
      flex: 1;
      min-height: 48px;
      padding: 10px 16px;
      border: 1px solid var(--color-border, #d2d2d7);
      border-radius: 12px;
      background: var(--color-surface-raised, #f5f5f7);
      color: var(--color-text, #1d1d1f);
      font-size: 16px;
    }
    .search-input:focus {
      outline: none;
      border-color: var(--color-accent, #0071e3);
      background: var(--color-surface, #fff);
    }
    .btn-search {
      min-height: 48px;
      padding: 10px 22px;
      border-radius: 12px;
      background: var(--color-accent, #0071e3);
      color: #fff;
      border: none;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
    }
    .btn-search:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .tag-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 16px;
    }
    .tag-btn {
      padding: 5px 14px;
      border-radius: 9999px;
      background: var(--color-surface-raised, #f5f5f7);
      border: 1px solid var(--color-border, #d2d2d7);
      cursor: pointer;
      font-size: 13px;
      min-height: 36px;
      color: var(--color-text, #1d1d1f);
    }
    .tag-btn:hover {
      background: var(--color-border, #d2d2d7);
    }
    .matched-tags {
      padding: 10px 14px;
      background: var(--color-surface-raised, #f5f5f7);
      border-radius: 10px;
      font-size: 14px;
      color: var(--color-text-secondary, #6e6e73);
      margin-bottom: 16px;
    }
    .empty {
      text-align: center;
      padding: 48px 16px;
      color: var(--color-text-secondary, #6e6e73);
    }
  `;

  private _onInput(e: Event): void {
    this._query = (e.target as HTMLInputElement).value;
    const q = this._query.toLowerCase().trim();
    if (!q) {
      this._suggestions = [];
      return;
    }
    this._suggestions = this.vocabulary.filter((t) => t.toLowerCase().includes(q)).slice(0, 10);
  }

  private _onKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter") this._search();
  }

  private async _search(): Promise<void> {
    if (!this._query.trim() || this._loading) return;
    this._loading = true;
    this._searched = false;
    try {
      const res = await fetch(`/api/search/expand?q=${encodeURIComponent(this._query.trim())}`);
      const { tags } = await res.json();
      this._matchedTags = tags as string[];

      // Now search by those tags
      const searchRes = await fetch(
        `/api/search?tags=${encodeURIComponent(tags.join(","))}&mode=OR`
      );
      const data = await searchRes.json();
      this._results = (data.photos ?? []) as PhotoItem[];
    } catch {
      this._results = [];
      this._matchedTags = [];
    } finally {
      this._loading = false;
      this._searched = true;
    }
  }

  private _selectTag(tag: string): void {
    this._query = tag;
    this._suggestions = [];
    this._search();
  }

  render() {
    return html`
      <div>
        <div class="search-form">
          <input
            class="search-input"
            type="search"
            placeholder="Search photos… (e.g. dogs at the beach)"
            .value=${this._query}
            @input=${this._onInput}
            @keydown=${this._onKeydown}
            aria-label="Search photos"
          />
          <button class="btn-search" @click=${this._search} ?disabled=${this._loading}>
            ${this._loading ? "…" : "Search"}
          </button>
        </div>

        ${this._suggestions.length
          ? html`
              <div class="tag-suggestions" role="listbox" aria-label="Suggested tags">
                ${this._suggestions.map(
                  (t) => html`
                    <button class="tag-btn" @click=${() => this._selectTag(t)}>${t}</button>
                  `
                )}
              </div>
            `
          : ""}
        ${this._matchedTags.length
          ? html`
              <div class="matched-tags">
                Matched tags: <strong>${this._matchedTags.join(", ")}</strong>
              </div>
            `
          : ""}
        ${this._searched && !this._results.length
          ? html`<div class="empty">No results found for "${this._query}".</div>`
          : ""}
        ${this._results.length ? html`<photo-grid .photos=${this._results}></photo-grid>` : ""}
      </div>
    `;
  }
}

customElements.define("search-bar", SearchBar);
