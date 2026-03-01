import webpush from 'web-push';
import { getDatabase } from './mongodb';

if (process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_CONTACT_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY,
  );
}

export async function sendPushToAll(title: string, body: string) {
  if (!process.env.VAPID_PRIVATE_KEY) return;
  const db = await getDatabase();
  const subs = await db.collection('push_subscriptions').find({}).toArray();
  await Promise.all(
    subs.map(async sub => {
      try {
        await webpush.sendNotification(
          sub as unknown as webpush.PushSubscription,
          JSON.stringify({ title, body }),
        );
      } catch (err: unknown) {
        if ((err as { statusCode?: number }).statusCode === 410) {
          await db.collection('push_subscriptions').deleteOne({ endpoint: sub.endpoint });
        }
      }
    }),
  );
}
