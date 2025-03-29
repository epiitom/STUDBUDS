import React from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';

interface StudyTip {
  id: string;
  content: string;
  generated_at: string;
  based_on_vibe: string;
  based_on_subjects: string[];
  based_on_challenges: string[];
}

interface StudyTipsProps {
  tips: StudyTip[];
  isLoading: boolean;
}

const StudyTips: React.FC<StudyTipsProps> = ({ tips, isLoading }) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (tips.length === 0) {
    return (
      <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          No Study Tips Yet
        </Typography>
        <Typography color="text.secondary">
          Fill out your study profile and get personalized study tips!
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      {tips.map((tip) => (
        <Paper key={tip.id} elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Personalized Study Tip
          </Typography>
          <Typography paragraph>
            {tip.content}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Based on your vibe: {tip.based_on_vibe}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Generated on: {new Date(tip.generated_at).toLocaleString()}
            </Typography>
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default StudyTips;