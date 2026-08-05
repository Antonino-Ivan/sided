"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FeedMode } from "@/lib/types";
import { routeToHash, tabForRoute } from "@/lib/router";
import type { Route } from "@/lib/router";
import { useHashRoute } from "@/hooks/useHashRoute";
import { useApplyTheme } from "@/hooks/useTheme";
import { SidedProvider, useSided } from "@/state/context";
import { unreadNotifications } from "@/state/selectors";

import { BrandRail } from "@/components/shell/BrandRail";
import { TopBar } from "@/components/shell/TopBar";
import { BottomNav } from "@/components/shell/BottomNav";
import { Toasts } from "@/components/shell/Toasts";

import { HomeScreen } from "@/components/screens/HomeScreen";
import { DiscussionScreen } from "@/components/screens/DiscussionScreen";
import { ExploreScreen } from "@/components/screens/ExploreScreen";
import { FriendsScreen } from "@/components/screens/FriendsScreen";
import { PersonScreen } from "@/components/screens/PersonScreen";
import { CreateScreen } from "@/components/screens/CreateScreen";
import { ActivityScreen } from "@/components/screens/ActivityScreen";
import { ChatScreen } from "@/components/screens/ChatScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { EmptyState } from "@/components/ui/Controls";

import { SettingsSheet } from "@/components/sheets/SettingsSheet";
import { EditProfileSheet } from "@/components/sheets/EditProfileSheet";
import { OnboardingSheet } from "@/components/sheets/OnboardingSheet";

export function SidedApp() {
  return (
    <SidedProvider>
      <AppShell />
    </SidedProvider>
  );
}

function AppShell() {
  const { state, choices, conversations, peopleById, notifications } = useSided();
  const { route, navigate, back } = useHashRoute();
  const viewRef = useRef<HTMLDivElement>(null);

  const [feed, setFeed] = useState<FeedMode>("perte");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useApplyTheme(state.preferences.theme);

  const routeKey = routeToHash(route);

  // Cambiare schermata riparte sempre dall'alto. Lo scroll a zero fa scattare
  // `onScroll`, che riporta da solo `scrolled` a false: nessun setState qui.
  useEffect(() => {
    viewRef.current?.scrollTo({ top: 0 });
  }, [routeKey]);

  const unread = useMemo(
    () =>
      state.preferences.notifications
        ? unreadNotifications(notifications, state.readNotifications).length
        : 0,
    [notifications, state.readNotifications, state.preferences.notifications],
  );

  const tab = tabForRoute(route);

  const title = useMemo(() => {
    if (route.name === "chat") {
      const conversation = conversations.find((item) => item.id === route.conversationId);
      const person = conversation ? peopleById.get(conversation.personId) : undefined;
      return person?.name;
    }
    if (route.name === "person") {
      return [...peopleById.values()].find((person) => person.handle === route.handle)?.name;
    }
    return undefined;
  }, [route, conversations, peopleById]);

  return (
    <main className="site-shell">
      <BrandRail />

      <section className={`app-frame ${scrolled ? "is-scrolled" : ""}`} aria-label="App Sided">
        <TopBar
          route={route}
          title={title}
          feed={feed}
          onFeedChange={setFeed}
          onNavigate={navigate}
          onBack={back}
          compact={scrolled}
          showFeedSwitcher
        />

        <div
          ref={viewRef}
          className={`view ${route.name === "home" ? "view--deck" : ""}`}
          onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 8)}
        >
          <ScreenForRoute
            route={route}
            navigate={navigate}
            feed={feed}
            onOpenSettings={() => setSettingsOpen(true)}
            onEditProfile={() => setEditOpen(true)}
          />
        </div>

        <BottomNav active={tab} unread={unread} onNavigate={navigate} />
        <Toasts />
      </section>

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {editOpen && <EditProfileSheet onClose={() => setEditOpen(false)} />}
      <OnboardingSheet open={state.hydrated && !state.onboarded && choices.length > 0} />
    </main>
  );
}

function ScreenForRoute({
  route,
  navigate,
  feed,
  onOpenSettings,
  onEditProfile,
}: {
  route: Route;
  navigate: (route: Route, options?: { replace?: boolean }) => void;
  feed: FeedMode;
  onOpenSettings: () => void;
  onEditProfile: () => void;
}) {
  const { choicesById } = useSided();

  switch (route.name) {
    case "home":
      // `key` sul feed: cambiare modalità rimonta il mazzo e riparte dalla prima
      // scelta, senza sincronizzare l'indice con un effect.
      return <HomeScreen key={feed} feed={feed} onNavigate={navigate} />;

    case "choice": {
      const choice = choicesById.get(route.choiceId);
      if (!choice) {
        return (
          <section className="screen screen--center">
            <EmptyState
              title="Scelta non trovata"
              detail="Il link potrebbe essere vecchio, oppure la scelta è stata eliminata."
              action={
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => navigate({ name: "home" })}
                >
                  Torna al feed
                </button>
              }
            />
          </section>
        );
      }
      return <DiscussionScreen choice={choice} onNavigate={navigate} />;
    }

    case "explore":
      return (
        <ExploreScreen
          query={route.query ?? ""}
          category={route.category ?? null}
          onNavigate={navigate}
        />
      );

    case "friends":
      return <FriendsScreen onNavigate={navigate} />;

    case "person":
      return <PersonScreen handle={route.handle} onNavigate={navigate} />;

    case "create":
      return <CreateScreen onNavigate={navigate} />;

    case "activity":
      return <ActivityScreen onNavigate={navigate} />;

    case "chat":
      return <ChatScreen conversationId={route.conversationId} onNavigate={navigate} />;

    case "profile":
      return (
        <ProfileScreen
          onNavigate={navigate}
          onEditProfile={onEditProfile}
          onOpenSettings={onOpenSettings}
        />
      );
  }
}
