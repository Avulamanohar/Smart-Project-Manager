import React, { useState, useEffect, useRef } from 'react';
import { FaRobot, FaMicrophone, FaPaperPlane, FaTimes, FaCompress, FaExpand, FaPaperclip, FaPlus, FaMagic } from 'react-icons/fa';
import api from '../api';
import { useLocation, matchPath } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hi! I'm your AI Project Assistant. Ask me anything or create tasks!", sender: 'bot' }
    ]);
    const [inputText, setInputText] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const recognitionRef = useRef(null);
    const initialTextRef = useRef("");
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const location = useLocation();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const getProjectId = () => {
        const match = matchPath("/project/:id", location.pathname);
        return match ? match.params.id : null;
    };

    const toggleListening = () => {
        if (isListening) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            return;
        }

        if (!('webkitSpeechRecognition' in window)) {
            alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false; // Changed to false for better accuracy on single commands
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInputText(prev => {
                const separator = prev && !prev.endsWith(' ') ? ' ' : '';
                return prev + separator + transcript;
            });
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
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setIsLoading(true);

        try {
            const projectId = getProjectId();
            const formData = new FormData();
            formData.append('message', userMsg.text);
            formData.append('projectId', projectId);

            // Send History (exclude current message)
            const history = messages.map(m => ({
                sender: m.sender,
                text: m.text
            }));
            formData.append('history', JSON.stringify(history));

            if (fileToSend) {
                formData.append('file', fileToSend);
            }

            const res = await api.post('/projects/ai/command', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const botMsg = {
                id: Date.now() + 1,
                text: res.data.reply,
                sender: 'bot',
                task: res.data.task, // Existing task handling
                project: res.data.project // New project handling
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error(error);
            const errorMsg = {
                id: Date.now() + 1,
                text: error.response?.data?.reply || "I encountered an error. Please try again.",
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
            { id: 1, text: "Hi! I'm your AI Project Assistant. Ask me anything or create tasks!", sender: 'bot' }
        ]);
        setInputText("");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <>
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] z-50 flex items-center justify-center text-white group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-75"></div>
                        <FaRobot size={28} className="relative z-10 group-hover:animate-bounce" />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            width: isMaximized ? 'auto' : 400,
                            height: isMaximized ? 'auto' : 600,
                            left: isMaximized ? 16 : 'auto',
                            right: isMaximized ? 16 : 32,
                            top: isMaximized ? 16 : 'auto',
                            bottom: isMaximized ? 16 : 32
                        }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className={`fixed flex flex-col z-50 rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl`}
                        style={{
                            maxWidth: isMaximized ? 'none' : 'calc(100vw - 40px)',
                            maxHeight: isMaximized ? 'none' : 'calc(100vh - 100px)'
                        }}
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-between shrink-0 shadow-lg relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                                    <FaMagic className="text-yellow-300" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white tracking-wide text-sm">AI Assistant</h3>
                                    <div className="flex items-center gap-1.5 ">
                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                                        <span className="text-[10px] text-indigo-100 font-medium">Online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 relative z-10 text-white/80">
                                <button onClick={handleNewChat} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="New Chat">
                                    <FaPlus size={14} />
                                </button>
                                <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    {isMaximized ? <FaCompress size={14} /> : <FaExpand size={14} />}
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-red-500/80 hover:text-white rounded-lg transition-colors">
                                    <FaTimes size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-indigo-200/50 dark:scrollbar-thumb-indigo-900/50">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.sender === 'bot' && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
                                            <FaRobot size={14} />
                                        </div>
                                    )}

                                    <div
                                        className={`relative px-5 py-3.5 max-w-[80%] text-sm rounded-2xl shadow-sm ${msg.sender === 'user'
                                            ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-br-none'
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-700/50'
                                            }`}
                                    >
                                        {msg.text}
                                        {msg.file && (
                                            <div className="mt-2 text-xs py-1 px-2 bg-black/10 dark:bg-white/10 rounded flex items-center gap-2">
                                                <FaPaperclip /> {msg.file}
                                            </div>
                                        )}
                                        {msg.project && (
                                            <div className="mt-3 bg-white/90 dark:bg-slate-900/50 dark:text-white text-slate-800 p-3 rounded-xl text-xs border border-indigo-100 dark:border-indigo-500/20 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                                <div className="font-bold mb-1 flex items-center gap-2">
                                                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">🚀</span>
                                                    Project Created
                                                </div>
                                                <div className="font-medium text-indigo-600 dark:text-indigo-400 text-sm truncate">{msg.project.name}</div>
                                                <div className="opacity-70 mt-0.5 truncate">{msg.project.description}</div>
                                            </div>
                                        )}
                                        {msg.task && (
                                            <div className="mt-3 bg-white/90 dark:bg-slate-900/50 dark:text-white text-slate-800 p-3 rounded-xl text-xs border border-indigo-100 dark:border-indigo-500/20 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                                                <div className="font-bold mb-1 flex items-center gap-2">
                                                    <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center">✓</span>
                                                    Task Created
                                                </div>
                                                <div className="font-medium text-indigo-600 dark:text-indigo-400 text-sm truncate">{msg.task.title}</div>
                                                <div className="opacity-70 mt-0.5">Priority: {msg.task.priority}</div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                        <span className="animate-spin text-slate-500">⏳</span>
                                    </div>
                                    <div className="px-4 py-3 bg-white dark:bg-slate-800 rounded-2xl rounded-bl-none border border-slate-100 dark:border-slate-700/50 flex gap-1.5 items-center">
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white/50 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-white/5 backdrop-blur-md">
                            {selectedFile && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between p-2 mb-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs border border-indigo-100 dark:border-indigo-500/20">
                                    <span className="flex items-center gap-2 truncate"><FaPaperclip /> {selectedFile.name}</span>
                                    <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-white/50 rounded-full"><FaTimes /></button>
                                </motion.div>
                            )}

                            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-full p-1.5 border border-slate-200 dark:border-white/10 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-full transition-all"
                                >
                                    <FaPaperclip size={16} />
                                </button>

                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 text-sm placeholder:text-slate-400"
                                />

                                <div className="flex items-center gap-1 pr-1">
                                    <button
                                        onClick={toggleListening}
                                        className={`p-2.5 rounded-full transition-all ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'}`}
                                    >
                                        <FaMicrophone size={16} />
                                    </button>
                                    <button
                                        onClick={handleSend}
                                        disabled={(!inputText.trim() && !selectedFile) || isLoading}
                                        className="p-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-full shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                                    >
                                        <FaPaperPlane size={14} className="ml-0.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FloatingChatbot;
