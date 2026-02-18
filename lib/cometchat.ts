/**
 * CometChat helpers — client-side only (browser APIs required).
 * Never import this file in server components or API routes.
 */

import { CometChatUIKit, UIKitSettingsBuilder, CometChatLocalize } from "@cometchat/chat-uikit-react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatCalls } from "@cometchat/calls-sdk-javascript";
import enUS from "./cometchat-locale.en.json";

export const COMETCHAT = {
  APP_ID:   process.env.NEXT_PUBLIC_COMETCHAT_APP_ID  ?? "",
  REGION:   process.env.NEXT_PUBLIC_COMETCHAT_REGION   ?? "",
  AUTH_KEY: process.env.NEXT_PUBLIC_COMETCHAT_AUTH_KEY ?? "",
};

/** Singleton init promise — only runs once per browser session */
let _initPromise: Promise<void> | null = null;

/** Login mutex — prevents concurrent login calls */
let _loginInProgress = false;

export function initCometChat(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!COMETCHAT.APP_ID) return Promise.resolve(); // not configured yet
  if (_initPromise) return _initPromise;

  const settings = new UIKitSettingsBuilder()
    .setAppId(COMETCHAT.APP_ID)
    .setRegion(COMETCHAT.REGION)
    .setAuthKey(COMETCHAT.AUTH_KEY)
    .subscribePresenceForAllUsers()
    .build();

  _initPromise = (CometChatUIKit.init(settings) ?? Promise.resolve()).then(async () => {
    CometChatUIKit.themeMode = "dark";

    // Explicitly initialize the Calls SDK so getAdminHost is available
    const callAppSettings = new CometChatCalls.CallAppSettingsBuilder()
      .setAppId(COMETCHAT.APP_ID)
      .setRegion(COMETCHAT.REGION)
      .build();
    await CometChatCalls.init(callAppSettings).catch(() => {});

    // Set up localization so getLocalizedString() returns proper text
    CometChatLocalize.addTranslation({ "en-US": enUS });
    CometChatLocalize.setCurrentLanguage("en-US");

    console.log("[CometChat] Initialized");
  });

  return _initPromise;
}

/**
 * Create a CometChat user for a Firebase user.
 * Safe to call on every login — duplicate creates are silently ignored.
 */
export async function createCometChatUser(uid: string, name: string): Promise<void> {
  await initCometChat();
  if (!COMETCHAT.APP_ID) return;
  const user = new CometChat.User(uid);
  user.setName(name);
  try {
    await CometChatUIKit.createUser(user);
  } catch {
    // User already exists — this is expected on subsequent logins
  }
}

/**
 * Log the given Firebase UID into CometChat.
 * If a different user is already logged in, logs them out first.
 */
export async function loginCometChat(uid: string, name: string): Promise<void> {
  await initCometChat();
  if (!COMETCHAT.APP_ID) return;

  // Guard: if a login is already in progress, skip to avoid "Please wait" error
  if (_loginInProgress) return;
  _loginInProgress = true;

  try {
    const existing = await CometChatUIKit.getLoggedinUser();
    if (existing?.getUid() === uid) return; // already logged in as same user
    if (existing) await CometChatUIKit.logout();

    await createCometChatUser(uid, name);
    await CometChatUIKit.login(uid);
    console.log("[CometChat] Logged in:", uid);
  } finally {
    _loginInProgress = false;
  }
}

/** Log out of CometChat */
export async function logoutCometChat(): Promise<void> {
  if (!COMETCHAT.APP_ID) return;
  try {
    await CometChatUIKit.logout();
  } catch {
    // ignore if not logged in
  }
}

export { CometChat, CometChatUIKit };
