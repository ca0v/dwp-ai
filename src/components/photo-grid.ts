import { LitElement, html, css } from "lit";
import type { PhotoStatus } from "../data/types.ts";

export interface PhotoItem {
  id: string;
  status: PhotoStatus;
  filename: string;
}

export class PhotoGrid extends LitElement {
  static properties = {
    photos: { type: Array },
  };

  declare photos: PhotoItem[];

  constructor() {
    super();
    this.photos = [];
  }

  static styles = css`
    :host {
      display: block;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    @media (min-width: 768px) {
      .grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    @media (min-width: 1024px) {
      .grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }
    .photo-tile {
      position: relative;
      aspect-ratio: 1;
      border-radius: 10px;
      overflow: hidden;
      cursor: pointer;
      background: #e5e5e7;
      border: none;
      padding: 0;
    }
    .photo-tile:focus-visible {
      outline: 2px solid #0071e3;
      outline-offset: 2px;
    }
    .photo-tile img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .badge {
      position: absolute;
      bottom: 4px;
      left: 4px;
      right: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .badge--queued {
      background: rgba(235, 235, 235, 0.9);
      color: #555;
    }
    .badge--analyzing {
      background: rgba(255, 243, 224, 0.9);
      color: #b36600;
    }
    .badge--needs-review {
      background: rgba(255, 243, 224, 0.9);
      color: #b36600;
    }
    .badge--ready {
      background: rgba(232, 249, 238, 0.9);
      color: #1a7c36;
    }
    .badge--error {
      background: rgba(255, 234, 232, 0.9);
      color: #c0392b;
    }
    .empty {
      padding: 48px 16px;
      text-align: center;
      color: #6e6e73;
      font-size: 15px;
    }
  `;

  private _statusIcon(status: PhotoStatus): string {
    return (
      {
        queued: "⏳",
        analyzing: "🔍",
        "needs-review": "✏️",
        ready: "✅",
        error: "❌",
      }[status] ?? ""
    );
  }

  private _statusLabel(status: PhotoStatus): string {
    return (
      {
        queued: "Queued",
        analyzing: "Analyzing…",
        "needs-review": "Needs Review",
        ready: "Ready",
        error: "Error",
      }[status] ?? status
    );
  }

  private _handleClick(photo: PhotoItem): void {
    this.dispatchEvent(
      new CustomEvent("photo-selected", {
        detail: { photoId: photo.id },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    if (!this.photos.length) {
      return html`<div class="empty">No photos yet. Upload some to get started.</div>`;
    }
    return html`
      <div class="grid">
        ${this.photos.map(
          (photo) => html`
            <button
              class="photo-tile"
              @click=${() => this._handleClick(photo)}
              aria-label="Photo ${photo.id} — ${this._statusLabel(photo.status)}"
            >
              <img src="/images/${photo.filename}" alt="" loading="lazy" />
              <span class="badge badge--${photo.status}">
                ${this._statusIcon(photo.status)} ${this._statusLabel(photo.status)}
              </span>
            </button>
          `
        )}
      </div>
    `;
  }
}

customElements.define("photo-grid", PhotoGrid);
