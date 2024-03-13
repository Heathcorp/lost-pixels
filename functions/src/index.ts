// TODO: REFACTOR AND SPLIT INTO SEPERATE REPOS
// properly setup linting, etc

import { https } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getDatabase, ServerValue } from "firebase-admin/database";
import { defineString } from "firebase-functions/params";

const CF_TURNSTILE_KEY = defineString("CF_TURNSTILE_KEY");

initializeApp();

export const helloWorld = https.onRequest((request, response) => {
  // logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!" + " " + CF_TURNSTILE_KEY);
});

// extreme cases where we need to shut off the button but still show a count
const COUNT_FROZEN: boolean = true;

export const buttonCount = https.onCall(async (data, context) => {
  const db = getDatabase();

  try {
    const ref = db.ref("thebutton/main_count");
    const count = (await ref.once("value")).val();

    if (typeof count !== "number" || Number.isNaN(count))
      return {
        success: false,
        reason: "Invalid internal value",
      };

    return {
      success: true,
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

export const buttonPressed = https.onCall(
  async (data: { count?: number }, context) => {
    if (COUNT_FROZEN) {
      return {success: false, reason: "count frozen"};
    }
  
    const db = getDatabase();

    if (
      data.count !== undefined &&
      (typeof data.count !== "number" || data.count <= 0)
    ) {
      return {
        success: false,
        reason: "invalid count",
      };
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
        reason: "An internal error occured.",
      };
    }
  }
);
