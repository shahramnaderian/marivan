// Native Android notifications for the Marivan prayer-times app.
(() => {
  const BASE_ID = 1700000000;
  const WINDOW_DAYS = 30;
  const MONTHS = { 8: "آبان", 9: "آذر", 10: "دی", 11: "بهمن", 12: "اسفند" };
  const NAMES = ["شروع روز", "نماز صبح", "طلوع خورشید", "نماز ظهر", "نماز عصر", "نماز مغرب", "پایان روز", "نماز عشا", "یک‌سوم شب", "دو‌سوم شب"];
  const KEYS = ["start", "fajr", "sunrise", "zuhr", "asr", "maghrib", "endday", "isha", "oneThird", "twoThird"];
  const $ = (s) => document.querySelector(s);
  const plugin = () => window.Capacitor?.Plugins?.LocalNotifications;

  function jalaliParts(date) {
    const parts = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
      year: "numeric", month: "numeric", day: "numeric"
    }).formatToParts(date);
    const get = (type) => Number(parts.find((p) => p.type === type)?.value);
    return { year: get("year"), month: get("month"), day: get("day") };
  }

  function dataFor(date) {
    const j = jalaliParts(date);
    const monthName = MONTHS[j.month];
    if (!monthName || j.year !== 1405) return null;
    const stored = localStorage.getItem("marivanUser:" + monthName + ":" + j.day);
    if (stored) {
      try { return JSON.parse(stored); } catch (_) {}
    }
    return DB[monthName + "-" + j.day] || null;
  }

  function buildNotifications() {
    const now = new Date();
    const notifications = [];
    for (let offset = 0; offset < WINDOW_DAYS; offset++) {
      const day = new Date(now);
      day.setHours(12, 0, 0, 0);
      day.setDate(day.getDate() + offset);
      const row = dataFor(day);
      if (!row?.events) continue;
      const lead = Number(row.lead ?? 5);
      KEYS.forEach((key, index) => {
        const event = row.events[key];
        if (!event?.enabled || !event.time || !/^([01]\\d|2[0-3]):[0-5]\\d$/.test(event.time)) return;
        const [hour, minute] = event.time.split(":").map(Number);
        const at = new Date(day);
        at.setHours(hour, minute, 0, 0);
        at.setMinutes(at.getMinutes() - lead);
        if (at <= now) return;
        notifications.push({
          id: BASE_ID + offset * 16 + index,
          title: "اوقات شرعی مریوان",
          body: "زمان " + NAMES[index] + " فرا رسیده است",
          schedule: { at, allowWhileIdle: true },
          channelId: "marivan-prayer-alerts",
          smallIcon: "ic_launcher"
        });
      });
    }
    return notifications;
  }

  async function syncNativeAlarms() {
    const api = plugin();
    if (!api) {
      if ($("#status")) $("#status").textContent = "برای آلارم در حالت بسته بودن برنامه، نسخه اندروید را نصب کنید؛ نسخه وب فقط هنگام باز بودن صفحه هشدار می‌دهد.";
      return;
    }
    const pending = await api.getPending();
    const owned = (pending.notifications || []).filter((n) => n.id >= BASE_ID && n.id < BASE_ID + WINDOW_DAYS * 16);
    if (owned.length) await api.cancel({ notifications: owned.map((n) => ({ id: n.id })) });
    const notifications = buildNotifications();
    if (notifications.length) await api.schedule({ notifications });
    if ($("#status")) $("#status").textContent = notifications.length + " هشدار برای ۳۰ روز آینده روی گوشی زمان‌بندی شد. برای دقت کامل، مجوز «هشدارها و یادآورها» را در تنظیمات اندروید فعال کنید.";
  }

  async function enableNativeAlarms() {
    const api = plugin();
    if (!api) {
      if ("Notification" in window) {
        const result = await Notification.requestPermission();
        if ($("#status")) $("#status").textContent = "مجوز اعلان مرورگر: " + result + "؛ برای هشدار در حالت بسته بودن، نسخه اندروید لازم است.";
      }
      return;
    }
    const permission = await api.requestPermissions();
    if (permission.display !== "granted") {
      if ($("#status")) $("#status").textContent = "مجوز اعلان گوشی داده نشد؛ آلارم‌ها فعال نشدند.";
      return;
    }
    if (api.checkExactNotificationSetting && api.changeExactNotificationSetting) {
      const exact = await api.checkExactNotificationSetting();
      if (exact.exactAlarm !== "granted") {
        if ($("#status")) $("#status").textContent = "برای آلارم دقیق، دسترسی «هشدارها و یادآورها» را در صفحه تنظیمات بازشده فعال کنید.";
        await api.changeExactNotificationSetting();
      }
    }
    await syncNativeAlarms();
  }

  async function setup() {
    const api = plugin();
    if (api?.createChannel) {
      try {
        await api.createChannel({ id: "marivan-prayer-alerts", name: "هشدارهای اوقات شرعی", description: "یادآوری زمان‌های جدول اوقات شرعی", importance: 5, visibility: 1 });
      } catch (_) {}
    }
    if (api?.checkPermissions) {
      try {
        const permission = await api.checkPermissions();
        if (permission.display === "granted") await syncNativeAlarms();
      } catch (_) {}
    }

    const notify = $("#notify");
    if (notify) notify.onclick = () => enableNativeAlarms().catch((e) => {
      if ($("#status")) $("#status").textContent = "فعال‌سازی آلارم ناموفق بود: " + (e?.message || e);
    });

    const save = $("#save");
    if (save) {
      const previous = save.onclick;
      save.onclick = async () => {
        previous?.();
        try { await syncNativeAlarms(); } catch (e) {
          if ($("#status")) $("#status").textContent = "تنظیمات ذخیره شد؛ زمان‌بندی اعلان گوشی ناموفق بود: " + (e?.message || e);
        }
      };
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();