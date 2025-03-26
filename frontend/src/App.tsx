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
  id: number;
  text: string;
  completed: boolean;
}

function App() {
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
  const [formData, setFormData] = useState({
    examDate: '',
    subjects: '',
    classLevel: '',
    studyPreferences: ''
  });
  const [formMessage, setFormMessage] = useState('');

  // Todo List States
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState('');

  // Timer States
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [timerSettings, setTimerSettings] = useState({
    workTime: 25,
    breakTime: 5,
    longBreakTime: 15
  });
  const [isBreak, setIsBreak] = useState(false);
  const [isLongBreak, setIsLongBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  useEffect(() => {
    checkApiHealth();
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
      setPomodoroCount(prev => prev + 1);
      if (pomodoroCount % 4 === 3) {
        setIsLongBreak(true);
        setTimeLeft(timerSettings.longBreakTime * 60);
      } else {
        setIsBreak(true);
        setTimeLeft(timerSettings.breakTime * 60);
      }
    } else {
      setIsBreak(false);
      setIsLongBreak(false);
      setTimeLeft(timerSettings.workTime * 60);
    }
    // Play notification sound
    new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleTodoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const newItem: TodoItem = {
      id: Date.now(),
      text: newTodo.trim(),
      completed: false
    };

    setTodos(prev => [...prev, newItem]);
    setNewTodo('');
  };

  const toggleTodo = (id: number) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
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

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage('');

    try {
      const response = await fetch('http://localhost:8000/study-plans/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exam_date: formData.examDate,
          subjects: formData.subjects.split(',').map(s => s.trim()),
          class_level: formData.classLevel,
          study_preferences: JSON.parse(formData.studyPreferences || '{}')
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create study plan');
      }

      setFormMessage('Study plan created successfully!');
      setFormData({
        examDate: '',
        subjects: '',
        classLevel: '',
        studyPreferences: ''
      });
    } catch (error) {
      console.error('Error creating study plan:', error);
      setFormMessage('Failed to create study plan. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
              <h2>To-Do List</h2>
            </div>
            <form onSubmit={handleTodoSubmit} className="todo-form">
              <input
                type="text"
                className="todo-input"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Add a new task..."
              />
              <button type="submit" className="timer-button">
                Add
              </button>
            </form>
            <div className="todo-list">
              {todos.map(todo => (
                <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                  <input
                    type="checkbox"
                    className="todo-checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                  />
                  <span className="todo-text">{todo.text}</span>
                  <button
                    className="todo-delete"
                    onClick={() => deleteTodo(todo.id)}
                  >
                    ×
                  </button>
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
            <div className="timer-settings">
              <div className="timer-label">
                <span>Work Time (min)</span>
                <input
                  type="number"
                  className="timer-input"
                  value={timerSettings.workTime}
                  onChange={(e) => setTimerSettings(prev => ({
                    ...prev,
                    workTime: Math.max(1, Math.min(60, parseInt(e.target.value) || 25))
                  }))}
                />
              </div>
              <div className="timer-label">
                <span>Break Time (min)</span>
                <input
                  type="number"
                  className="timer-input"
                  value={timerSettings.breakTime}
                  onChange={(e) => setTimerSettings(prev => ({
                    ...prev,
                    breakTime: Math.max(1, Math.min(30, parseInt(e.target.value) || 5))
                  }))}
                />
              </div>
              <div className="timer-label">
                <span>Long Break (min)</span>
                <input
                  type="number"
                  className="timer-input"
                  value={timerSettings.longBreakTime}
                  onChange={(e) => setTimerSettings(prev => ({
                    ...prev,
                    longBreakTime: Math.max(1, Math.min(60, parseInt(e.target.value) || 15))
                  }))}
                />
              </div>
            </div>
            <div className="timer-status">
              {isBreak ? 'Break Time' : isLongBreak ? 'Long Break' : 'Work Time'}
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
          To-Do List
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

export default App;