import {
  LitElement,
  html,
  css,
  repeat,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/all/lit-all.min.js";

const NotificationManager = new (class {
  #store = [...window.NOTIFS];

  getNotifications(sources, searchQuery) {
    return this.#store.filter((notification) => {
      return (
        notification.title.toLowerCase().indexOf(searchQuery) >= 0 &&
        sources.find(src => src.id === notification.src)
      );
    });
  }

  getCategories() {
    let categories = new Map();
    for (const source of window.SOURCES) {
      categories.set(source.profile, categories.getOrInsert(source.profile, []).concat([source]));
    }
    return [...categories.entries().map(([k,v]) => ({ id: k, name: k, sources: v }))];
  }
})();

class CategoryElement extends LitElement {
  static properties = {
    category: { attribute: false },
    filter: { type: String },
  };

  static styles = css`
    h2 {
      margin-bottom: 0;
    }

    .notification {
      padding-block: 2px;

      & > main {
        border-radius: 8px;
        padding: 4px;
        padding-inline: 6px;
      }

      &:hover > main {
        background: #7773;
      }

      & .title {
        display: block;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow-x: hidden;
        font-weight: 500;
      }

      & .source {
        color: #aaa;
      }
    }

    .top {
      display: flex;
      justify-content: space-between;
      font-size: 90%;
    }

    .name {
      text-transform: uppercase;
      font-weight: 300;
    }

    button {
      border-radius: 9999px;
      padding-inline: 8px;
      font-size: 90%;
      color: white;
      border: 1px solid white;
      background: transparent;
    }
  `;

  render() {
    let notifications = NotificationManager.getNotifications(
      this.category.sources,
      this.filter,
    );
    if (!notifications.length) {
      return;
    }
    return html`
      <div>
        <div class="top">
          <strong class="name">${this.category.name}</strong>
          <button class="info">${this.category.sources.length} sources</button>
        </div>
        ${repeat(
          notifications,
          (notification) => notification.when,
          this.notificationTemplate,
        )}
      </div>
    `;
  }

  notificationTemplate(notification) {
    return html`
      <div class="notification">
        <main>
          <strong class="title">${notification.title}</strong>
          <span class="source">${window.SOURCES.find(x => x.id === notification.src).name}</span>
        </main>
      </div>
    `;
  }
}

class CategoryListElement extends LitElement {
  static properties = {
    searchQuery: { type: String },
  };

  static styles = css`
    div {
      display: flex;
      flex-direction: column;
      align-items: stretch;
    }

    ul {
      list-style: none;
      padding-inline-start: 0;
    }

    input {
      padding: 8px;
      padding-inline-start: 16px;
      background: #fff2;
      color: white;
      border: 1px solid #bbb;
      border-radius: 9999px;
    }
  `;

  constructor() {
    super();
    this.searchQuery = "";
  }

  handleEvent(event) {
    if (event.type === "change") {
      this.requestUpdate();
    }
  }

  render() {
    return html`
      <div>
        <input
          value=${this.searchQuery}
          placeholder="Search"
          @input=${this.onSearchQueryChange}
        />
        <ul>
          ${repeat(
            NotificationManager.getCategories(),
            (category) => category.id,
            (category) => html`
              <li>
                <mockup-category
                  .category=${category}
                  .filter=${this.searchQuery}
                ></mockup-category>
              </li>
            `,
          )}
        </ul>
      </div>
    `;
  }

  onSearchQueryChange(event) {
    this.searchQuery = event.target.value.toLowerCase();
  }
}

window.NotificationManager = NotificationManager;
customElements.define("mockup-category-list", CategoryListElement);
customElements.define("mockup-category", CategoryElement);

window.addEventListener("load", event => {
  document.querySelector(".sb__view[data-view=recent]").appendChild(document.createElement("mockup-category-list"));
});
