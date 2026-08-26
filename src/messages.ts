export type Locale = "en" | "fr";

type Messages = {
  readonly account: string;
  readonly active: string;
  readonly admin: string;
  readonly appName: string;
  readonly apiKeys: string;
  readonly apiKeysDescription: string;
  readonly addTask: string;
  readonly appearance: string;
  readonly backHome: string;
  readonly brandDescription: string;
  readonly cancel: string;
  readonly createKey: string;
  readonly currentPassword: string;
  readonly dark: string;
  readonly completed: string;
  readonly createTaskDescription: string;
  readonly deleteTask: string;
  readonly deleteKey: string;
  readonly disableTwoFactor: string;
  readonly description: string;
  readonly descriptionPlaceholder: string;
  readonly done: string;
  readonly edit: string;
  readonly editTaskDescription: string;
  readonly enableTwoFactor: string;
  readonly email: string;
  readonly empty: string;
  readonly eyebrow: string;
  readonly filter: string;
  readonly forgotPassword: string;
  readonly getStarted: string;
  readonly homeTitle: string;
  readonly intro: string;
  readonly imageUrl: string;
  readonly keyName: string;
  readonly language: string;
  readonly languageLabel: string;
  readonly localeEnglish: string;
  readonly localeFrench: string;
  readonly light: string;
  readonly logout: string;
  readonly methodNotAllowed: string;
  readonly name: string;
  readonly newPassword: string;
  readonly notice: string;
  readonly notFound: string;
  readonly organization: string;
  readonly organizationSwitcherLabel: string;
  readonly noOtherOrganizations: string;
  readonly activateOrganization: string;
  readonly createOrganization: string;
  readonly organizationName: string;
  readonly organizationSlug: string;
  readonly organizations: string;
  readonly organizationsDescription: string;
  readonly password: string;
  readonly permissions: string;
  readonly permissionsDescription: string;
  readonly profileDescription: string;
  readonly private: string;
  readonly save: string;
  readonly sendCode: string;
  readonly security: string;
  readonly securityDescription: string;
  readonly setupUri: string;
  readonly saving: string;
  readonly serverError: string;
  readonly signIn: string;
  readonly signInDescription: string;
  readonly resetPassword: string;
  readonly verifyEmail: string;
  readonly system: string;
  readonly status: string;
  readonly open: string;
  readonly taskCount: (count: number) => string;
  readonly taskColumn: string;
  readonly taskDescription: string;
  readonly taskWorkspace: string;
  readonly tasksNav: string;
  readonly title: string;
  readonly titleLabel: string;
  readonly titlePlaceholder: string;
  readonly titleRequired: string;
  readonly toggleTask: string;
  readonly updated: string;
  readonly twoFactorCode: string;
  readonly backupCodes: string;
  readonly verifyTwoFactor: string;
  readonly verification: string;
  readonly workspace: string;
};

const messages: Record<Locale, Messages> = {
  en: {
    account: "Account",
    active: "Active",
    admin: "Admin portal",
    appName: "Template",
    apiKeys: "API keys",
    apiKeysDescription: "Create and manage keys for programmatic access.",
    addTask: "Create task",
    appearance: "Appearance",
    backHome: "Back home",
    brandDescription: "An authenticated workspace built with Effect and Datastar.",
    cancel: "Cancel",
    createKey: "Create API key",
    currentPassword: "Current password",
    dark: "Dark",
    completed: "Completed",
    createTaskDescription: "Add a task to your workspace.",
    deleteTask: "Delete",
    deleteKey: "Delete key",
    disableTwoFactor: "Disable two-factor authentication",
    description: "Description",
    descriptionPlaceholder: "Add optional context",
    done: "Done",
    edit: "Edit",
    editTaskDescription: "Update the task details.",
    enableTwoFactor: "Enable two-factor authentication",
    email: "Email",
    empty: "No tasks yet.",
    eyebrow: "Effect-driven hypermedia",
    filter: "Filter tasks...",
    forgotPassword: "Forgot password?",
    getStarted: "Open admin portal",
    homeTitle: "A quieter full-stack application.",
    intro: "A small task workspace rendered by Effect and updated by Datastar.",
    imageUrl: "Profile image URL",
    keyName: "Key name",
    language: "Français",
    languageLabel: "Switch language",
    localeEnglish: "English",
    localeFrench: "Français",
    light: "Light",
    logout: "Log out",
    methodNotAllowed: "Method not allowed",
    name: "Name",
    newPassword: "New password",
    notice: "This branch uses a configurable demo identity while authentication is redesigned.",
    notFound: "Not found",
    organization: "Active organization",
    organizationSwitcherLabel: "Organization",
    noOtherOrganizations: "No other organizations.",
    activateOrganization: "Make active",
    createOrganization: "Create organization",
    organizationName: "Organization name",
    organizationSlug: "Organization slug",
    organizations: "Organizations",
    organizationsDescription: "Organizations connected to your account.",
    password: "Password",
    permissions: "Permissions",
    permissionsDescription: "Task access granted to the current portal user.",
    profileDescription: "Your profile is provided by KrakStack Auth.",
    private: "Private",
    save: "Save changes",
    sendCode: "Send verification code",
    security: "Security",
    securityDescription: "Manage password and two-factor authentication with KrakStack Auth.",
    setupUri: "Authenticator setup URI",
    saving: "Saving...",
    serverError: "The request could not be completed.",
    signIn: "Sign in",
    signInDescription: "Use your KrakStack Auth email and password.",
    resetPassword: "Reset password",
    verifyEmail: "Verify email",
    system: "System",
    status: "Status",
    open: "Open",
    taskCount: (count) => `${String(count)} ${count === 1 ? "task" : "tasks"}`,
    taskColumn: "Task",
    taskDescription: "Manage the task list attached to your user account.",
    taskWorkspace: "Task workspace",
    tasksNav: "Tasks",
    title: "Tasks",
    titleLabel: "Title",
    titlePlaceholder: "What needs to be done?",
    titleRequired: "A title is required",
    toggleTask: "Toggle task status",
    updated: "Updated",
    twoFactorCode: "Authentication code",
    backupCodes: "Backup codes",
    verifyTwoFactor: "Verify two-factor authentication",
    verification: "Verified email",
    workspace: "Workspace",
  },
  fr: {
    account: "Compte",
    active: "Active",
    admin: "Portail d’administration",
    appName: "Modèle",
    apiKeys: "Clés API",
    apiKeysDescription: "Créez et gérez les clés d’accès programmatique.",
    addTask: "Créer une tâche",
    appearance: "Apparence",
    backHome: "Retour à l’accueil",
    brandDescription: "Un espace authentifié construit avec Effect et Datastar.",
    cancel: "Annuler",
    createKey: "Créer une clé API",
    currentPassword: "Mot de passe actuel",
    dark: "Sombre",
    completed: "Terminée",
    createTaskDescription: "Ajoutez une tâche à votre espace de travail.",
    deleteTask: "Supprimer",
    deleteKey: "Supprimer la clé",
    disableTwoFactor: "Désactiver l’authentification à deux facteurs",
    description: "Description",
    descriptionPlaceholder: "Ajouter du contexte facultatif",
    done: "Terminée",
    edit: "Modifier",
    editTaskDescription: "Mettez à jour les détails de la tâche.",
    enableTwoFactor: "Activer l’authentification à deux facteurs",
    email: "Courriel",
    empty: "Aucune tâche.",
    eyebrow: "Hypermédia piloté par Effect",
    filter: "Filtrer les tâches...",
    forgotPassword: "Mot de passe oublié ?",
    getStarted: "Ouvrir le portail",
    homeTitle: "Une application complète plus sereine.",
    intro: "Un petit espace de tâches rendu par Effect et mis à jour par Datastar.",
    imageUrl: "URL de l’image de profil",
    keyName: "Nom de la clé",
    language: "English",
    languageLabel: "Changer de langue",
    localeEnglish: "English",
    localeFrench: "Français",
    light: "Clair",
    logout: "Se déconnecter",
    methodNotAllowed: "Méthode non autorisée",
    name: "Nom",
    newPassword: "Nouveau mot de passe",
    notice: "Cette branche utilise une identité de démonstration configurable pendant la refonte de l’authentification.",
    notFound: "Introuvable",
    organization: "Organisation active",
    organizationSwitcherLabel: "Organisation",
    noOtherOrganizations: "Aucune autre organisation.",
    activateOrganization: "Activer",
    createOrganization: "Créer une organisation",
    organizationName: "Nom de l’organisation",
    organizationSlug: "Identifiant de l’organisation",
    organizations: "Organisations",
    organizationsDescription: "Les organisations liées à votre compte.",
    password: "Mot de passe",
    permissions: "Autorisations",
    permissionsDescription: "L’accès aux tâches accordé à l’utilisateur actuel.",
    profileDescription: "Votre profil est fourni par KrakStack Auth.",
    private: "Privé",
    save: "Enregistrer",
    sendCode: "Envoyer le code de vérification",
    security: "Sécurité",
    securityDescription: "Gérez le mot de passe et l’authentification à deux facteurs avec KrakStack Auth.",
    setupUri: "URI de configuration de l’application",
    saving: "Enregistrement...",
    serverError: "La requête n’a pas pu être terminée.",
    signIn: "Se connecter",
    signInDescription: "Utilisez votre courriel et mot de passe KrakStack Auth.",
    resetPassword: "Réinitialiser le mot de passe",
    verifyEmail: "Vérifier le courriel",
    system: "Système",
    status: "Statut",
    open: "Ouverte",
    taskCount: (count) => `${String(count)} ${count === 1 ? "tâche" : "tâches"}`,
    taskColumn: "Tâche",
    taskDescription: "Gérez la liste de tâches liée à votre compte utilisateur.",
    taskWorkspace: "Espace de tâches",
    tasksNav: "Tâches",
    title: "Tâches",
    titleLabel: "Titre",
    titlePlaceholder: "Que faut-il accomplir ?",
    titleRequired: "Le titre est obligatoire",
    toggleTask: "Modifier l’état de la tâche",
    updated: "Mise à jour",
    twoFactorCode: "Code d’authentification",
    backupCodes: "Codes de secours",
    verifyTwoFactor: "Vérifier l’authentification à deux facteurs",
    verification: "Courriel vérifié",
    workspace: "Espace de travail",
  },
};

export const getMessages = (locale: Locale) => messages[locale];
