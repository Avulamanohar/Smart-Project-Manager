import React, { useState, useEffect, useRef } from 'react';
import { FaRobot, FaMicrophone, FaPaperPlane, FaTimes, FaCompress, FaExpand, FaPaperclip, FaPlus } from 'react-icons/fa';
import api from '../api';
import { useLocation, matchPath } from 'react-router-dom';

const FloatingChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hi! I'm your AI Project Assistant. Ask me anything or create tasks. You can also upload files for context.", sender: 'bot' }
    ]);
    const [inputText, setInputText] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const recognitionRef = useRef(null);
    const initialTextRef = useRef(""); // To store text before speaking
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const location = useLocation();

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Cleanup recognition on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    // Determine current project ID from URL if possible
    const getProjectId = () => {
        const match = matchPath("/project/:id", location.pathname);
        return match ? match.params.id : null;
    };

    // Voice Recognition
    const toggleListening = () => {
        if (isListening) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                // stop() triggers onend, which sets isListening false
            }
            return;
        }

        if (!('webkitSpeechRecognition' in window)) {
            alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
            return;
        }

        // Store current text so we append to it
        initialTextRef.current = inputText;

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true; // Allow continuous speech until clicked off
        recognition.interimResults = true; // Real-time feedback
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            // Construct the full text: Initial + FinalSoFar + Interim
            // Note: This simple logic might duplicate if continuous is true and we don't handle state carefully.
            // But for "transcript" from event, it usually accumulates if continuous=false,
            // or if continuous=true it gives everything.

            // Simpler approach for React Input:
            // Just take the full transcript from the event (which accumulates in the session)
            // and add it to initialText.

            const currentSessionTranscript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');

            const separator = initialTextRef.current && !initialTextRef.current.endsWith(' ') ? ' ' : '';
            setInputText(initialTextRef.current + separator + currentSessionTranscript);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() && !selectedFile) return;

        const userMsg = {
            id: Date.now(),
            text: inputText,
            sender: 'user',
            file: selectedFile ? selectedFile.name : null
        };
        setMessages(prev => [...prev, userMsg]);
        setInputText("");
        const fileToSend = selectedFile;
        setSelectedFile(null); // Clear file immediately from UI
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setIsLoading(true);

        try {
            const projectId = getProjectId();

            const formData = new FormData();
            formData.append('message', userMsg.text);
            formData.append('projectId', projectId);
            if (fileToSend) {
                formData.append('file', fileToSend);
            }

            // Must remove Content-Type header to let browser set boundary for FormData
            const res = await api.post('/projects/ai/command', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            const botMsg = {
                id: Date.now() + 1,
                text: res.data.reply,
                sender: 'bot',
                task: res.data.task
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error(error);
            const errorMsg = {
                id: Date.now() + 1,
                text: error.response?.data?.reply || "Sorry, I encountered an error processing your request.",
                sender: 'bot',
                isError: true
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleNewChat = () => {
        setMessages([
            { id: 1, text: "Hi! I'm your AI Project Assistant. Ask me anything or create tasks. You can also upload files for context.", sender: 'bot' }
        ]);
        setInputText("");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 z-50 flex items-center justify-center group"
                aria-label="Open AI Assistant"
            >
                <FaRobot size={28} className="animate-pulse-slow" />
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap ml-0 group-hover:ml-2 text-sm font-semibold">
                    AI Assist
                </span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-200 dark:border-gray-700 animate-fade-in-up h-[500px]">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                    <FaRobot size={20} />
                    <h3 className="font-bold">AI Project Assistant</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleNewChat}
                        className="hover:bg-white/20 p-1 rounded transition-colors"
                        title="New Chat"
                    >
                        <FaPlus size={16} />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
                        <FaTimes size={16} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${msg.sender === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-600'
                                }`}
                        >
                            <p>{msg.text}</p>
                            {msg.file && (
                                <div className="mt-1 text-xs opacity-80 flex items-center gap-1">
                                    <FaPaperclip size={10} /> Attached: {msg.file}
                                </div>
                            )}
                            {msg.task && (
                                <div className="mt-2 p-2 bg-black/5 dark:bg-white/5 rounded text-xs border border-black/5">
                                    <div className="font-bold mb-1">Created Task:</div>
                                    <div>Title: {msg.task.title}</div>
                                    <div>Priority: {msg.task.priority}</div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-700 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 text-gray-500">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
                {selectedFile && (
                    <div className="flex items-center justify-between text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded">
                        <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                        <button
                            onClick={() => {
                                setSelectedFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="text-red-500 hover:text-red-700"
                        >
                            <FaTimes />
                        </button>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fileInputRef.current.click()}
                        className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                        title="Attach File"
                    >
                        <FaPaperclip size={18} />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.txt,.json,.md"
                    />

                    <button
                        onClick={toggleListening}
                        className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                        title={isListening ? "Stop Listening" : "Start Listening"}
                    >
                        <FaMicrophone size={18} />
                    </button>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type or speak..."
                        className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                        onClick={handleSend}
                        disabled={(!inputText.trim() && !selectedFile) || isLoading}
                        className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        <FaPaperPlane size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FloatingChatbot;
