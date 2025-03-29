import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ErrorResponse {
  detail?: string;
  message?: string;
}

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Helper function to handle API errors
function handleError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>;
    const errorMessage = axiosError.response?.data?.detail || 
                        axiosError.response?.data?.message || 
                        axiosError.message;
    throw new APIError(
      errorMessage,
      axiosError.response?.status,
      axiosError.code
    );
  }
  throw error;
}

export interface StudyProfileData {
  subjects: string[];
  challenges: string[];
  vibe: number;
}

export interface StudyTip {
  id: string;
  content: string;
  generated_at: string;
  based_on_vibe: string;
  based_on_subjects: string[];
  based_on_challenges: string[];
}

export interface StudyTipRequest {
  vibe: number;
  subjects: string[];
  challenges: string[];
}

export interface TodoItem {
  title: string;
  description: string;
  completed: boolean;
}

// Create axios instance with default config
const createApi = (token: string | null, userId: string | null) => {
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(userId ? { 'User-ID': userId } : {})
    },
  });

  // Add response interceptor for error handling
  api.interceptors.response.use(
    response => response,
    error => {
      // Log errors in development
      if (import.meta.env.DEV) {
        console.error('API Error:', error);
      }
      return Promise.reject(error);
    }
  );

  return api;
};

// Helper function to convert numeric vibe to string level
function getVibeLevel(vibe: number): string {
  if (vibe <= 2) return 'meh';
  if (vibe <= 4) return 'okay';
  if (vibe <= 6) return 'good';
  if (vibe <= 8) return 'great';
  return 'super_motivated';
}

export const createStudyProfileApi = (token: string | null, userId: string | null) => {
  const api = createApi(token, userId);

  return {
    createProfile: async (data: StudyProfileData) => {
      try {
        // Format the data according to the API expectations
        const formattedData = {
          subjects: data.subjects.map(subject => ({
            name: subject,
            description: null
          })),
          challenges: data.challenges.map(challenge => ({
            description: challenge
          })),
          current_vibe: getVibeLevel(data.vibe)
        };

        console.log('Sending profile data:', formattedData); // Debug log
        const response = await api.post('/study-profile/', formattedData);
        return response.data;
      } catch (error) {
        console.error('Error creating study profile:', error);
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<ErrorResponse>;
          const response = axiosError.response?.data;
          let errorMessage = 'Failed to create study profile';
          
          if (response) {
            if (typeof response.detail === 'string') {
              errorMessage = response.detail;
            } else if (typeof response.detail === 'object' && response.detail !== null) {
              const detail = response.detail as Record<string, string[]>;
              const errors = Object.entries(detail)
                .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                .join('\n');
              errorMessage = `Validation Error:\n${errors}`;
            } else if (response.message) {
              errorMessage = response.message;
            }
          }
          throw new APIError(errorMessage, axiosError.response?.status);
        }
        throw error;
      }
    },

    updateProfile: async (data: StudyProfileData) => {
      try {
        const formattedData = {
          subjects: data.subjects.map(subject => ({
            name: subject,
            description: null
          })),
          challenges: data.challenges.map(challenge => ({
            description: challenge
          })),
          current_vibe: getVibeLevel(data.vibe)
        };

        const response = await api.put('/study-profile/', formattedData);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    getProfile: async () => {
      try {
        const response = await api.get('/study-profile/');
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    updateVibe: async (vibe: number) => {
      try {
        const response = await api.put('/study-profile/vibe', { vibe: getVibeLevel(vibe) });
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    addSubject: async (subject: string) => {
      try {
        const response = await api.post('/study-profile/subjects/', { 
          name: subject,
          description: null
        });
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    addChallenge: async (challenge: string) => {
      try {
        const response = await api.post('/study-profile/challenges/', { 
          description: challenge 
        });
        return response.data;
      } catch (error) {
        handleError(error);
      }
    }
  };
};

export const createStudyTipsApi = (token: string | null, userId: string | null) => {
  const api = createApi(token, userId);

  return {
    generateTip: async (data: StudyTipRequest) => {
      try {
        const response = await api.post('/study-tips/generate/', data);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    getTips: async () => {
      try {
        const response = await api.get('/study-tips/');
        return response.data;
      } catch (error) {
        handleError(error);
      }
    }
  };
};

export const createChatApi = (token: string | null, userId: string | null) => {
  const api = createApi(token, userId);

  return {
    sendMessage: async (message: string, context?: {
      vibe?: string;
      subjects?: string[];
      challenges?: string[];
    }) => {
      try {
        const response = await api.post('/chat/', { 
          message,
          context
        });
        return response.data;
      } catch (error) {
        handleError(error);
      }
    }
  };
};

export const createTodoApi = (token: string | null, userId: string | null) => {
  const api = createApi(token, userId);

  return {
    createTodo: async (data: TodoItem) => {
      try {
        const response = await api.post('/todolists/', {
          ...data,
          user_id: userId
        });
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    getTodos: async () => {
      try {
        const response = await api.get('/todolists/');
        return response.data;
      } catch (error) {
        handleError(error);
      }
    }
  };
}; 