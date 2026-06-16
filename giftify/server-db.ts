import fs from 'fs';
import path from 'path';
import { User, Event, Gift, GuestRSVP, BlogPost } from './src/types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

interface Schema {
  users: User[];
  events: Event[];
  gifts: Gift[];
  rsvps: GuestRSVP[];
  blogs: BlogPost[];
  passwordResets: { id: string; email: string; token: string; expiresAt: string }[];
}

function getInitialBlogs(): BlogPost[] {
  return [
    {
      id: "blog1",
      title: "10 Essential Tips for Stress-Free Wedding Planning",
      content: "Planning a wedding can feel overwhelming, but breaking it down into manageable segments makes all the difference. Start by locking in a budget early, establishing a guest list ceiling, and building a responsive digital gift registry. Curating your list with clear priority levels helps guests make meaningful contributions and prevents double-gifting.",
      author: "Eleanor Sterling",
      date: "2026-06-10",
      category: "Wedding",
      imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "blog2",
      title: "How to Build the Ultimate Housewarming Registry",
      content: "Moving into a new home is a stellar milestone, but getting the right essentials requires some strategic curation. Instead of asking for generic knick-knacks, focus on high-priority items that elevate daily living—such as high-quality cookware, smart audio electronics, or customized decor. A shared gift list ensures hosts get exactly what they need while saving guests from guessing.",
      author: "Marcus Vance",
      date: "2026-06-12",
      category: "Gifting",
      imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "blog3",
      title: "The Etiquette of Celebrating Baby Showers",
      content: "Baby showers are deeply intimate, joyful gatherings. As an organizer, providing a clear itinerary with precise event times, meal setups, and a list of requested baby gear helps set clear expectations. As a guest, choosing a gift of varying price ranges and respecting the host's custom priority filters shows thoughtful support.",
      author: "Clara Brooks",
      date: "2026-06-14",
      category: "Planning",
      imageUrl: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "blog4",
      title: "Modern Birthday Parties: Experience vs. Physical Goods",
      content: "Today's birthday parties focus heavily on high-fidelity, customized themes rather than simple gatherings. Whether organizing for adults or children, having a centralized RSVP system with family count parameters helps caterers serve dietary preferences perfectly. A digital catalog helps balance experience vouchers with concrete wishlist items.",
      author: "Jonas Drake",
      date: "2026-06-15",
      category: "Birthday",
      imageUrl: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80"
    }
  ];
}

class ServerDb {
  private data: Schema;

  constructor() {
    this.data = {
      users: [],
      events: [],
      gifts: [],
      rsvps: [],
      blogs: getInitialBlogs(),
      passwordResets: []
    };
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users || [],
          events: parsed.events || [],
          gifts: parsed.gifts || [],
          rsvps: parsed.rsvps || [],
          blogs: parsed.blogs || getInitialBlogs(),
          passwordResets: parsed.passwordResets || []
        };
      } else {
        this.save();
      }
    } catch (e) {
      console.error("Failed to load local DB, using in-memory:", e);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error("Failed to write to local DB file:", e);
    }
  }

  // Users
  getUsers(): User[] { return this.data.users; }
  getUserById(id: string): User | undefined { return this.data.users.find(u => u.id === id); }
  getUserByEmail(email: string): User | undefined { 
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()); 
  }
  addUser(user: User) {
    this.data.users.push(user);
    this.save();
  }

  // Events
  getEvents(): Event[] { return this.data.events; }
  getEventsByOrganizer(organizerId: string): Event[] {
    return this.data.events.filter(e => e.organizerId === organizerId);
  }
  getEventById(id: string): Event | undefined {
    return this.data.events.find(e => e.id === id);
  }
  addEvent(event: Event) {
    this.data.events.push(event);
    this.save();
  }
  updateEvent(id: string, updated: Partial<Event>) {
    const idx = this.data.events.findIndex(e => e.id === id);
    if (idx !== -1) {
      this.data.events[idx] = { ...this.data.events[idx], ...updated };
      this.save();
      return this.data.events[idx];
    }
    return undefined;
  }
  deleteEvent(id: string) {
    this.data.events = this.data.events.filter(e => e.id !== id);
    this.data.gifts = this.data.gifts.filter(g => g.eventId !== id);
    this.data.rsvps = this.data.rsvps.filter(r => r.eventId !== id);
    this.save();
  }

  // Gifts
  getGiftsByEvent(eventId: string): Gift[] {
    return this.data.gifts.filter(g => g.eventId === eventId);
  }
  getGiftById(id: string): Gift | undefined {
    return this.data.gifts.find(g => g.id === id);
  }
  addGift(gift: Gift) {
    this.data.gifts.push(gift);
    this.save();
  }
  updateGift(id: string, updated: Partial<Gift>) {
    const idx = this.data.gifts.findIndex(g => g.id === id);
    if (idx !== -1) {
      this.data.gifts[idx] = { ...this.data.gifts[idx], ...updated };
      this.save();
      return this.data.gifts[idx];
    }
    return undefined;
  }
  deleteGift(id: string) {
    this.data.gifts = this.data.gifts.filter(g => g.id !== id);
    this.save();
  }

  // RSVPs
  getRSVPsByEvent(eventId: string): GuestRSVP[] {
    return this.data.rsvps.filter(r => r.eventId === eventId);
  }
  getRSVPById(id: string): GuestRSVP | undefined {
    return this.data.rsvps.find(r => r.id === id);
  }
  getRSVPByEmailAndEvent(email: string, eventId: string): GuestRSVP | undefined {
    return this.data.rsvps.find(r => r.eventId === eventId && r.email.toLowerCase() === email.toLowerCase());
  }
  addRSVP(rsvp: GuestRSVP) {
    // If guest exists for same event, update it, otherwise push
    const idx = this.data.rsvps.findIndex(r => r.eventId === rsvp.eventId && r.email.toLowerCase() === rsvp.email.toLowerCase());
    if (idx !== -1) {
      this.data.rsvps[idx] = { ...this.data.rsvps[idx], ...rsvp };
    } else {
      this.data.rsvps.push(rsvp);
    }
    this.save();
  }
  updateRSVPGift(rsvpId: string, giftId: string | null) {
    const idx = this.data.rsvps.findIndex(r => r.id === rsvpId);
    if (idx !== -1) {
      this.data.rsvps[idx].selectedGiftId = giftId;
      this.save();
    }
  }

  // Blogs
  getBlogs(): BlogPost[] { return this.data.blogs; }
  addBlog(blog: BlogPost) {
    this.data.blogs.unshift(blog);
    this.save();
  }

  // Password Resets
  addPasswordReset(reset: { id: string; email: string; token: string; expiresAt: string }) {
    this.data.passwordResets = this.data.passwordResets.filter(r => r.email.toLowerCase() !== reset.email.toLowerCase());
    this.data.passwordResets.push(reset);
    this.save();
  }
  getPasswordResetByToken(token: string) {
    return this.data.passwordResets.find(r => r.token === token);
  }
  deletePasswordReset(token: string) {
    this.data.passwordResets = this.data.passwordResets.filter(r => r.token !== token);
    this.save();
  }
}

export const db = new ServerDb();
