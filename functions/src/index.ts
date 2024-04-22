// TODO: REFACTOR AND SPLIT INTO SEPERATE REPOS
// properly setup linting, etc

import { https } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getDatabase, ServerValue } from "firebase-admin/database";
import { defineString } from "firebase-functions/params";

const CF_TURNSTILE_KEY = defineString("CF_TURNSTILE_KEY");
// CF_TURNSTILE_KEY.value()

initializeApp();

export const helloWorld = https.onRequest((request, response) => {
  // logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});


// extreme cases where we need to shut off the button but still show a count
const getButtonConfig = async () => {
  const db = getDatabase();
  const ref = db.ref("thebutton/config");
  const config = (await ref.once("value")).val();
  return config;
};

export const buttonCount = https.onCall(async (data, context) => {
  const db = getDatabase();

  
  try {
    const {frozen} = await getButtonConfig();

    const ref = db.ref("thebutton/main_count");
    const count = (await ref.once("value")).val();

    if (typeof count !== "number" || Number.isNaN(count))
      return {
        success: false,
        reason: "Invalid internal value",
      };

    return {
      success: true,
      frozen,
      count,
    };
  } catch (err: any) {
    console.error(err);

    return {
      success: false,
      reason: "An internal error occured",
    };
  }
});

const MAX_PRESSES_PER_REQUEST = 150;

export const buttonPressed = https.onCall(
  async (data: { count?: number; turnstileToken: string }, context) => {
  
    const {frozen, } = await getButtonConfig();
    if (frozen) {
      return { success: false, frozen };
    }

    const db = getDatabase();

    if (
      data.count !== undefined &&
      (typeof data.count !== "number" || data.count <= 0 || data.count > MAX_PRESSES_PER_REQUEST)
    ) {
      return {
        success: false,
        reason: "invalid count",
      };
    }

    // Captcha time!
    try {      
      if (!data.turnstileToken) {
        return {
          success: false,
          reason: 'did not supply captcha response'
        }
      }

      const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
      const formData = new FormData();
      formData.set("secret", CF_TURNSTILE_KEY.value());
      formData.set("response", data.turnstileToken);
      const resp = await (fetch(url, {body: formData, method: 'POST'}));
      const respBody = await resp.json();
      if (!respBody.success) {
        return { success: false, reason: 'captcha failed' };
      }
    } catch(err: any) {
      console.error(err);
      return {
        success: false, reason: 'An error occurred when validating captcha.'
      }
    }

    try {
      const inc = data.count ?? 1;

      const ref = db.ref("thebutton/main_count");

      await ref.set(ServerValue.increment(inc));

      return { success: true };
    } catch (err: any) {
      console.error(err);

      return {
        success: false,
        reason: "An internal error occurred.",
      };
    }
  }
);
