import React, { useState } from 'react';
import { X } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  IconButton, 
  Typography,
  Box,
  Paper
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { createStudyProfileApi } from '../lib/api';

interface StudyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (profile: any) => void;
}

const StudyProfileModal: React.FC<StudyProfileModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [subjects, setSubjects] = useState<string[]>(['']);
  const [challenges, setChallenges] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubjectChange = (index: number, value: string) => {
    const newSubjects = [...subjects];
    newSubjects[index] = value;
    setSubjects(newSubjects);
  };

  const handleChallengeChange = (index: number, value: string) => {
    const newChallenges = [...challenges];
    newChallenges[index] = value;
    setChallenges(newChallenges);
  };

  const addSubject = () => {
    setSubjects([...subjects, '']);
  };

  const addChallenge = () => {
    setChallenges([...challenges, '']);
  };

  const removeSubject = (index: number) => {
    const newSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(newSubjects);
  };

  const removeChallenge = (index: number) => {
    const newChallenges = challenges.filter((_, i) => i !== index);
    setChallenges(newChallenges);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      const profileData = {
        subjects: subjects.filter(s => s.trim() !== ''),
        challenges: challenges.filter(c => c.trim() !== ''),
        vibe: 5 // Default value since we're not using the slider anymore
      };
      
      try {
        setIsSubmitting(true);
        await onSubmit(profileData);
        setIsSubmitting(false);
        onClose();
      } catch (error) {
        console.error('Error submitting study profile:', error);
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
    >
      <Paper
        elevation={3}
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 2,
          p: 4,
          width: '90%',
          maxWidth: 800,
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16
          }}
        >
          <X size={24} />
        </IconButton>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Welcome to StudyBuds!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Let's personalize your study experience
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                What subjects are you studying?
              </Typography>
              {subjects.map((subject, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    value={subject}
                    onChange={(e) => handleSubjectChange(index, e.target.value)}
                    placeholder="Enter a subject"
                    variant="outlined"
                    size="small"
                  />
                  <IconButton 
                    onClick={() => removeSubject(index)}
                    color="error"
                    disabled={subjects.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={addSubject}
                sx={{ mt: 1 }}
              >
                Add Subject
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                What are your study challenges?
              </Typography>
              {challenges.map((challenge, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    value={challenge}
                    onChange={(e) => handleChallengeChange(index, e.target.value)}
                    placeholder="Enter a challenge"
                    variant="outlined"
                    size="small"
                  />
                  <IconButton 
                    onClick={() => removeChallenge(index)}
                    color="error"
                    disabled={challenges.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={addChallenge}
                sx={{ mt: 1 }}
              >
                Add Challenge
              </Button>
            </CardContent>
          </Card>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting}
            sx={{ mt: 2 }}
          >
            {isSubmitting ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default StudyProfileModal; 