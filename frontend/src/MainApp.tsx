import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import './App.css';
import { 
  createStudyProfileApi, 
  createChatApi, 
  createTodoApi,
  StudyProfileData 
} from './lib/api';
import StudyProfileModal from './components/StudyProfileModal';
import Header from './components/header';

interface ApiStatus {
  status: string;
  database: string;
  gemini_api: string;
  message: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface TodoItem {
  title: string;
  description: string;
  completed: boolean;
}

interface StudyProfile {
  id: string;
  subjects: { name: string }[];
  challenges: { description: string }[];
  current_vibe: string;
  last_vibe_check: string;
}

interface TimerSettings {
  workTime: number;
  breakTime: number;
  longBreakTime: number;
}

type SidebarItem = 'chat' | 'todo' | 'timer' | 'study-profile';

const MainApp: React.FC = () => {
  const { getToken, userId } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    status: 'idle',
    database: 'idle',
    gemini_api: 'idle',
    message: ''
  });
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState<SidebarItem>('chat');
  
  // Todo states
  const [todoTitle, setTodoTitle] = useState('');
  const [todoDescription, setTodoDescription] = useState('');
  const [todos, setTodos] = useState<TodoItem[]>([]);

  // Timer States
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [isLongBreak, setIsLongBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const timerSettings: TimerSettings = {
    workTime: 25,
    breakTime: 5,
    longBreakTime: 15
  };

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [studyProfile, setStudyProfile] = useState<StudyProfile | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.split('/').filter(Boolean).pop() as SidebarItem || 'chat';

  useEffect(() => {
    const initializeAuth = async () => {
      const authToken = await getToken();
      setToken(authToken);
      setIsLoaded(true);
    };
    initializeAuth();
  }, [getToken]);

  useEffect(() => {
    if (token && userId) {
      fetchUserData();
    }
  }, [token, userId]);

  // Timer Effect
  useEffect(() => {
    let interval: number;
    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    return () => window.clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleTimerComplete = (): void => {
    setIsRunning(false);
    if (!isBreak && !isLongBreak) {
      // Work session completed
      setPomodoroCount(prev => prev + 1);
      if (pomodoroCount % 4 === 3) {
        // Every 4th pomodoro, take a long break
        setIsLongBreak(true);
        setTimeLeft(timerSettings.longBreakTime * 60);
      } else {
        // Regular break
        setIsBreak(true);
        setTimeLeft(timerSettings.breakTime * 60);
      }
    } else {
      // Break completed, back to work
      setIsBreak(false);
      setIsLongBreak(false);
      setTimeLeft(timerSettings.workTime * 60);
    }
    // Play notification sound
    new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play();
  };

  const checkApiHealth = async (): Promise<void> => {
    try {
      const response = await fetch('http://localhost:8000/health');
      const data = await response.json();
      setApiStatus(data);
    } catch (error) {
      console.error('Error checking API health:', error);
      setApiStatus({
        status: 'unhealthy',
        database: 'unhealthy',
        gemini_api: 'unhealthy',
        message: 'Error checking API health'
      });
    }
  };

  const fetchUserData = async () => {
    if (!token || !userId) return;
    
    try {
      const studyProfileApi = createStudyProfileApi(token, userId);
      const todoApi = createTodoApi(token, userId);
      
      // Fetch study profile
      const profile = await studyProfileApi.getProfile();
      if (profile) {
        setStudyProfile(profile);
      }
      
      // Fetch todos
      const todos = await todoApi.getTodos();
      setTodos(todos);
      
      // Only show profile modal if user doesn't have a profile
      if (!profile) {
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // If profile not found, show the modal
      if ((error as Error)?.message?.includes('404')) {
        setShowProfileModal(true);
      }
    }
  };

  const handleTodoSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!todoTitle.trim() || !token || !userId) return;

    try {
      const todoApi = createTodoApi(token, userId);
      const newTodo = await todoApi.createTodo({
        title: todoTitle,
        description: todoDescription,
        completed: false
      });
      
      // Clear form and refresh todos
      setTodoTitle('');
      setTodoDescription('');
      await fetchUserData(); // This will refresh the todos
    } catch (error) {
      console.error('Error creating todo:', error);
      alert('Failed to create todo. Please try again.');
    }
  };

  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!message.trim() || isLoading || !token || !userId) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const chatApi = createChatApi(token, userId);
      const studyProfileApi = createStudyProfileApi(token, userId);
      
      // Get the current study profile for context
      const profile = await studyProfileApi.getProfile();
      
      // Send message with context
      const data = await chatApi.sendMessage(userMessage, {
        vibe: profile?.current_vibe,
        subjects: profile?.subjects?.map((s: { name: string }) => s.name) || [],
        challenges: profile?.challenges?.map((c: { description: string }) => c.description) || []
      });
      
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSidebarItemClick = (item: SidebarItem): void => {
    setActiveSidebarItem(item);
    navigate(`/app/${item}`);
  };

  const handleProfileSubmit = async (data: {
    subjects: string[];
    challenges: string[];
    vibe: number;
  }) => {
    if (!token || !userId) return;
    
    try {
      const studyProfileApi = createStudyProfileApi(token, userId);
      const chatApi = createChatApi(token, userId);
      const profile = await studyProfileApi.createProfile(data);
      if (profile) {
        setStudyProfile(profile);
        setShowProfileModal(false);
        // Refresh chat context with new profile
        await chatApi.sendMessage('Hello! I am ready to help you study.');
      }
    } catch (error) {
      console.error('Error submitting study profile:', error);
      alert('Failed to save study profile. Please try again.');
    }
  };

  const renderContent = (): JSX.Element => {
    switch (currentPath) {
      case 'chat':
        return (
          <div className="chat-container">
            <div className="chat-history">
              {chatHistory.length === 0 ? (
                <div className="chat-welcome">
                  <h3>Welcome to Study Planner Assistant!</h3>
                  <p>Ask me anything about your studies, and I'll help you create an effective study plan.</p>
                </div>
              ) : (
                chatHistory.map((msg, index) => (
                  <div key={index} className={`chat-message ${msg.role}`}>
                    {msg.content}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="chat-message assistant">
                  <div className="loading">Thinking...</div>
                </div>
              )}
            </div>
            <form onSubmit={handleChatSubmit} className="chat-input-form">
              <input
                type="text"
                value={message}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                placeholder="Ask me anything about your studies..."
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading || !message.trim()}>
                Send
              </button>
            </form>
          </div>
        );
      case 'todo':
        return (
          <div className="todo-container">
            <div className="todo-header">
              <h2>Todo List</h2>
            </div>
            <form onSubmit={handleTodoSubmit} className="todo-form">
              <input
                type="text"
                className="todo-input"
                value={todoTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTodoTitle(e.target.value)}
                placeholder="Enter todo title..."
                required
              />
              <textarea
                className="todo-description"
                value={todoDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTodoDescription(e.target.value)}
                placeholder="Enter description..."
              />
              <button type="submit" className="timer-button">
                Add Todo
              </button>
            </form>
            <div className="todo-list">
              {todos.map((todo, index) => (
                <div key={index} className="todo-item">
                  <h3>{todo.title}</h3>
                  <p>{todo.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'timer':
        return (
          <div className="timer-container">
            <div className="timer-display">
              {formatTime(timeLeft)}
            </div>
            <div className="timer-controls">
              <button
                className="timer-button"
                onClick={() => setIsRunning(!isRunning)}
              >
                {isRunning ? 'Pause' : 'Start'}
              </button>
              <button
                className="timer-button"
                onClick={() => {
                  setIsRunning(false);
                  setTimeLeft(timerSettings.workTime * 60);
                  setIsBreak(false);
                  setIsLongBreak(false);
                }}
              >
                Reset
              </button>
            </div>
            <div className="timer-status">
              {isBreak ? (isLongBreak ? 'Long Break' : 'Break Time') : 'Work Time'}
            </div>
            <div className="pomodoro-count">
              Completed Pomodoros: {pomodoroCount}
            </div>
          </div>
        );
      case 'study-profile':
        return <Outlet />;
      default:
        return (
          <div className="chat-welcome">
            <h3>Welcome to Study Planner!</h3>
            <p>Select an option from the sidebar to get started.</p>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <h2>Study Planner</h2>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`sidebar-item ${activeSidebarItem === 'chat' ? 'active' : ''}`}
            onClick={() => handleSidebarItemClick('chat')}
          >
            Chat Assistant
          </button>
          <button
            className={`sidebar-item ${activeSidebarItem === 'todo' ? 'active' : ''}`}
            onClick={() => handleSidebarItemClick('todo')}
          >
            Todo List
          </button>
          <button
            className={`sidebar-item ${activeSidebarItem === 'timer' ? 'active' : ''}`}
            onClick={() => handleSidebarItemClick('timer')}
          >
            Pomodoro Timer
          </button>
          <button
            className={`sidebar-item ${activeSidebarItem === 'study-profile' ? 'active' : ''}`}
            onClick={() => handleSidebarItemClick('study-profile')}
          >
            Study Profile
          </button>
        </nav>
      </aside>

      <main className="main-content">
        {isLoaded ? (
          userId ? (
            renderContent()
          ) : (
            <div className="auth-message">
              <h3>Please sign in to access the study planner</h3>
            </div>
          )
        ) : (
          <div className="loading">Loading...</div>
        )}
      </main>

      <StudyProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSubmit={handleProfileSubmit}
      />
    </div>
  );
};

export default MainApp;