"use client";

import { useEffect, useState, useRef } from "react";
import MenuIcon from '@/app/components/menu-icon';
import { FeedbackProvider, usefeedback } from '@/app/components/feedback-provider';
import { useRouter } from 'next/navigation';

const imageQualityFilters : string[] = ["Good quality only", "All"];
const dateFilters : number[] = [1, 2, 3, 6, -1];


function DownloadContent() {
    const router = useRouter();
    const { openFeedback } = usefeedback();
    const [menuOpen, setMenuOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState<string>("");
    // Initialize from localStorage if available
    const [imageQuality, setImageQuality] = useState<string>(() => (typeof window !== 'undefined' && localStorage.getItem("imageQuality")) || "");
    const [filterDate, setFilterDate] = useState<string>(() => (typeof window !== 'undefined' && localStorage.getItem("filterDate")) || "");
    const [phiAllowed, setPhiAllowed] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem("phiAllowed") || "";
        }
        return "";
    });

    // Save to localStorage when fields change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem("imageQuality", imageQuality);
        }
    }, [imageQuality]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem("filterDate", filterDate);
        }
    }, [filterDate]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (phiAllowed) {
                localStorage.setItem("phiAllowed", phiAllowed);
            } else {
                localStorage.removeItem("phiAllowed");
            }
        }
    }, [phiAllowed]);


    const handleExport = async () => {
        setExporting(true);
        setExportError("");
        
        try {
            // Convert date filter to months
            let lastMonths = "All";
            if (filterDate === "1") lastMonths = "1";
            else if (filterDate === "2") lastMonths = "2";
            else if (filterDate === "3") lastMonths = "3";
            else if (filterDate === "6") lastMonths = "6";

            const response = await fetch('/api/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lastMonths: lastMonths,
                    phiAllowed: phiAllowed,
                    goodQualityOnly: imageQuality,
                    // pgPassword: 'your_password_here'
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || 'Export failed');
            }

            // Get the blob from the response
            const blob = await response.blob();
            
            // Create a download link and trigger it
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            // Extract filename from Content-Disposition header or use default
            const contentDisposition = response.headers.get('Content-Disposition');
            const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
            const filename = filenameMatch ? filenameMatch[1] : `selfie_export_${Date.now()}.tar.gz`;
            
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
        } catch (error) {
            console.error('Export error:', error);
            setExportError(error instanceof Error ? error.message : 'Failed to export data');
        } finally {
            setExporting(false);
        }
    };

    return (
          <div className="min-h-screen bg-gradient-to-br from-gray-500 to-gray-900 w-full pb-10">
            <div className="relative flex flex-row">
                <MenuIcon
                    menuOpen={menuOpen}
                    onClick={() => {
                        setMenuOpen(prev => {
                        const next = !prev;
                        localStorage.setItem("showMenuOpen", JSON.stringify(next));
                        return next;
                        });
                    }}
                    />
    
                {/* Title */}
                <div className="max-w-5xl mx-auto absolute inset-3 pointer-events-none">
                    <h1 className="text-2xl font-extrabold uppercase bg-gradient-to-br from-yellow-200 to-pink-500 bg-clip-text text-transparent text-center">Selfie App</h1>
                    <h2 className="text-xs text-white text-center">Streamlined lesion photography</h2>
                </div>
                
            </div>

            <div className="flex flex-col md:flex-row items-center ml-4 mr-4 md:justify-center gap-2 md:gap-4 mt-2 w-auto mt-15">

                {/* Filter by Date */}
                <select
                    value={filterDate ?? ""}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className={"w-[300px] text-gray-600 px-3 py-3 bg-gray-50 border-2 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-white transition-all cursor-pointer "}
                >
                    <option value="">Filter by date...</option>
                    {dateFilters.map((option) => (
                    <option key={option} value={option}>
                        {option == 1 ? "Last " + option + " month" : (option == -1 ? "All" : "Last " + option + " months")}  
                    </option>
                    ))}
                </select>

                {/* Filter by Image Quality */}
                <select
                    value={imageQuality ?? ""}
                    onChange={(e) => setImageQuality(e.target.value)}
                    className={"w-[300px] text-gray-600 px-3 py-3 bg-gray-50 border-2 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-white transition-all cursor-pointer "}
                >
                    <option value="">Filter by image quality...</option>
                    {imageQualityFilters.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                    ))}
                </select>

                {/* Filter by PHI */}
                <select
                    value={phiAllowed}
                    onChange={(e) => setPhiAllowed(e.target.value)}
                    className={"w-[300px] text-gray-600 px-3 py-3 bg-gray-50 border-2 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-white transition-all cursor-pointer "}
                >
                    <option value="">Filter by identifiable information...</option>
                    {["Non-identifiable only", "All"].map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                    ))}
                </select>
            </div>

             <div className="flex justify-center w-full mt-10 mb-10">
              <div className="w-[300px] bg-gradient-to-br from-yellow-500 to-pink-500 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col items-center cursor-pointer">
                  <button
                    type="button"
                    className="block text-sm font-semibold text-white uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleExport}
                    disabled={exporting}
                  >
                    {exporting ? 'Exporting...' : 'Download'}
                  </button>
              </div>
          </div>

          {exportError && (
            <div className="flex justify-center w-full mb-4">
              <div className="max-w-md bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{exportError}</span>
              </div>
            </div>
          )}

            

            {/* Sidebar overlay */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/40 z-40"
                onClick={() => {
                    setMenuOpen(false);
                    localStorage.setItem("showMenuOpen", JSON.stringify(false));
                }}
                aria-label="Close sidebar overlay"
              />
              <aside className="fixed top-0 left-0 h-full w-64 bg-gradient-to-br from-gray-200 to-gray-500 shadow-lg z-50 flex flex-col p-6 transition-transform duration-300">
                <nav className="flex flex-col gap-4 items-start">
                    <div className="bg-white rounded-xl pl-10 pr-10 pt-2 pb-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-black">
                        <button 
                            className="text-xl font-semibold text-gray-600 uppercase tracking-wide"
                            onClick={() => {
                                router.push('/');
                            }}
                        >Home
                        </button>
                
                    </div>
                    <div className="bg-white rounded-xl pl-10 pr-10 pt-2 pb-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-black">
                        <button 
                            className="text-xl font-semibold text-gray-600 uppercase tracking-wide"
                            onClick={() => {router.push('/dashboard');}}
                        >Dashboard
                        </button>
                     </div>
                     <div className="bg-white rounded-xl pl-10 pr-10 pt-2 pb-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-black">
                        <button 
                            className="text-xl font-semibold text-gray-600 uppercase tracking-wide"
                            onClick={() => {
                                setMenuOpen(false);
                                openFeedback();
                            }}
                        >Feedback
                        </button>
                     </div>
                    <div className="bg-white rounded-xl pl-10 pr-10 pt-2 pb-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-black">
                        <button 
                            className="text-xl font-semibold text-gray-600 uppercase tracking-wide"
                            onClick={() => {
                                setMenuOpen(false);
                            }}
                        >Download
                        </button>
                     </div>
                </nav>
              </aside>
            </> 
          )}
          </div>
    );
}

export default function Download() {
    return (
        <FeedbackProvider>
            <DownloadContent />
        </FeedbackProvider>
    );
}