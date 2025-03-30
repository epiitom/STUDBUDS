import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Alert, 
  CircularProgress, 
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Chip,
  Slider,
  Button,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { createStudyProfileApi, createStudyTipsApi, StudyTip, APIError } from '../lib/api';
import StudyTips from '../components/StudyTips';

export default function StudyProfilePage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentTip, setCurrentTip] = useState<StudyTip | null>(null);
  const [tips, setTips] = useState<StudyTip[]>([]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await getToken();
        setToken(token || null);
        setUserId(user?.id || null);
      } catch (error) {
        console.error('Error getting token:', error);
        navigate('/');
      }
    };

    if (user) {
      initializeAuth();
    }
  }, [user, getToken, navigate]);

  useEffect(() => {
    if (token && userId) {
      loadTips();
    }
  }, [token, userId]);

  const loadTips = async () => {
    if (!token || !userId) return;
    
    try {
      setError(null);
      const studyTipsApi = createStudyTipsApi(token, userId);
      const data = await studyTipsApi.getTips();
      if (data) {
        setTips(data);
      }
    } catch (error) {
      console.error('Error loading study tips:', error);
      if (error instanceof APIError) {
        setError(error.message);
      } else {
        setError('Failed to load study tips. Please try again.');
      }
    }
  };

  const handleProfileSubmit = async (data: {
    subjects: string[];
    challenges: string[];
    vibe: number;
  }) => {
    if (!user || !token || !userId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const studyProfileApi = createStudyProfileApi(token, userId);
      const studyTipsApi = createStudyTipsApi(token, userId);
      
      // First try to get existing profile
      const existingProfile = await studyProfileApi.getProfile();
      
      let profile;
      if (existingProfile) {
        // If profile exists, update it
        profile = await studyProfileApi.updateProfile(data);
      } else {
        // If no profile exists, create new one
        profile = await studyProfileApi.createProfile(data);
      }

      if (profile) {
        setProfileId(profile.id);
        // Generate a new study tip based on the profile data
        const tip = await studyTipsApi.generateTip(data);
        setCurrentTip(tip);
        setTips(prevTips => [tip, ...prevTips]);

        // Show success message
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error submitting profile:', error);
      if (error instanceof APIError) {
        setError(error.message);
      } else {
        setError('Failed to submit profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Study Profile
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {showSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Profile updated successfully!
          </Alert>
        )}

        {isLoading ? (
          <CircularProgress />
        ) : (
          <StudyProfileForm
            onSubmit={handleProfileSubmit}
            initialData={{ subjects: [], challenges: [], vibe: 5 }}
            isLoading={isLoading}
          />
        )}

        {currentTip && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Your Personalized Study Tip
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Typography>{currentTip.content}</Typography>
            </Paper>
          </Box>
        )}
      </Box>
    </Container>
  );
}

interface StudyProfileFormProps {
  onSubmit: (data: {
    subjects: string[];
    challenges: string[];
    vibe: number;
  }) => void;
  initialData: {
    subjects: string[];
    challenges: string[];
    vibe: number;
  };
  isLoading: boolean;
}

function StudyProfileForm({ onSubmit, initialData, isLoading }: StudyProfileFormProps) {
  const [subjects, setSubjects] = useState<string[]>(initialData.subjects);
  const [challenges, setChallenges] = useState<string[]>(initialData.challenges);
  const [vibeLevel, setVibeLevel] = useState(initialData.vibe);
  const [newSubject, setNewSubject] = useState('');
  const [newChallenge, setNewChallenge] = useState('');

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling up
    if (newSubject.trim() && !subjects.includes(newSubject.trim())) {
      setSubjects([...subjects, newSubject.trim()]);
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (subject: string) => {
    setSubjects(subjects.filter(s => s !== subject));
  };

  const handleAddChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling up
    if (newChallenge.trim() && !challenges.includes(newChallenge.trim())) {
      setChallenges([...challenges, newChallenge.trim()]);
      setNewChallenge('');
    }
  };

  const handleRemoveChallenge = (challenge: string) => {
    setChallenges(challenges.filter(c => c !== challenge));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting profile with data:', { subjects, challenges, vibe: vibeLevel });
    onSubmit({
      subjects,
      challenges,
      vibe: vibeLevel
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card sx={{ mb: 4, p: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Subjects
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add the subjects you're currently studying
          </Typography>
          
          <Box component="div" sx={{ display: 'flex', mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="Enter a subject (e.g., Mathematics, Physics)"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              sx={{ mr: 1 }}
            />
            <Button 
              type="button"
              variant="contained" 
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddSubject}
            >
              Add
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {subjects.map((subject, index) => (
              <Chip
                key={index}
                label={subject}
                color="primary"
                onDelete={() => handleRemoveSubject(subject)}
                deleteIcon={<DeleteIcon />}
              />
            ))}
            {subjects.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No subjects added yet
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 4, p: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Challenges
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add the study challenges you're facing
          </Typography>
          
          <Box component="div" sx={{ display: 'flex', mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="Enter a challenge (e.g., Time Management, Focus Issues)"
              value={newChallenge}
              onChange={(e) => setNewChallenge(e.target.value)}
              sx={{ mr: 1 }}
            />
            <Button 
              type="button"
              variant="contained" 
              color="secondary"
              startIcon={<AddIcon />}
              onClick={handleAddChallenge}
            >
              Add
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {challenges.map((challenge, index) => (
              <Chip
                key={index}
                label={challenge}
                color="secondary"
                onDelete={() => handleRemoveChallenge(challenge)}
                deleteIcon={<DeleteIcon />}
              />
            ))}
            {challenges.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No challenges added yet
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 4, p: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            How's Your Vibe?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Let us know your current motivation level
          </Typography>
          
          <Slider
            value={vibeLevel}
            onChange={(_, value) => setVibeLevel(value as number)}
            min={1}
            max={10}
            marks
            valueLabelDisplay="auto"
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Meh</Typography>
            <Typography variant="body1" color="primary.main" fontWeight="bold">
              {vibeLevel <= 2 ? 'Meh' :
               vibeLevel <= 4 ? 'Okay' :
               vibeLevel <= 6 ? 'Good' :
               vibeLevel <= 8 ? 'Great' : 'Super Motivated'}
            </Typography>
            <Typography variant="body2" color="text.secondary">Super Motivated</Typography>
          </Box>
        </CardContent>
      </Card>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={isLoading}
        fullWidth
        size="large"
        sx={{ py: 1.5 }}
      >
        {isLoading ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  );
}