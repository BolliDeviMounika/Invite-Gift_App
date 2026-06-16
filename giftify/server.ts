import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./server-db";
import { User, Event, Gift, GuestRSVP, EventType } from "./src/types";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "giftify-secret-super-key-2026";

// Increase body parser limit to support base64 invitation image uploads
app.use(express.json({ limit: "15mb" }));

// Helper to generate IDs
function generateId() {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}

// Global listen map for real-time SSE updates
interface SseConnection {
  eventId: string;
  res: Response;
}
let activeSseListeners: SseConnection[] = [];

// Helper to broadcast update to guests on SSE
function broadcastEventUpdate(eventId: string) {
  const targets = activeSseListeners.filter(listener => listener.eventId === eventId);
  console.log(`Broadcasting real-time update for event ${eventId} to ${targets.length} listeners.`);
  targets.forEach(listener => {
    try {
      listener.res.write(`data: ${JSON.stringify({ type: "SYNC", timestamp: Date.now() })}\n\n`);
    } catch (e) {
      console.error("Failed to write to SSE client: ", e);
    }
  });
}

// Authentication Middleware
function authenticateToken(req: Request & { user?: any }, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: "Invalid or expired token" });
      return;
    }
    req.user = decoded;
    next();
  });
}

// --- API ROUTES ---

// Auth: Register
app.post("/api/auth/register", (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      res.status(400).json({ error: "All registration fields are required" });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: "Passwords do not match" });
      return;
    }

    const existingUser = db.getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: "Account with this email already exists" });
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser: User = {
      id: generateId(),
      name,
      email,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    db.addUser(newUser);

    const token = jwt.sign({ id: newUser.id, email: newUser.email, name: newUser.name }, JWT_SECRET, { expiresIn: "24h" });

    res.status(201).json({
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
      token
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Registration failed" });
  }
});

// Auth: Login
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = db.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      res.status(400).json({ error: "Invalid email or password" });
      return;
    }

    const match = bcrypt.compareSync(password, user.passwordHash);
    if (!match) {
      res.status(400).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "30d" });

    res.status(200).json({
      user: { id: user.id, name: user.name, email: user.email },
      token
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Login failed" });
  }
});

// Auth: Forgot Password
app.post("/api/auth/forgot-password", (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      // Return success regardless to prevent user enumeration, but with a note
      res.json({ message: "If that email matches an account, a reset link will appear shortly." });
      return;
    }

    const resetToken = "RST-" + generateId() + generateId();
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    db.addPasswordReset({
      id: generateId(),
      email: user.email,
      token: resetToken,
      expiresAt
    });

    // Generate simulated self-referential dev link
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const simulationLink = `${appUrl}/reset-password?token=${resetToken}`;

    console.log(`\n--- PASSWORD RESET REQUEST ---`);
    console.log(`For user: ${user.name} (${user.email})`);
    console.log(`Reset Token: ${resetToken}`);
    console.log(`Reset Link: ${simulationLink}`);
    console.log(`---------------------------------\n`);

    res.json({
      message: "Password reset link generated successfully.",
      simulationLink // Return simulation link in API JSON so we can trigger it in premium dev UI!
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Forgot password processing failed" });
  }
});

// Auth: Reset Password
app.post("/api/auth/reset-password", (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      res.status(400).json({ error: "All password reset fields are required" });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: "Passwords do not match" });
      return;
    }

    const resetRequest = db.getPasswordResetByToken(token);
    if (!resetRequest) {
      res.status(400).json({ error: "Invalid or expired password reset token" });
      return;
    }

    if (new Date(resetRequest.expiresAt) < new Date()) {
      db.deletePasswordReset(token);
      res.status(400).json({ error: "Password reset token has expired" });
      return;
    }

    const user = db.getUserByEmail(resetRequest.email);
    if (user) {
      const passwordHash = bcrypt.hashSync(password, 10);
      user.passwordHash = passwordHash;
      db.addUser(user); // saves state
    }

    db.deletePasswordReset(token);

    res.json({ message: "Password reset successfully. You can now login with your new password." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Auth: Get Current Profile
app.get("/api/auth/me", authenticateToken, (req: Request & { user?: any }, res) => {
  const profile = db.getUserById(req.user.id);
  if (!profile) {
    res.status(404).json({ error: "User profile not found" });
    return;
  }
  res.json({ id: profile.id, name: profile.name, email: profile.email });
});


// Events: Get Organizer Events
app.get("/api/events", authenticateToken, (req: Request & { user?: any }, res) => {
  const list = db.getEventsByOrganizer(req.user.id);
  res.json(list);
});

// Events: Create Event
app.post("/api/events", authenticateToken, (req: Request & { user?: any }, res) => {
  try {
    const { name, type, date, venue, foodServingTime, invitationOption, invitationImageUrl, templateData } = req.body;

    if (!name || !type || !date || !venue) {
      res.status(400).json({ error: "Event name, type, date, and venue are required" });
      return;
    }

    const eventId = generateId();
    const newEvent: Event = {
      id: eventId,
      organizerId: req.user.id,
      name,
      type,
      date,
      venue,
      foodServingTime: foodServingTime || "",
      invitationOption: invitationOption || "template",
      invitationImageUrl: invitationImageUrl || "",
      templateData: templateData || undefined,
      createdAt: new Date().toISOString()
    };

    db.addEvent(newEvent);
    res.status(201).json(newEvent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Events: Public Detail (No token required, accessed by Guest Invitation link)
app.get("/api/events/public/:id", (req, res) => {
  const ev = db.getEventById(req.params.id);
  if (!ev) {
    res.status(404).json({ error: "Invitation not found. Please double check the link." });
    return;
  }
  res.json(ev);
});

// Events: Update Event
app.put("/api/events/:id", authenticateToken, (req: Request & { user?: any }, res) => {
  try {
    const ev = db.getEventById(req.params.id);
    if (!ev || ev.organizerId !== req.user.id) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const updated = db.updateEvent(req.params.id, req.body);
    broadcastEventUpdate(req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Events: Delete Event
app.delete("/api/events/:id", authenticateToken, (req: Request & { user?: any }, res) => {
  try {
    const ev = db.getEventById(req.params.id);
    if (!ev || ev.organizerId !== req.user.id) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    db.deleteEvent(req.params.id);
    res.json({ message: "Event deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// Gifts: List Gifts (for an event, accessible by guests tool)
app.get("/api/events/:eventId/gifts", (req, res) => {
  const gifts = db.getGiftsByEvent(req.params.eventId);
  res.json(gifts);
});

// Gifts: Add Gift (organizer only)
app.post("/api/events/:eventId/gifts", authenticateToken, (req: Request & { user?: any }, res) => {
  try {
    const ev = db.getEventById(req.params.eventId);
    if (!ev || ev.organizerId !== req.user.id) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const { name, productLink, productImage, priority } = req.body;
    if (!name || !priority) {
      res.status(400).json({ error: "Gift name and priority level are required" });
      return;
    }

    const newGift: Gift = {
      id: "GFT-" + generateId(),
      eventId: req.params.eventId,
      name,
      productLink: productLink || "",
      productImage: productImage || "",
      priority,
      createdAt: new Date().toISOString()
    };

    db.addGift(newGift);
    broadcastEventUpdate(req.params.eventId);
    res.status(201).json(newGift);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Gifts: Edit Gift (organizer only)
app.put("/api/gifts/:id", authenticateToken, (req: Request & { user?: any }, res) => {
  try {
    const gift = db.getGiftById(req.params.id);
    if (!gift) {
      res.status(404).json({ error: "Gift not found" });
      return;
    }

    const ev = db.getEventById(gift.eventId);
    if (!ev || ev.organizerId !== req.user.id) {
      res.status(403).json({ error: "Unauthorized operation" });
      return;
    }

    const updated = db.updateGift(req.params.id, req.body);
    broadcastEventUpdate(gift.eventId);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Gifts: Delete Gift (organizer only)
app.delete("/api/gifts/:id", authenticateToken, (req: Request & { user?: any }, res) => {
  try {
    const gift = db.getGiftById(req.params.id);
    if (!gift) {
      res.status(404).json({ error: "Gift not found" });
      return;
    }

    const ev = db.getEventById(gift.eventId);
    if (!ev || ev.organizerId !== req.user.id) {
      res.status(403).json({ error: "Unauthorized operation" });
      return;
    }

    db.deleteGift(req.params.id);
    broadcastEventUpdate(gift.eventId);
    res.json({ message: "Gift removed successfully from registry" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Real-Time Gift Selection Logic: Select Gift (Guest)
app.post("/api/gifts/:id/reserve", (req, res) => {
  try {
    const { guestId, guestName } = req.body;
    if (!guestId || !guestName) {
      res.status(400).json({ error: "Guest information is required to select a gift" });
      return;
    }

    const gift = db.getGiftById(req.params.id);
    if (!gift) {
      res.status(404).json({ error: "Gift not found" });
      return;
    }

    // CHECK IF ALREADY RESERVED!
    if (gift.reservedByGuestId && gift.reservedByGuestId !== guestId) {
      res.status(400).json({ error: "This gift is already reserved by another guest" });
      return;
    }

    // Assign reservation
    const updated = db.updateGift(req.params.id, {
      reservedByGuestId: guestId,
      reservedByGuestName: guestName
    });

    // Also update this guest's RSVP if they are registered
    const listGuests = db.getRSVPsByEvent(gift.eventId);
    const guestObj = listGuests.find(g => g.id === guestId);
    if (guestObj) {
      db.updateRSVPGift(guestId, req.params.id);
    }

    broadcastEventUpdate(gift.eventId);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Real-Time Gift Selection Logic: Deselect Gift (Guest)
app.post("/api/gifts/:id/release", (req, res) => {
  try {
    const { guestId } = req.body;
    if (!guestId) {
      res.status(400).json({ error: "Guest identifier is required to deselect a gift" });
      return;
    }

    const gift = db.getGiftById(req.params.id);
    if (!gift) {
      res.status(404).json({ error: "Gift not found" });
      return;
    }

    // verify it's indeed reserved by this same guest
    if (gift.reservedByGuestId !== guestId) {
      res.status(400).json({ error: "You cannot release a gift that you did not reserve" });
      return;
    }

    // Release reservation
    const updated = db.updateGift(req.params.id, {
      reservedByGuestId: null,
      reservedByGuestName: null
    });

    // Reset this guest's RSVP gift
    db.updateRSVPGift(guestId, null);

    broadcastEventUpdate(gift.eventId);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// Guest RSVPs: Submit RSVP
app.post("/api/events/:eventId/rsvp", (req, res) => {
  try {
    const { name, email, phone, familyMembers, vegCount, nonVegCount, attendanceStatus, guestId } = req.body;

    if (!name || !email || !attendanceStatus) {
      res.status(400).json({ error: "Name, email, and RSVP status are required" });
      return;
    }

    const finalGuestId = guestId || "GST-" + generateId();

    const newRsvp: GuestRSVP = {
      id: finalGuestId,
      eventId: req.params.eventId,
      name,
      email,
      phone: phone || "",
      familyMembers: Number(familyMembers) || 1,
      vegCount: Number(vegCount) || 0,
      nonVegCount: Number(nonVegCount) || 0,
      selectedGiftId: null, // Starts unselected, changed later
      attendanceStatus,
      submittedAt: new Date().toISOString()
    };

    db.addRSVP(newRsvp);
    broadcastEventUpdate(req.params.eventId);

    res.status(200).json(newRsvp);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Guest RSVPs: Retrieve RSVPs (Organizer dashboard, filter & search in memory or DB)
app.get("/api/events/:eventId/rsvps", authenticateToken, (req: Request & { user?: any }, res) => {
  const ev = db.getEventById(req.params.eventId);
  if (!ev || ev.organizerId !== req.user.id) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const rsvps = db.getRSVPsByEvent(req.params.eventId);
  res.json(rsvps);
});


// Public Blogs Page Lists
app.get("/api/blogs", (req, res) => {
  res.json(db.getBlogs());
});

// Create Blog (Organizer / Author)
app.post("/api/blogs", authenticateToken, (req, res) => {
  try {
    const { title, content, author, category, imageUrl } = req.body;
    if (!title || !content || !category) {
      res.status(400).json({ error: "Title, content, and category are required" });
      return;
    }

    const newBlog = {
      id: "BLG-" + generateId(),
      title,
      content,
      author: author || "Giftify Editor",
      date: new Date().toISOString().split("T")[0],
      category,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80"
    };

    db.addBlog(newBlog);
    res.status(201).json(newBlog);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// Live Real-Time SSE Hub (Event-listening stream)
app.get("/api/events/:id/live", (req, res) => {
  const eventId = req.params.id;

  // Set response headers for Server-Sent Events
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });

  // Write a connection established keep-alive message
  res.write(`data: ${JSON.stringify({ type: "CONNECTED" })}\n\n`);

  // Keep connection open in activeSseListeners list
  const connection: SseConnection = { eventId, res };
  activeSseListeners.push(connection);

  // Monitor heartbeat
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch (e) {
      clearInterval(heartbeatInterval);
    }
  }, 15000);

  // Connection closer, remove listener
  req.on("close", () => {
    clearInterval(heartbeatInterval);
    activeSseListeners = activeSseListeners.filter(listener => listener !== connection);
    console.log(`SSE client disconnected for event ${eventId}. Total listeners left: ${activeSseListeners.length}`);
  });
});


// --- ENDPLACE OF VITE ASSET LOADING & WEB SERVER INITIATION ---

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n==================================================`);
    console.log(`Giftify Server successfully booted on Port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`Listen Host: 0.0.0.0`);
    console.log(`==================================================\n`);
  });
}

startServer();
