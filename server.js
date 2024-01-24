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
// Redirect to Google for authentication
app.get("/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });
  res.redirect(url);
});

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
    const event = {
      summary: "Calendar API Test", // summary of event like title
      description: "A chance to hear more about Google's developer products.", // description of event if comming from frontend
      start: {
        dateTime: dayjs(new Date()).add(1, "day").toISOString(), // start time of event to be set from frontend
        timeZone: "Asia/Karachi", // time zone of client to beset
      },
      end: {
        dateTime: dayjs(new Date()).add(1, "day").add(1, "hour").toISOString(), // end time of event to be set from frontend
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
    console.log("Successfully created event on Google Calendar.");

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

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}.`);
});

// need to dynamically change the summary and description, start and end time of the event
