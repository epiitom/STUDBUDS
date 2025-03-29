import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import StudyProfileModal from '../components/StudyProfileModal';
import { createStudyProfileApi, createStudyTipsApi } from '../lib/api';

interface StudyProfile {
  _id: string;
  subjects: string[];
  challenges: string[];
  vibe: number;
}

const StudyProfilePage: React.FC = () => {
  const { getToken, userId } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StudyProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studyTip, setStudyTip] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getToken();
        if (!token || !userId) {
          navigate('/');
          return;
        }

        const studyProfileApi = createStudyProfileApi(token, userId);
        const data = await studyProfileApi.getProfile();
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [getToken, userId, navigate]);

  const handleProfileSubmit = async (profileData: any) => {
    try {
      const token = await getToken();
      if (!token || !userId) {
        navigate('/');
        return;
      }

      const studyProfileApi = createStudyProfileApi(token, userId);
      const studyTipsApi = createStudyTipsApi(token, userId);

      let profileId = profile?._id;
      if (!profileId) {
        const newProfile = await studyProfileApi.createProfile(profileData);
        profileId = newProfile._id;
        setProfile(newProfile);
      } else {
        await studyProfileApi.updateProfile(profileData);
        setProfile(prev => prev ? { ...prev, ...profileData } : null);
      }

      // Generate new study tip
      const tip = await studyTipsApi.generateTip({
        vibe: profileData.vibe,
        subjects: profileData.subjects,
        challenges: profileData.challenges
      });
      setStudyTip(tip);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile');
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Study Profile
        </Typography>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => setIsModalOpen(true)}
        >
          Edit Profile
        </Button>
      </Box>

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Subjects
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profile?.subjects.map((subject, index) => (
                  <Chip 
                    key={index} 
                    label={subject} 
                    color="primary" 
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Challenges
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profile?.challenges.map((challenge, index) => (
                  <Chip 
                    key={index} 
                    label={challenge} 
                    color="secondary" 
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {studyTip && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Personalized Study Tip
                </Typography>
                <Typography variant="body1">
                  {studyTip}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <StudyProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleProfileSubmit}
      />
    </Container>
  );
};

export default StudyProfilePage; 