import {
  LitElement,
  html,
  css,
  repeat,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/all/lit-all.min.js";

class Category {
  constructor({ name, sources }) {
    this.id = Math.floor(Math.random() * 5000);
    this.name = name;
    this.sources = sources;
  }
}

const CategoryManager = new (class extends EventTarget {
  #store = [
    new Category({
      name: "Important",
      sources: ["discord", "reddit"],
    }),
    new Category({
      name: "Others",
      sources: ["nyt"], // TODO make this a real catch-all somehow
    }),
  ];

  getCategories() {
    return [...this.#store];
  }
})();

const NotificationManager = new (class {
  #store = [...window.NOTIFS];

  getNotifications(sources, searchQuery) {
    return this.#store.filter((notification) => {
      return (
        notification.title.toLowerCase().indexOf(searchQuery) >= 0 &&
        sources.includes(notification.src)
      );
    });
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
        border-radius: 4px;
        padding: 4px;
      }

      &:hover > main {
        background: #7773;
      }

      & .title {
        display: block;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow-x: hidden;
      }
    }

    .top {
      display: flex;
      justify-content: space-between;
    }

    button {
      border-radius: 4px;
      font-size: 90%;
      border: 1px solid CanvasText;
      background: Canvas;
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
    ul {
      list-style: none;
      padding-inline-start: 0;
    }
  `;

  constructor() {
    super();
    this.searchQuery = "";
  }

  connectedCallback() {
    super.connectedCallback();
    CategoryManager.addEventListener("change", this);
  }

  handleEvent(event) {
    if (event.type === "change") {
      this.requestUpdate();
    }
  }

  render() {
    return html`
      <search>
        <input
          value=${this.searchQuery}
          placeholder="Search"
          @input=${this.onSearchQueryChange}
        />
      </search>
      <ul>
        ${repeat(
          CategoryManager.getCategories(),
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
    `;
  }

  onSearchQueryChange(event) {
    this.searchQuery = event.target.value.toLowerCase();
  }
}

window.CategoryManager = CategoryManager;
customElements.define("mockup-category-list", CategoryListElement);
customElements.define("mockup-category", CategoryElement);
