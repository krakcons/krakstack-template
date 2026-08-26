import { html, type Html } from "@/datastar";
import type {
  ApiKeySummary,
  OrganizationSummary,
  UserSession,
} from "@/auth";
import { getMessages, type Locale } from "@/messages";
import type { Task } from "@/services/task";

type ViewContext = {
  readonly locale: Locale;
};

export type Theme = "light" | "dark" | "system";
export type AdminSection =
  | "tasks"
  | "account"
  | "security"
  | "api-keys"
  | "organizations"
  | "permissions";

const basePath = (locale: Locale) => `/${locale}`;

const dashboardIcon = html`<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg>`;
const buildingIcon = html`<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 21h18M6 21V7l6-4 6 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01"></path></svg>`;
const languagesIcon = html`<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"></path></svg>`;
const sunIcon = html`<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"></path></svg>`;
const moonIcon = html`<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.5 14.1A8.5 8.5 0 0 1 9.9 3.5a9 9 0 1 0 10.6 10.6Z"></path></svg>`;
const monitorIcon = html`<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M8 21h8M12 17v4"></path></svg>`;
const chevronsIcon = html`<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m7 15 5 5 5-5M7 9l5-5 5 5"></path></svg>`;
const userIcon = html`<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M19 21a7 7 0 0 0-14 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"></path></svg>`;
const userCircleIcon = html`<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="8" r="3"></circle><path d="M6.5 19c1.2-2.4 3-3.5 5.5-3.5s4.3 1.1 5.5 3.5"></path></svg>`;
const shieldIcon = html`<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8Z"></path><path d="m9 12 2 2 4-4"></path></svg>`;
const keyIcon = html`<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="7.5" cy="15.5" r="5.5"></circle><path d="m11.5 11.5 8-8M15 8l3 3M17 6l3 3"></path></svg>`;
const checkSquareIcon = html`<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9 11 3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`;
const logoutIcon = html`<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path></svg>`;
const moreIcon = html`<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle></svg>`;
const circleIcon = html`<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle></svg>`;
const checkCircleIcon = html`<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="m8 12 2.5 2.5L16 9"></path></svg>`;
const pencilIcon = html`<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"></path></svg>`;
const rotateIcon = html`<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"></path><path d="M3 3v5h5"></path></svg>`;
const trashIcon = html`<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"></path></svg>`;

const renderAppBrand = (
  context: ViewContext,
  options?: {
    readonly label?: string;
    readonly subtitle?: string;
    readonly icon?: Html;
    readonly sidebar?: boolean;
  },
) => {
  const messages = getMessages(context.locale);
  return html`
    <span class="app-brand ${options?.sidebar ? "sidebar-brand" : ""}">
      <span class="app-brand-icon">${options?.icon ?? dashboardIcon}</span>
      <span class="app-brand-copy">
        <strong>${options?.label ?? "KrakStack"}</strong>
        <small>${options?.subtitle ?? messages.appName}</small>
      </span>
    </span>
  `;
};

export const renderTaskForm = (
  context: ViewContext,
  error?: string,
): Html => {
  const messages = getMessages(context.locale);
  const path = `${basePath(context.locale)}/admin`;

  return html`
    <form
      id="task-form"
      class="task-form"
      method="post"
      action="${path}/tasks"
      data-on:submit__prevent="@post('${path}/tasks', {contentType: 'form'})"
      data-indicator:creating
    >
      <div class="dialog-header"><h2>${messages.addTask}</h2><p>${messages.createTaskDescription}</p></div>
      <label>
        <span>${messages.titleLabel}</span>
        <input
          name="title"
          maxlength="200"
          placeholder="${messages.titlePlaceholder}"
          required
        />
      </label>
      <label>
        <span>${messages.description}</span>
        <textarea
          name="description"
          rows="3"
          placeholder="${messages.descriptionPlaceholder}"
        ></textarea>
      </label>
      ${error
        ? html`<p class="form-error" role="alert">${error}</p>`
        : null}
      <div class="dialog-footer">
        <button class="secondary" type="button" data-on:click="el.closest('dialog').close()">${messages.cancel}</button>
        <button class="primary" type="submit" data-attr:disabled="$creating"><span data-show="!$creating">${messages.addTask}</span><span data-show="$creating">${messages.saving}</span></button>
      </div>
    </form>
  `;
};

export const renderTaskCreateDialog = (context: ViewContext): Html => html`
  <dialog id="task-create-dialog" class="dialog task-dialog" data-on:click="evt.target === el && el.close()">${renderTaskForm(context)}</dialog>
`;

const formatTaskDate = (date: Date, locale: Locale) =>
  new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

const renderTaskRow = (task: Task, context: ViewContext): Html => {
  const messages = getMessages(context.locale);
  const path = `${basePath(context.locale)}/admin`;
  return html`
    <tr
      id="task-${task.id}"
      class="task-row ${task.completed ? "is-complete" : ""}"
      data-show="$filter === '' || el.textContent.toLowerCase().includes($filter.toLowerCase())"
    >
      <td><div class="task-copy"><strong>${task.title}</strong>${task.description ? html`<span>${task.description}</span>` : null}</div></td>
      <td><span class="status-badge ${task.completed ? "is-done" : ""}"><span class="status-icon">${task.completed ? checkCircleIcon : circleIcon}</span>${task.completed ? messages.done : messages.open}</span></td>
      <td class="task-updated"><time datetime="${task.updatedAt.toISOString()}">${formatTaskDate(task.updatedAt, context.locale)}</time></td>
      <td class="task-actions-cell">
        <details class="dropdown row-actions" name="task-action-menu" data-on:click__outside="el.removeAttribute('open')">
          <summary class="row-actions-trigger" aria-label="${messages.edit}">${moreIcon}</summary>
          <div class="dropdown-content dropdown-end task-actions-menu">
            <button class="dropdown-item" type="button" data-on:click="el.closest('details').removeAttribute('open'); document.getElementById('task-edit-${task.id}').showModal()"><span class="menu-icon">${pencilIcon}</span>${messages.edit}</button>
            <button class="dropdown-item" type="button" data-on:click="@patch('${path}/tasks/${task.id}/toggle')"><span class="menu-icon">${task.completed ? rotateIcon : checkCircleIcon}</span>${task.completed ? messages.open : messages.completed}</button>
            <div class="dropdown-separator"></div>
            <button class="dropdown-item destructive-item" type="button" data-on:click="el.closest('details').removeAttribute('open'); document.getElementById('task-delete-${task.id}').showModal()"><span class="menu-icon">${trashIcon}</span>${messages.deleteTask}</button>
          </div>
        </details>
      </td>
    </tr>
  `;
};

const renderTaskDialogs = (task: Task, context: ViewContext): Html => {
  const messages = getMessages(context.locale);
  const path = `${basePath(context.locale)}/admin`;
  return html`
    <dialog id="task-edit-${task.id}" class="dialog task-dialog" data-on:click="evt.target === el && el.close()">
      <form class="task-form" data-on:submit__prevent="@put('${path}/tasks/${task.id}', {contentType: 'form'}); el.closest('dialog').close()">
        <div class="dialog-header"><h2>${messages.edit}</h2><p>${messages.editTaskDescription}</p></div>
        <label><span>${messages.titleLabel}</span><input name="title" value="${task.title}" required maxlength="200" /></label>
        <label><span>${messages.description}</span><textarea name="description" rows="3">${task.description ?? ""}</textarea></label>
        <div class="dialog-footer"><button class="secondary" type="button" data-on:click="el.closest('dialog').close()">${messages.cancel}</button><button class="primary" type="submit">${messages.save}</button></div>
      </form>
    </dialog>
    <dialog id="task-delete-${task.id}" class="dialog confirm-dialog" data-on:click="evt.target === el && el.close()">
      <div class="confirm-content"><div class="dialog-header"><h2>${messages.deleteTask}?</h2><p>${task.title}</p></div><div class="dialog-footer"><button class="secondary" type="button" data-on:click="el.closest('dialog').close()">${messages.cancel}</button><button class="danger button" type="button" data-on:click="@delete('${path}/tasks/${task.id}')">${messages.deleteTask}</button></div></div>
    </dialog>
  `;
};

export const renderTaskList = (
  tasks: ReadonlyArray<Task>,
  context: ViewContext,
): Html => {
  const messages = getMessages(context.locale);

  return html`
    <section id="task-list" class="task-list" aria-live="polite">
      <div class="table-toolbar">
        <label class="filter">
          <span>${messages.filter}</span>
          <input data-bind:filter type="search" placeholder="${messages.filter}" />
        </label>
        <span class="table-count">${messages.taskCount(tasks.length)}</span>
      </div>
      <div class="table-scroll"><table class="task-table"><thead><tr><th>${messages.taskColumn}</th><th>${messages.status}</th><th>${messages.updated}</th><th><span class="sr-only">${messages.edit}</span></th></tr></thead><tbody>${tasks.length > 0 ? tasks.map((task) => renderTaskRow(task, context)) : html`<tr><td class="empty" colspan="4">${messages.empty}</td></tr>`}</tbody></table></div>
      ${tasks.map((task) => renderTaskDialogs(task, context))}
    </section>
  `;
};

const renderDocument = (
  context: ViewContext,
  title: string,
  theme: Theme,
  body: Html,
): Html => {
  const messages = getMessages(context.locale);
  return html`<!doctype html>
    <html
      lang="${context.locale}"
      data-theme="${theme}"
      data-signals:theme="'${theme}'"
      data-attr:data-theme="$theme"
    >
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="${messages.intro}" />
        <title>${title} · KrakStack</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" />
        <link rel="stylesheet" href="/styles.css" />
        <script type="module" src="/datastar.js"></script>
      </head>
      <body>${body}</body>
    </html>`;
};

const renderThemeSwitcher = (context: ViewContext) => {
  const messages = getMessages(context.locale);
  return html`
    <details class="dropdown switcher theme-switcher" name="app-menu" data-on:click__outside="el.removeAttribute('open')">
      <summary class="icon-button" aria-label="${messages.appearance}">
        <span class="theme-trigger-icon light-icon">${sunIcon}</span>
        <span class="theme-trigger-icon dark-icon">${moonIcon}</span>
        <span class="theme-trigger-icon system-icon">${monitorIcon}</span>
        <span class="sr-only">${messages.appearance}</span>
      </summary>
      <div class="dropdown-content dropdown-end">
        <p class="dropdown-label">${messages.appearance}</p>
        <button class="dropdown-item" type="button" data-on:click="$theme = 'light'; el.closest('details').removeAttribute('open'); @post('/${context.locale}/theme')"><span class="menu-icon">${sunIcon}</span><span>${messages.light}</span><span class="radio-mark light-mark" aria-hidden="true"></span></button>
        <button class="dropdown-item" type="button" data-on:click="$theme = 'dark'; el.closest('details').removeAttribute('open'); @post('/${context.locale}/theme')"><span class="menu-icon">${moonIcon}</span><span>${messages.dark}</span><span class="radio-mark dark-mark" aria-hidden="true"></span></button>
        <button class="dropdown-item" type="button" data-on:click="$theme = 'system'; el.closest('details').removeAttribute('open'); @post('/${context.locale}/theme')"><span class="menu-icon">${monitorIcon}</span><span>${messages.system}</span><span class="radio-mark system-mark" aria-hidden="true"></span></button>
      </div>
    </details>
  `;
};

const renderLocaleSwitcher = (
  context: ViewContext,
  destination = "",
) => {
  const messages = getMessages(context.locale);
  return html`
    <details class="dropdown switcher locale-switcher" name="app-menu" data-on:click__outside="el.removeAttribute('open')">
      <summary class="icon-button" aria-label="${messages.languageLabel}">${languagesIcon}<span class="sr-only">${messages.languageLabel}</span></summary>
      <div class="dropdown-content dropdown-end">
        <p class="dropdown-label">${messages.languageLabel}</p>
        <a class="dropdown-item" href="/en${destination}"><span>${messages.localeEnglish}</span>${context.locale === "en" ? html`<span class="radio-mark" aria-hidden="true"></span>` : null}</a>
        <a class="dropdown-item" href="/fr${destination}"><span>${messages.localeFrench}</span>${context.locale === "fr" ? html`<span class="radio-mark" aria-hidden="true"></span>` : null}</a>
      </div>
    </details>
  `;
};

const renderOrganizationSwitcher = (
  context: ViewContext,
  data: AdminPageData,
) => {
  const messages = getMessages(context.locale);
  const active = data.organizations.find(
    (organization) => organization.id === data.session.activeOrganizationId,
  );
  const others = data.organizations.filter(
    (organization) => organization.id !== active?.id,
  );
  return html`
    <details class="dropdown organization-switcher" name="app-menu" data-on:click__outside="el.removeAttribute('open')">
      <summary class="organization-trigger">
        ${renderAppBrand(context, {
          label: active?.name ?? messages.organizationSwitcherLabel,
          subtitle: active?.slug ?? messages.organization,
          icon: buildingIcon,
          sidebar: true,
        })}
        <span class="organization-chevrons">${chevronsIcon}</span>
      </summary>
      <div class="dropdown-content organization-menu">
        <div class="organization-current">${renderAppBrand(context, {
          label: active?.name ?? messages.organizationSwitcherLabel,
          subtitle: active?.slug ?? messages.organization,
          icon: buildingIcon,
          sidebar: true,
        })}</div>
        <div class="dropdown-separator"></div>
        ${others.length
          ? html`<div class="organization-list ${others.length > 5 ? "is-scrollable" : ""}">${others.map((organization) => html`<form method="post" action="/${context.locale}/admin/organizations/${organization.id}/activate"><button class="dropdown-item organization-option" type="submit">${renderAppBrand(context, { label: organization.name, subtitle: organization.slug, icon: buildingIcon })}</button></form>`)}</div>`
          : html`<p class="dropdown-empty">${messages.noOtherOrganizations}</p>`}
        <div class="dropdown-separator"></div>
        <a class="dropdown-item ${data.section === "organizations" ? "active" : ""}" href="/${context.locale}/admin/organizations">${messages.organizations}</a>
        <a class="dropdown-item ${data.section === "permissions" ? "active" : ""}" href="/${context.locale}/admin/permissions">${messages.permissions}</a>
      </div>
    </details>
  `;
};

const renderUserButton = (context: ViewContext, data: AdminPageData) => {
  const messages = getMessages(context.locale);
  return html`
    <details class="dropdown user-button" name="app-menu" data-on:click__outside="el.removeAttribute('open')">
      <summary class="icon-button user-trigger" aria-label="${messages.account}">
        ${data.session.user.image
          ? html`<img src="${data.session.user.image}" alt="${data.session.user.name}" />`
          : userIcon}
        <span class="sr-only">${messages.account}</span>
      </summary>
      <div class="dropdown-content dropdown-end user-menu">
        <div class="user-menu-label">${renderAppBrand(context, {
          label: data.session.user.name || data.session.user.email,
          subtitle: data.session.user.name
            ? data.session.user.email
            : messages.account,
          icon: userIcon,
        })}</div>
        <div class="dropdown-separator"></div>
        <a class="dropdown-item ${data.section === "account" ? "active" : ""}" href="/${context.locale}/admin/account"><span class="menu-icon">${userCircleIcon}</span>${messages.account}</a>
        <a class="dropdown-item ${data.section === "security" ? "active" : ""}" href="/${context.locale}/admin/security"><span class="menu-icon">${shieldIcon}</span>${messages.security}</a>
        <a class="dropdown-item ${data.section === "api-keys" ? "active" : ""}" href="/${context.locale}/admin/api-keys"><span class="menu-icon">${keyIcon}</span>${messages.apiKeys}</a>
        <div class="dropdown-separator"></div>
        <form method="post" action="/${context.locale}/logout"><button class="dropdown-item" type="submit"><span class="menu-icon">${logoutIcon}</span>${messages.logout}</button></form>
      </div>
    </details>
  `;
};

export const renderHomePage = (context: ViewContext, theme: Theme): Html => {
  const messages = getMessages(context.locale);
  return renderDocument(
    context,
    messages.homeTitle,
    theme,
    html`
      <main class="shell landing">
        <nav class="topbar" aria-label="${messages.languageLabel}">
          <a class="brand" href="/${context.locale}">${renderAppBrand(context)}</a>
          <div class="top-actions">
            <a class="admin-link" href="/${context.locale}/admin">${messages.admin}</a>
            ${renderThemeSwitcher(context)}
            ${renderLocaleSwitcher(context)}
          </div>
        </nav>
        <section class="landing-hero">
          <p class="eyebrow">${messages.eyebrow}</p>
          <h1>${messages.homeTitle}</h1>
          <p class="intro">${messages.brandDescription}</p>
          <div class="landing-actions">
            <a class="button primary" href="/${context.locale}/admin">${messages.getStarted}</a>
            <a class="button secondary" href="/${context.locale}/sign-in">${messages.signIn}</a>
          </div>
        </section>
      </main>
    `,
  );
};

export const renderSignInPage = (
  context: ViewContext,
  theme: Theme,
  error?: string,
): Html => {
  const messages = getMessages(context.locale);
  return renderDocument(
    context,
    messages.signIn,
    theme,
    html`
      <main class="auth-shell">
        <a class="back-link" href="/${context.locale}">${messages.backHome}</a>
        <section class="auth-card">
          <p class="eyebrow">KrakStack Auth</p>
          <h1>${messages.signIn}</h1>
          <p>${messages.signInDescription}</p>
          <form method="post" action="/${context.locale}/sign-in" class="task-form">
            <label><span>${messages.email}</span><input type="email" name="email" required autocomplete="email" /></label>
            <label><span>${messages.password}</span><input type="password" name="password" required autocomplete="current-password" /></label>
            ${error ? html`<p class="form-error" role="alert">${error}</p>` : null}
            <button class="primary" type="submit">${messages.signIn}</button>
            <a href="/${context.locale}/forgot-password">${messages.forgotPassword}</a>
            <a href="/${context.locale}/verify-email">${messages.verifyEmail}</a>
          </form>
        </section>
      </main>
    `,
  );
};

export const renderForgotPasswordPage = (
  context: ViewContext,
  theme: Theme,
): Html => {
  const messages = getMessages(context.locale);
  return renderDocument(context, messages.forgotPassword, theme, html`
    <main class="auth-shell"><a class="back-link" href="/${context.locale}/sign-in">${messages.signIn}</a><section class="auth-card"><h1>${messages.forgotPassword}</h1><form method="post" action="/${context.locale}/forgot-password" class="task-form"><label><span>${messages.email}</span><input type="email" name="email" required autocomplete="email" /></label><button class="primary" type="submit">${messages.resetPassword}</button></form></section></main>
  `);
};

export const renderResetPasswordPage = (
  context: ViewContext,
  theme: Theme,
  token: string,
): Html => {
  const messages = getMessages(context.locale);
  return renderDocument(context, messages.resetPassword, theme, html`
    <main class="auth-shell"><section class="auth-card"><h1>${messages.resetPassword}</h1><form method="post" action="/${context.locale}/reset-password" class="task-form"><input type="hidden" name="token" value="${token}" /><label><span>${messages.newPassword}</span><input type="password" name="newPassword" required minlength="8" autocomplete="new-password" /></label><button class="primary" type="submit">${messages.resetPassword}</button></form></section></main>
  `);
};

export const renderVerifyEmailPage = (
  context: ViewContext,
  theme: Theme,
): Html => {
  const messages = getMessages(context.locale);
  return renderDocument(context, messages.verifyEmail, theme, html`
    <main class="auth-shell"><a class="back-link" href="/${context.locale}/sign-in">${messages.signIn}</a><section class="auth-card"><h1>${messages.verifyEmail}</h1><form method="post" action="/${context.locale}/verify-email/send" class="task-form"><label><span>${messages.email}</span><input type="email" name="email" required autocomplete="email" /></label><button class="primary" type="submit">${messages.sendCode}</button></form><form method="post" action="/${context.locale}/verify-email" class="task-form"><label><span>${messages.email}</span><input type="email" name="email" required autocomplete="email" /></label><label><span>${messages.twoFactorCode}</span><input name="otp" inputmode="numeric" required autocomplete="one-time-code" /></label><button class="primary" type="submit">${messages.verifyEmail}</button></form></section></main>
  `);
};

type AdminPageData = {
  readonly apiKeys: ReadonlyArray<ApiKeySummary>;
  readonly createdKey?: string;
  readonly organizations: ReadonlyArray<OrganizationSummary>;
  readonly section: AdminSection;
  readonly session: UserSession;
  readonly tasks: ReadonlyArray<Task>;
  readonly theme: Theme;
  readonly twoFactorSetup?: {
    readonly totpURI: string;
    readonly backupCodes: ReadonlyArray<string>;
  };
};

const renderAdminContent = (context: ViewContext, data: AdminPageData): Html => {
  const messages = getMessages(context.locale);
  if (data.section === "tasks") {
    return html`
      <div data-init="@get('/${context.locale}/admin/tasks/stream', {openWhenHidden: true})">
      <header class="page-heading task-page-heading">
        <div><span class="outline-badge">${messages.private}</span><h1>${messages.title}</h1><p>${messages.taskDescription}</p></div>
        <button class="primary" type="button" data-on:click="document.getElementById('task-create-dialog').showModal()">${messages.addTask}</button>
      </header>
      ${renderTaskCreateDialog(context)}
      ${renderTaskList(data.tasks, context)}
      </div>
    `;
  }
  if (data.section === "account") {
    return html`
      <header class="page-heading"><h1>${messages.account}</h1><p>${messages.profileDescription}</p></header>
      <section class="portal-card profile-card">
        ${data.session.user.image ? html`<img class="avatar" src="${data.session.user.image}" alt="" />` : html`<span class="avatar fallback">${data.session.user.name.slice(0, 1)}</span>`}
        <div class="profile-details"><dl><div><dt>${messages.name}</dt><dd>${data.session.user.name}</dd></div><div><dt>${messages.email}</dt><dd>${data.session.user.email}</dd></div><div><dt>${messages.verification}</dt><dd>${data.session.user.emailVerified ? "✓" : "—"}</dd></div></dl><form method="post" action="/${context.locale}/admin/account" class="portal-form"><label><span>${messages.name}</span><input name="name" value="${data.session.user.name}" required /></label><label><span>${messages.imageUrl}</span><input name="image" type="url" value="${data.session.user.image ?? ""}" /></label><button class="primary" type="submit">${messages.save}</button></form></div>
      </section>
    `;
  }
  if (data.section === "security") {
    return html`
      <header class="page-heading"><h1>${messages.security}</h1><p>${messages.securityDescription}</p></header>
      <div class="security-grid">
        <section class="portal-card"><form method="post" action="/${context.locale}/admin/security/password" class="portal-form"><label><span>${messages.currentPassword}</span><input name="currentPassword" type="password" required autocomplete="current-password" /></label><label><span>${messages.newPassword}</span><input name="newPassword" type="password" required autocomplete="new-password" minlength="8" /></label><button class="primary" type="submit">${messages.save}</button></form></section>
        <section class="portal-card"><form method="post" action="/${context.locale}/admin/security/two-factor/enable" class="portal-form"><label><span>${messages.password}</span><input name="password" type="password" required autocomplete="current-password" /></label><button class="primary" type="submit">${messages.enableTwoFactor}</button></form></section>
        ${data.twoFactorSetup ? html`<section class="portal-card setup-result"><label><span>${messages.setupUri}</span><code>${data.twoFactorSetup.totpURI}</code></label><div><strong>${messages.backupCodes}</strong><ul>${data.twoFactorSetup.backupCodes.map((code) => html`<li><code>${code}</code></li>`)}</ul></div><form method="post" action="/${context.locale}/admin/security/two-factor/verify" class="portal-form"><label><span>${messages.twoFactorCode}</span><input name="code" inputmode="numeric" autocomplete="one-time-code" required /></label><button class="primary" type="submit">${messages.verifyTwoFactor}</button></form></section>` : null}
        <section class="portal-card"><form method="post" action="/${context.locale}/admin/security/two-factor/disable" class="portal-form"><label><span>${messages.password}</span><input name="password" type="password" required autocomplete="current-password" /></label><button class="danger button" type="submit">${messages.disableTwoFactor}</button></form></section>
      </div>
    `;
  }
  if (data.section === "api-keys") {
    return html`
      <header class="page-heading"><h1>${messages.apiKeys}</h1><p>${messages.apiKeysDescription}</p></header>
      <section class="portal-card">
        ${data.createdKey ? html`<aside class="key-secret" role="status"><strong>${messages.apiKeys}</strong><code>${data.createdKey}</code></aside>` : null}
        <form method="post" action="/${context.locale}/admin/api-keys" class="inline-form"><label><span>${messages.keyName}</span><input name="name" required /></label><button class="primary" type="submit">${messages.createKey}</button></form>
        <div class="portal-list">${data.apiKeys.length ? data.apiKeys.map((key) => html`<article><div><strong>${key.name ?? messages.apiKeys}</strong><small>${key.start ?? "••••"}</small></div><div class="key-actions"><span class="state">${key.enabled ? messages.active : "—"}</span><form method="post" action="/${context.locale}/admin/api-keys/${key.id}/delete"><button class="danger" type="submit">${messages.deleteKey}</button></form></div></article>`) : html`<p>${messages.empty}</p>`}</div>
      </section>
    `;
  }
  if (data.section === "organizations") {
    return html`
      <header class="page-heading"><h1>${messages.organizations}</h1><p>${messages.organizationsDescription}</p></header>
      <section class="portal-card"><form method="post" action="/${context.locale}/admin/organizations" class="inline-form organization-form"><label><span>${messages.organizationName}</span><input name="name" required /></label><label><span>${messages.organizationSlug}</span><input name="slug" required pattern="[a-z0-9-]+" /></label><button class="primary" type="submit">${messages.createOrganization}</button></form><div class="portal-list">${data.organizations.length ? data.organizations.map((organization) => html`<article><div><strong>${organization.name}</strong><small>${organization.slug}</small></div>${organization.id === data.session.activeOrganizationId ? html`<span class="state">${messages.active}</span>` : html`<form method="post" action="/${context.locale}/admin/organizations/${organization.id}/activate"><button class="secondary button" type="submit">${messages.activateOrganization}</button></form>`}</article>`) : html`<p>${messages.empty}</p>`}</div></section>
    `;
  }
  return html`
    <header class="page-heading"><h1>${messages.permissions}</h1><p>${messages.permissionsDescription}</p></header>
    <section class="portal-card permission-grid"><span>tasks:read</span><strong>✓</strong><span>tasks:create</span><strong>✓</strong><span>tasks:update</span><strong>✓</strong><span>tasks:delete</span><strong>✓</strong></section>
  `;
};

export const renderAdminPage = (
  context: ViewContext,
  data: AdminPageData,
): Html => {
  const messages = getMessages(context.locale);
  const path = `/${context.locale}/admin`;
  const localeDestination =
    data.section === "tasks" ? "/admin" : `/admin/${data.section}`;
  return renderDocument(
    context,
    messages.admin,
    data.theme,
    html`
      <div class="admin-shell" data-signals:filter="''">
        <aside class="sidebar">
          ${renderOrganizationSwitcher(context, data)}
          <nav aria-label="${messages.workspace}">
            <p class="sidebar-group-label">${messages.workspace}</p>
            <a class="${data.section === "tasks" ? "active" : ""}" href="${path}"><span class="sidebar-nav-icon">${checkSquareIcon}</span><span>${messages.tasksNav}</span></a>
          </nav>
        </aside>
        <main class="admin-main">
          <header class="admin-bar"><a class="brand admin-brand" href="/${context.locale}">${renderAppBrand(context)}</a><div class="top-actions">${renderThemeSwitcher(context)}${renderLocaleSwitcher(context, localeDestination)}${renderUserButton(context, data)}</div></header>
          <div class="admin-content">${renderAdminContent(context, data)}</div>
        </main>
      </div>
    `,
  );
};
