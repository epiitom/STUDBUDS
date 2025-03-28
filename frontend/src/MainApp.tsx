import { useState, useEffect } from 'react';
import './App.css';

interface ApiStatus {
  status: string;
  database: string;
  gemini_api: string;
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

function MainApp() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    status: 'checking',
    database: 'checking',
    gemini_api: 'checking'
  });
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState('chat');
  const [activeNavItem, setActiveNavItem] = useState('home');
  
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
  const timerSettings = {
    workTime: 25,
    breakTime: 5,
    longBreakTime: 15
  };

  useEffect(() => {
    checkApiHealth();
    fetchTodos();
  }, []);

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

  const handleTimerComplete = () => {
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

  const checkApiHealth = async () => {
    try {
      const response = await fetch('http://localhost:8000/health');
      const data = await response.json();
      setApiStatus(data);
    } catch (error) {
      console.error('Error checking API health:', error);
      setApiStatus({
        status: 'unhealthy',
        database: 'unhealthy',
        gemini_api: 'unhealthy'
      });
    }
  };

  const fetchTodos = async () => {
    try {
      const response = await fetch('http://localhost:8000/todolists/');
      if (!response.ok) throw new Error('Failed to fetch todos');
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  const handleTodoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoTitle.trim()) return;

    try {
      const response = await fetch('http://localhost:8000/todolists/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: todoTitle,
          description: todoDescription
        }),
      });

      if (!response.ok) throw new Error('Failed to create todo');
      
      // Clear form and refresh todos
      setTodoTitle('');
      setTodoDescription('');
      await fetchTodos();
    } catch (error) {
      console.error('Error creating todo:', error);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('http://localhost:8000/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderContent = () => {
    switch (activeSidebarItem) {
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
                onChange={(e) => setMessage(e.target.value)}
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
                onChange={(e) => setTodoTitle(e.target.value)}
                placeholder="Enter todo title..."
                required
              />
              <textarea
                className="todo-description"
                value={todoDescription}
                onChange={(e) => setTodoDescription(e.target.value)}
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
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <a href="#" className="nav-logo">Study Planner</a>
        <div className="nav-links">
          <a
            href="#"
            className={`nav-link ${activeNavItem === 'home' ? 'active' : ''}`}
            onClick={() => setActiveNavItem('home')}
          >
            Home
          </a>
          <a
            href="#"
            className={`nav-link ${activeNavItem === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveNavItem('profile')}
          >
            Profile
          </a>
        </div>
      </nav>

      <aside className="sidebar">
        <a
          href="#"
          className={`sidebar-item ${activeSidebarItem === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveSidebarItem('chat')}
        >
          <span>💬</span>
          Chat Assistant
        </a>
        <a
          href="#"
          className={`sidebar-item ${activeSidebarItem === 'todo' ? 'active' : ''}`}
          onClick={() => setActiveSidebarItem('todo')}
        >
          <span>📝</span>
          Todo List
        </a>
        <a
          href="#"
          className={`sidebar-item ${activeSidebarItem === 'timer' ? 'active' : ''}`}
          onClick={() => setActiveSidebarItem('timer')}
        >
          <span>⏱️</span>
          Study Timer
        </a>
      </aside>

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default MainApp;