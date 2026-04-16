import { LitElement, html, css } from "lit";

export class TagChipList extends LitElement {
  static properties = {
    tags: { type: Array },
    readonly: { type: Boolean },
  };

  declare tags: string[];
  declare readonly: boolean;

  constructor() {
    super();
    this.tags = [];
    this.readonly = false;
  }

  static styles = css`
    :host {
      display: block;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 9999px;
      background: var(--color-surface-raised, #f5f5f7);
      border: 1px solid var(--color-border, #d2d2d7);
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text, #1d1d1f);
      white-space: nowrap;
      min-height: 44px;
      min-width: 44px;
    }
    .chip__dismiss {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--color-text-secondary, #6e6e73);
      font-size: 16px;
      padding: 0;
      line-height: 1;
    }
    .chip__dismiss:hover {
      background: var(--color-border, #d2d2d7);
    }
    .chip__dismiss:focus-visible {
      outline: 2px solid var(--color-accent, #0071e3);
      outline-offset: 1px;
    }
    .empty {
      color: var(--color-text-secondary, #6e6e73);
      font-size: 14px;
      font-style: italic;
    }
  `;

  private _dismiss(tag: string): void {
    this.dispatchEvent(
      new CustomEvent("tag-removed", {
        detail: { tag },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    if (!this.tags.length) {
      return html`<p class="empty">No tags.</p>`;
    }
    return html`
      <div class="chips" role="list">
        ${this.tags.map(
          (tag) => html`
            <span class="chip" role="listitem">
              ${tag}
              ${!this.readonly
                ? html`
                    <button
                      class="chip__dismiss"
                      aria-label="Remove tag ${tag}"
                      @click=${() => this._dismiss(tag)}
                    >
                      ×
                    </button>
                  `
                : ""}
            </span>
          `
        )}
      </div>
    `;
  }
}

customElements.define("tag-chip-list", TagChipList);
