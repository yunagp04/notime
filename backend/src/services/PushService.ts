import webpush from 'web-push';

const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.REACT_APP_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY || process.env.REACT_APP_VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:your-email@example.com';

if (publicKey && privateKey) {
    try {
        webpush.setVapidDetails(subject, publicKey, privateKey);
        console.log("✅ Web-Push: VAPID Details set successfully.");
    } catch (err: any) {
       
        console.error("❌ Web-Push: Invalid VAPID Keys format:", err.message);
    }
} else {
    console.warn("⚠️ Web-Push: VAPID Keys are missing. Push notifications will not work.");
}

export const sendPush = async (subscription: any, payload: string) => {
    try {
        return await webpush.sendNotification(subscription, payload);
    } catch (err: any) {
        console.error("❌ Web-Push: Error sending notification:", err.message);
        throw err;
    }
};