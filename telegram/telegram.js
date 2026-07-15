import "dotenv/config";

const TELEGRAM = {
  BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  CHAT_ID: process.env.TELEGRAM_CHAT_ID
}

export async function send_message(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM.BOT_TOKEN}/sendMessage`;
  const body = new URLSearchParams({
    chat_id: TELEGRAM.CHAT_ID,
    text: message,
    disable_web_page_preview: "true"
  });

  try {
    const response = await fetch(url, { method: "POST", body });
    if (!response.ok) {
      console.warn(`[telegram] ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.warn(`[telegram] ${error.message}`);
  }
}

export async function send_photo(photo) {
  const form = new FormData();
  form.append("chat_id", TELEGRAM.CHAT_ID);
  form.append("photo", photo, "captcha.png");

  const res = await fetch(
    `https://api.telegram.org/bot${TELEGRAM.BOT_TOKEN}/sendPhoto`,
    {
      method: "POST",
      body: form,
    }
  );

  const result = await res.json();
  const messageId = result.result.message_id;
  return messageId
}

export async function waitCaptchaReply(messageId, offset) {
  while (true) {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM.BOT_TOKEN}/getUpdates?timeout=30&offset=${offset}`
    );
    const data = await res.json();
    for (const update of data.result) {
      // 마지막으로 처리한 update 기억
      offset = update.update_id + 1;
      const message = update.message;
      if (
        message?.reply_to_message?.message_id === messageId &&
        message.text
      ) {
        return { 
          captchaText: message.text, 
          nextOffset: offset 
        };
      }
    }
  }
}

export async function initOffset() {
  const res = await fetch(
    `https://api.telegram.org/bot${TELEGRAM.BOT_TOKEN}/getUpdates`
  );

  const data = await res.json();

  if (data.result.length > 0) {
    return data.result[data.result.length - 1].update_id + 1;
  }
  return 0;
}