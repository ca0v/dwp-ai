import { LitElement, html, css } from "lit";
import "./tag-chip-list.ts";

export class TagReviewSheet extends LitElement {
  static properties = {
    tags: { type: Array },
    vocabulary: { type: Array },
    _input: { type: String, state: true },
    _suggestions: { type: Array, state: true },
  };

  declare tags: string[];
  declare vocabulary: string[];
  declare private _input: string;
  declare private _suggestions: string[];

  constructor() {
    super();
    this.tags = [];
    this.vocabulary = [];
    this._input = "";
    this._suggestions = [];
  }

  static styles = css`
    :host {
      display: block;
    }
    .section {
      margin-bottom: 20px;
    }
    .label {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-secondary, #6e6e73);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .add-row {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    .add-input {
      flex: 1;
      min-height: 44px;
      padding: 8px 12px;
      border: 1px solid var(--color-border, #d2d2d7);
      border-radius: 10px;
      background: var(--color-surface, #fff);
      color: var(--color-text, #1d1d1f);
      font-size: 15px;
    }
    .add-input:focus {
      outline: none;
      border-color: var(--color-accent, #0071e3);
      box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.2);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      padding: 8px 18px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: background 150ms;
    }
    .btn-primary {
      background: var(--color-accent, #0071e3);
      color: #fff;
    }
    .btn-primary:hover {
      background: #0077ed;
    }
    .btn-accept {
      width: 100%;
      margin-top: 16px;
      background: var(--color-success, #34c759);
      color: #fff;
      font-size: 16px;
      font-weight: 600;
    }
    .btn-accept:hover {
      opacity: 0.9;
    }
    .suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    .suggestion-chip {
      padding: 4px 12px;
      border-radius: 9999px;
      background: var(--color-surface-raised, #f5f5f7);
      border: 1px solid var(--color-border, #d2d2d7);
      cursor: pointer;
      font-size: 13px;
      min-height: 32px;
      display: inline-flex;
      align-items: center;
    }
    .suggestion-chip:hover {
      background: var(--color-border, #d2d2d7);
    }
  `;

  private _removeTag(e: CustomEvent): void {
    this.tags = this.tags.filter((t) => t !== e.detail.tag);
  }

  private _addTag(value: string): void {
    const v = value.trim().toLowerCase();
    if (v && !this.tags.includes(v)) {
      this.tags = [...this.tags, v];
    }
    this._input = "";
    this._suggestions = [];
  }

  private _onInput(e: Event): void {
    this._input = (e.target as HTMLInputElement).value;
    const q = this._input.toLowerCase().trim();
    if (q.length < 1) {
      this._suggestions = [];
      return;
    }
    this._suggestions = this.vocabulary
      .filter((t) => t.toLowerCase().includes(q) && !this.tags.includes(t))
      .slice(0, 8);
  }

  private _onKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter") {
      e.preventDefault();
      this._addTag(this._input);
    }
  }

  private _acceptAll(): void {
    this.dispatchEvent(
      new CustomEvent("tags-approved", {
        detail: { tags: [...this.tags] },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div>
        <div class="section">
          <p class="label">Suggested Tags</p>
          <tag-chip-list .tags=${this.tags} @tag-removed=${this._removeTag}></tag-chip-list>
        </div>

        <div class="section">
          <p class="label">Add a Tag</p>
          <div class="add-row">
            <input
              class="add-input"
              type="text"
              placeholder="Type a tag…"
              .value=${this._input}
              @input=${this._onInput}
              @keydown=${this._onKeydown}
              aria-label="Add custom tag"
            />
            <button class="btn btn-primary" @click=${() => this._addTag(this._input)}>Add</button>
          </div>
          ${this._suggestions.length
            ? html`
                <div class="suggestions" role="listbox" aria-label="Suggestions">
                  ${this._suggestions.map(
                    (s) => html`
                      <button class="suggestion-chip" role="option" @click=${() => this._addTag(s)}>
                        ${s}
                      </button>
                    `
                  )}
                </div>
              `
            : ""}
        </div>

        <button class="btn btn-accept" @click=${this._acceptAll}>✓ Accept All Tags</button>
      </div>
    `;
  }
}

customElements.define("tag-review-sheet", TagReviewSheet);
