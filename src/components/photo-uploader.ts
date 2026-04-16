import { LitElement, html, css } from "lit";

export class PhotoUploader extends LitElement {
  static properties = {
    _files: { type: Array, state: true },
    _uploading: { type: Boolean, state: true },
    _uploaded: { type: Array, state: true },
    _error: { type: String, state: true },
  };

  declare private _files: File[];
  declare private _uploading: boolean;
  declare private _uploaded: string[];
  declare private _error: string;

  constructor() {
    super();
    this._files = [];
    this._uploading = false;
    this._uploaded = [];
    this._error = "";
  }

  static styles = css`
    :host {
      display: block;
    }
    .uploader {
      border: 2px dashed var(--color-border, #d2d2d7);
      border-radius: 16px;
      padding: 32px 16px;
      text-align: center;
    }
    .uploader__icon {
      font-size: 40px;
      margin-bottom: 12px;
    }
    .uploader__label {
      font-size: 17px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--color-text, #1d1d1f);
    }
    .uploader__sub {
      font-size: 14px;
      color: var(--color-text-secondary, #6e6e73);
      margin-bottom: 20px;
    }
    input[type="file"] {
      display: none;
    }
    .btn-row {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      padding: 10px 22px;
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
    .btn-secondary {
      background: var(--color-surface-raised, #f5f5f7);
      color: var(--color-text, #1d1d1f);
      border: 1px solid var(--color-border, #d2d2d7);
    }
    .btn-secondary:hover {
      background: var(--color-border, #d2d2d7);
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .status {
      margin-top: 16px;
      padding: 12px;
      border-radius: 10px;
      font-size: 14px;
    }
    .status--info {
      background: var(--color-surface-raised, #f5f5f7);
      color: var(--color-text, #1d1d1f);
    }
    .status--success {
      background: var(--color-success-bg, #e8f9ee);
      color: #1a7c36;
    }
    .status--error {
      background: var(--color-error-bg, #ffeae8);
      color: #c0392b;
    }
    .file-list {
      list-style: none;
      margin: 12px 0;
      text-align: left;
    }
    .file-list li {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
      font-size: 14px;
    }
  `;

  private _onFilesChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    this._files = input.files ? Array.from(input.files) : [];
    this._error = "";
    this._uploaded = [];
  }

  private async _upload(): Promise<void> {
    if (!this._files.length || this._uploading) return;
    this._uploading = true;
    this._error = "";

    try {
      const form = new FormData();
      for (const file of this._files) {
        form.append("files[]", file);
      }
      const res = await fetch("/api/photos", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error ?? "Upload failed");
      }
      const data = await res.json();
      this._uploaded = data.photoIds ?? [];
      this._files = [];
      this.dispatchEvent(
        new CustomEvent("photos-uploaded", {
          detail: { photoIds: this._uploaded },
          bubbles: true,
          composed: true,
        })
      );
    } catch (err) {
      this._error = (err as Error).message;
    } finally {
      this._uploading = false;
    }
  }

  render() {
    return html`
      <div class="uploader">
        <div class="uploader__icon">📷</div>
        <p class="uploader__label">Upload Photos</p>
        <p class="uploader__sub">Select multiple JPEG or PNG files</p>

        <div class="btn-row">
          <label>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png"
              @change=${this._onFilesChange}
              id="file-picker"
            />
            <span class="btn btn-secondary" role="button" tabindex="0"> 📂 Choose Files </span>
          </label>

          <label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              @change=${this._onFilesChange}
            />
            <span class="btn btn-secondary" role="button" tabindex="0"> 📸 Camera </span>
          </label>

          <button
            class="btn btn-primary"
            @click=${this._upload}
            ?disabled=${!this._files.length || this._uploading}
          >
            ${this._uploading ? "Uploading…" : `Upload ${this._files.length || ""}`}
          </button>
        </div>

        ${this._files.length
          ? html`
              <div class="status status--info">
                <strong
                  >${this._files.length} file${this._files.length !== 1 ? "s" : ""} selected</strong
                >
                <ul class="file-list">
                  ${this._files.map(
                    (f) => html`<li>📄 ${f.name} (${(f.size / 1024).toFixed(0)} KB)</li>`
                  )}
                </ul>
              </div>
            `
          : ""}
        ${this._uploaded.length
          ? html`
              <div class="status status--success">
                ✅ ${this._uploaded.length} photo${this._uploaded.length !== 1 ? "s" : ""} uploaded
                successfully.
                <a href="/">View in gallery</a>
              </div>
            `
          : ""}
        ${this._error ? html`<div class="status status--error">❌ ${this._error}</div>` : ""}
      </div>
    `;
  }
}

customElements.define("photo-uploader", PhotoUploader);
