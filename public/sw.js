/// <reference lib="webworker" />

function resolveTargetUrl(data) {
  const link =
    typeof data?.link === "string" && data.link.trim().length > 0
      ? data.link.trim()
      : null;

  if (link) {
    try {
      return new URL(link, self.location.origin).href;
    } catch {
      // Ignore malformed link and fallback below.
    }
  }

  const conversationId =
    typeof data?.conversationId === "string" && data.conversationId.trim().length > 0
      ? data.conversationId.trim()
      : null;

  if (conversationId) {
    return new URL(`/messages/${conversationId}`, self.location.origin).href;
  }

  return new URL("/notifications", self.location.origin).href;
}

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "ქრონიკა", body: event.data.text() };
  }

  const { title = "ქრონიკა", body = "", data = {} } = payload;
  const tag =
    (typeof data.link === "string" && data.link) ||
    (typeof data.conversationId === "string" && data.conversationId) ||
    "default";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data,
      tag,
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = resolveTargetUrl(event.notification.data);

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clients) => {
        for (const client of clients) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }

        const sameOriginClient = clients.find((client) => {
          try {
            return new URL(client.url).origin === self.location.origin;
          } catch {
            return false;
          }
        });

        if (sameOriginClient) {
          if ("focus" in sameOriginClient) {
            await sameOriginClient.focus();
          }

          if ("navigate" in sameOriginClient) {
            try {
              await sameOriginClient.navigate(targetUrl);
              return;
            } catch {
              // Fallback to openWindow below.
            }
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});
