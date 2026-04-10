"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Check,
  X,
  Plus,
  CalendarDays,
  User,
  ChevronDown,
} from "lucide-react";
import Header from "@/components/Header";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import Loading from "@/app/loading";

// --- TYPES ---
type DateEvent = {
  id: number;
  start_time: string;
  end_time: string;
  details: string;
  status: "pending" | "accepted";
  direction: "sent" | "received";
  other_user_id: number;
  other_first_name: string;
};

type Match = {
  id: number;
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  is_online: boolean;
  profile_picture: string;
};

export default function CalendarPage() {
  const [dates, setDates] = useState<DateEvent[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [receiverId, setReceiverId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [details, setDetails] = useState("");

  const fetchData = async () => {
    try {
      const [calendarRes, matchesRes] = await Promise.all([
        fetchWithAuth("/dates/calendar"),
        fetchWithAuth("/matches"),
      ]);

      if (calendarRes.ok) {
        const calendarData = await calendarRes.json();
        setDates(calendarData);
      }

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setMatches(matchesData);
      }
    } catch (err) {
      console.error("Failed to fetch calendar data:", err);
    } finally {
      setIsFadingOut(true);
      setTimeout(() => setLoading(false), 1000);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HANDLERS ---
  const handleRespond = async (
    dateId: number,
    action: "accept" | "decline"
  ) => {
    try {
      const res = await fetchWithAuth("/dates/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateId, action }),
      });

      if (res.ok) {
        if (action === "accept") {
          setDates((prev) =>
            prev.map((d) =>
              d.id === dateId ? { ...d, status: "accepted" } : d
            )
          );
        } else {
          setDates((prev) => prev.filter((d) => d.id !== dateId));
        }
      }
    } catch (err) {
      console.error(`Failed to ${action} date:`, err);
    }
  };

  const handleCancel = async (dateId: number) => {
    try {
      const res = await fetchWithAuth("/dates/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateId }),
      });

      if (res.ok) {
        setDates((prev) => prev.filter((d) => d.id !== dateId));
      }
    } catch (err) {
      console.error("Failed to cancel date:", err);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth("/dates/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: Number(receiverId),
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          details,
        }),
      });

      if (res.ok) {
        setShowRequestModal(false);
        setReceiverId("");
        setStartTime("");
        setEndTime("");
        setDetails("");
        fetchData(); // Refresh list to show the new outgoing request
      }
    } catch (err) {
      console.error("Failed to create date request:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER HELPERS ---
  const formatDateTime = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  };

  const pendingDates = dates.filter((d) => d.status === "pending");
  const upcomingDates = dates.filter((d) => d.status === "accepted");

  if (loading) {
    return (
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-1000 ease-in-out ${
          isFadingOut ? "opacity-0" : "opacity-100"
        }`}
      >
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="grow w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
              Your Dates
            </h1>
            <p className="text-gray-500 mt-1">Manage your romantic schedule.</p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">New Request</span>
          </button>
        </div>

        {/* --- PENDING REQUESTS SECTION --- */}
        {pendingDates.length > 0 && (
          <section className="mb-12">
            <h2 className="text-sm font-black uppercase tracking-widest text-orange-500 mb-4 flex items-center gap-2">
              <Clock size={16} /> Pending Requests
            </h2>
            <div className="space-y-4">
              {pendingDates.map((date) => (
                <div
                  key={date.id}
                  className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400"></div>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl font-bold text-gray-900">
                          {date.direction === "sent"
                            ? "Waiting on "
                            : "Request from "}
                          <span className="text-rose-500">
                            {date.other_first_name}
                          </span>
                        </span>
                      </div>
                      <p className="text-gray-500 font-medium text-sm flex items-center gap-1.5 mb-3">
                        <CalendarDays size={16} />
                        {formatDateTime(date.start_time)}
                      </p>
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <p className="text-gray-700 text-sm">{date.details}</p>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2 mt-2 sm:mt-0">
                      {date.direction === "received" ? (
                        <>
                          <button
                            onClick={() => handleRespond(date.id, "accept")}
                            className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1 transition-colors"
                          >
                            <Check size={18} /> Accept
                          </button>
                          <button
                            onClick={() => handleRespond(date.id, "decline")}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold flex items-center gap-1 transition-colors"
                          >
                            <X size={18} /> Decline
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleCancel(date.id)}
                          className="bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 px-4 py-2 rounded-xl font-bold transition-colors"
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --- UPCOMING DATES SECTION --- */}
        <section>
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <CalendarIcon size={16} /> Upcoming Dates
          </h2>
          {upcomingDates.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center shadow-sm">
              <div className="bg-rose-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarIcon size={32} className="text-rose-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                No upcoming dates
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Your calendar is looking a little empty. Send a request to a
                match and get something on the books!
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {upcomingDates.map((date) => (
                <div
                  key={date.id}
                  className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="grow">
                      <h3 className="text-2xl font-black text-gray-900 mb-2 flex items-center gap-2">
                        Date with {date.other_first_name}
                      </h3>
                      <div className="flex flex-wrap gap-4 mb-4">
                        <span className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5">
                          <Clock size={16} /> {formatDateTime(date.start_time)}
                        </span>
                      </div>
                      <p className="text-gray-600 bg-gray-50 p-4 rounded-2xl">
                        {date.details}
                      </p>
                    </div>

                    <div className="shrink-0 flex sm:flex-col justify-end gap-2">
                      <button
                        onClick={() => handleCancel(date.id)}
                        className="bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 px-4 py-2.5 rounded-xl font-bold transition-colors w-full sm:w-auto"
                      >
                        Cancel Date
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* --- CREATE REQUEST MODAL --- */}
      {showRequestModal && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl relative overflow-hidden">
            <div className="bg-gradient-to-r from-rose-500 to-orange-400 p-6 text-white">
              <h2 className="text-2xl font-black uppercase">Schedule a Date</h2>
              <p className="opacity-90 mt-1">Shoot your shot.</p>
              <button
                onClick={() => setShowRequestModal(false)}
                className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 space-y-5">
              {/* --- MATCH DROPDOWN --- */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Select a Match
                </label>
                <div className="relative">
                  <User
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <select
                    required
                    value={receiverId}
                    onChange={(e) => setReceiverId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-10 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent font-medium appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      Choose who to invite...
                    </option>
                    {matches.map((match) => (
                      <option key={match.id} value={match.user_id}>
                        {match.first_name} {match.last_name}
                      </option>
                    ))}
                  </select>
                  {/* Custom Chevron for styling consistency */}
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <ChevronDown size={20} className="text-gray-400" />
                  </div>
                </div>
                {matches.length === 0 && (
                  <p className="text-sm text-red-500 mt-2 font-medium">
                    You need to have matches before you can send a date request!
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Details / Location
                </label>
                <textarea
                  required
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium resize-none"
                  placeholder="e.g. เจอกันที่ร้านอาหารริมแม่น้ำเจ้าพระยา..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || matches.length === 0}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-lg py-4 rounded-xl transition-colors disabled:opacity-50 mt-4 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send Invitation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
