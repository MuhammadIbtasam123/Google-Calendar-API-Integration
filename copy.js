// Import necessary packages and modules
import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";
import dayjs from "dayjs";
dotenv.config({});

// Configure Google Calendar API
const calendar = google.calendar({
  version: "v3",
  auth: process.env.GOOGLE_CALENDAR_API_KEY,
});

// Set up environment variables and Express app
const PORT = process.env.NODE_ENV || 8000;
const app = express();

// Configure OAuth2 client for Google API
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);

// Define scopes for Google Calendar API
const scopes = ["https://www.googleapis.com/auth/calendar"];

// Define a single endpoint to handle Google Calendar integration
app.post("/google/event", async (req, res) => {
  try {
    // Extract data from the request (you can customize this based on how data is sent from the frontend)
    const { summary, description, startDateTime, endDateTime } = req.body;

    // Redirect to Google for authentication
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
    });

    res.redirect(url);

    // Handle the redirection callback from Google
    app.get("/google/redirect", async (req, res) => {
      try {
        const { code } = req.query;

        // Exchange the code for access and refresh tokens
        const { tokens } = await oauth2Client.getToken(code);

        // Set credentials for further API requests
        oauth2Client.setCredentials(tokens);

        // Log success message
        console.log("Successfully connected to Google Calendar API");

        // Create and insert the event into the primary calendar
        await createAndInsertEvent(
          summary,
          description,
          startDateTime,
          endDateTime
        );

        // Respond with a success message
        res.status(200).send({
          message:
            "Successfully connected to Google Calendar API and created event.",
        });
      } catch (error) {
        console.error("Error during Google Calendar API operation:", error);
        res.status(500).send({
          error: "Internal Server Error. Unable to complete the operation.",
        });
      }
    });
  } catch (error) {
    console.error("Error during Google Calendar integration:", error);
    res.status(500).send({
      error: "Internal Server Error. Unable to complete the operation.",
    });
  }
});

// Function to create and insert an event into the primary calendar
async function createAndInsertEvent(
  summary,
  description,
  startDateTime,
  endDateTime
) {
  const event = {
    summary: summary,
    description: description,
    start: {
      dateTime: startDateTime,
      timeZone: "Asia/Karachi",
    },
    end: {
      dateTime: endDateTime,
      timeZone: "Asia/Karachi",
    },
  };

  // Insert the event into the primary calendar
  const result = await calendar.events.insert({
    auth: oauth2Client,
    calendarId: "primary",
    resource: event,
  });

  // Log success message
  console.log(
    "Successfully created event on Google Calendar.",
    result.data.htmlLink
  );
}

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}.`);
});
