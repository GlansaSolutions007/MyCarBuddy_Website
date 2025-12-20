import { getToken } from "firebase/messaging";
import { getMessagingIfSupported, onForegroundMessage } from "./firebase";
import CryptoJS from "crypto-js";
import { notificationService } from "./services/notificationService";

const VAPID_KEY = "BCONluQj8iMYw7M-xU9Wu0Omhtjpdp3oWbY-lqv5lcZKCKYZ3nBRefrcYaH8x4bdTycTCFtGKPmI-VLuufR4SCs";
  const baseUrl = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;

export const initFCM = async () => {
	try {
		if (!("serviceWorker" in navigator)) return null;

		const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
		const permission = await Notification.requestPermission();
		if (permission !== "granted") return null;

		const messaging = await getMessagingIfSupported();
		if (!messaging) return null;

		const token = await getToken(messaging, {
			vapidKey: VAPID_KEY,
			serviceWorkerRegistration: registration
		});

		if (token) {
			localStorage.setItem("fcmToken", token);

			try {
				const storedUser = JSON.parse(localStorage.getItem("user"));
				const userToken = storedUser?.token;
				const bytes = CryptoJS.AES.decrypt(storedUser?.id, secretKey);
				const encryptedId = bytes.toString(CryptoJS.enc.Utf8);
				let userId = null;
				if (encryptedId) {
					// Backend expects numeric ID; decrypt happens elsewhere in app when needed
					userId = encryptedId; // send as-is if backend accepts; adjust if needed
				}
				if (userToken) {
					await fetch(`${baseUrl}Push/register`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"Authorization": `Bearer ${userToken}`
						},
						body: JSON.stringify({
							userId,
							userRole: "customer",
							fcmToken: token,
							platform: "web"
						})
					});
				}
			} catch (err) {
				console.log("Token registration with backend failed:", err);
			}
		}

		// Foreground messages
		onForegroundMessage(messaging, (payload) => {
			try {
				const { title, body, icon, image, click_action } = payload.notification || {};
				if (Notification.permission === "granted") {
					registration.showNotification(title || "Notification", {
						body: body || "",
						icon: icon || "/favicon.png",
						image,
						data: { click_action }
					});
				}
				// Dispatch custom event to trigger fetchBookings
				window.dispatchEvent(new CustomEvent('notificationReceived'));
				
				// Show side popup notification
				const notificationData = {
					title: title || "New Notification",
					message: body || "",
					createdDate: new Date().toISOString(),
					...payload.data // Include any additional data from payload
				};
				notificationService.showNotificationPopup(notificationData);
			} catch (e) {
				console.log("Error showing foreground notification:", e);
			}
		});

		return true;
	} catch (e) {
		console.log("FCM init failed:", e);
		return null;
	}
};
