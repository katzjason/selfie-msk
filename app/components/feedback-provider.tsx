"use client"
import ReportBug from '@/app/components/report-bug';
import React, { createContext, useContext, useCallback, useRef, useState, useEffect } from "react";

type feedbackCtx = { 
    showfeedback: (message: string) => void;
};

const feedbackContext = createContext<feedbackCtx | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  useEffect(() => {
    const storedMessage = localStorage.getItem("feedbackMessage");
    const storedShowFeedback = localStorage.getItem("showFeedback");

    if (storedMessage) setMessage(storedMessage);
    if (storedShowFeedback === 'true') setShowFeedback(true);
  }, []);

  return (
    <feedbackContext.Provider value={{ showfeedback: (message: string) => {
      //setMessage({ message });
      setShowFeedback(true);
    } }}>
      {children}
      <ReportBug clickCallback={() => {
        setShowFeedback(!showFeedback);
        localStorage.setItem("showFeedback", (!showFeedback).toString());
        }}/>

      { showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-200/90 flex flex-col">
          <div
            className="
              relative
              rounded-2xl
              bg-gray-600
              shadow-xl
              flex flex-col items-center
              min-h-[480px]
              w-[85%]
              max-w-md
            "
          >
            <button
              className="absolute top-2 right-2 z-10"
              onClick={() => {
                setShowFeedback(false);
                localStorage.setItem("showFeedback", "false");
              }}
              aria-label="Close"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow hover:cursor-pointer">
                  <span className="text-3xl font-bold bg-gradient-to-br from-yellow-200 to-pink-500 bg-clip-text text-transparent ">
                      &times;
                  </span>
              </div>
            </button>

            {/* Header Text */}
            <div className="text-white font-semibold text-2xl uppercase text-center mt-10">Report a bug</div>

            <textarea 
              className="bg-white rounded-lg text-black mt-4 w-[80%] h-[60%] mb-4 align-text-top p-2 resize-none focus:outline-none"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                localStorage.setItem("feedbackMessage", e.target.value);
              }}
              placeholder="Describe the issue..."
            >
            </textarea>
            <div className="w-1/2 bg-gradient-to-br from-yellow-500 to-pink-500 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col items-center mb-4">
              <button
                type="button"
                className="block text-sm font-semibold text-white uppercase tracking-wide"
                onClick={() => {
                  setShowFeedback(false);
                  localStorage.setItem("showFeedback", "false");


                  // submit to database
                  // toast pop up
                  // if success, clear local storage message
                }}
              >Submit</button>
            </div>
          </div>
        </div>
      )}
    </feedbackContext.Provider>
  );
}

export function usefeedback() {
  const ctx = useContext(feedbackContext);
  if (!ctx) throw new Error("usefeedback must be used within feedbackProvider");
  return ctx;
}