// Mirrors packages/domain/src/notifications/in-app.ts's listNotificationsForUser row shape.

export interface AppNotification {
  id: string;
  appointmentId: string | null;
  type: string;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
}
