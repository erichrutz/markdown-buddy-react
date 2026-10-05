import React from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Fade,
  Skeleton,
  Paper
} from '@mui/material';
import {
  FolderOpen,
  Article,
  Memory,
  PictureAsPdf,
  Refresh
} from '@mui/icons-material';

interface LoadingIndicatorProps {
  type?: 'circular' | 'linear' | 'skeleton';
  size?: 'small' | 'medium' | 'large';
  message?: string;
  progress?: number;
  fullScreen?: boolean;
  icon?: React.ReactNode;
  variant?: 'files' | 'markdown' | 'processing' | 'pdf' | 'refresh' | 'generic';
}

const getLoadingConfig = (variant?: string) => {
  switch (variant) {
    case 'files':
      return {
        icon: <FolderOpen />,
        message: 'Loading files...',
        color: 'primary' as const
      };
    case 'markdown':
      return {
        icon: <Article />,
        message: 'Processing markdown...',
        color: 'secondary' as const
      };
    case 'processing':
      return {
        icon: <Memory />,
        message: 'Processing content...',
        color: 'info' as const
      };
    case 'pdf':
      return {
        icon: <PictureAsPdf />,
        message: 'Generating PDF...',
        color: 'warning' as const
      };
    case 'refresh':
      return {
        icon: <Refresh />,
        message: 'Refreshing...',
        color: 'success' as const
      };
    default:
      return {
        icon: null,
        message: 'Loading...',
        color: 'primary' as const
      };
  }
};

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  type = 'circular',
  size = 'medium',
  message,
  progress,
  fullScreen = false,
  icon,
  variant = 'generic'
}) => {
  const config = getLoadingConfig(variant);
  const displayMessage = message || config.message;
  const displayIcon = icon || config.icon;

  const sizeProps = {
    small: { size: 24, fontSize: '0.875rem' },
    medium: { size: 40, fontSize: '1rem' },
    large: { size: 56, fontSize: '1.125rem' }
  }[size];

  const containerSx = fullScreen ? {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999
  } : {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    p: 3,
    minHeight: '120px'
  };

  if (type === 'skeleton') {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="40%" />
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="rectangular" height={200} />
        </Box>
      </Box>
    );
  }

  return (
    <Fade in timeout={300}>
      <Box sx={containerSx}>
        {fullScreen && (
          <Paper
            elevation={8}
            sx={{
              p: 4,
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: '320px',
              backgroundColor: 'background.paper'
            }}
          >
            <LoadingContent />
          </Paper>
        )}
        {!fullScreen && <LoadingContent />}
      </Box>
    </Fade>
  );

  function LoadingContent() {
    return (
      <>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          {displayIcon && (
            <Box
              sx={{
                color: `${config.color}.main`,
                display: 'flex',
                alignItems: 'center',
                fontSize: sizeProps.fontSize
              }}
            >
              {displayIcon}
            </Box>
          )}
          {type === 'circular' && (
            <CircularProgress
              size={sizeProps.size}
              color={config.color}
              variant={progress !== undefined ? 'determinate' : 'indeterminate'}
              value={progress}
            />
          )}
        </Box>

        {type === 'linear' && (
          <Box sx={{ width: '100%', mb: 2 }}>
            <LinearProgress
              color={config.color}
              variant={progress !== undefined ? 'determinate' : 'indeterminate'}
              value={progress}
            />
          </Box>
        )}

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: sizeProps.fontSize, textAlign: 'center' }}
        >
          {displayMessage}
        </Typography>

        {progress !== undefined && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, fontSize: '0.75rem' }}
          >
            {Math.round(progress)}%
          </Typography>
        )}
      </>
    );
  }
};

// Progress bar for operations with multiple steps
interface ProgressStepsProps {
  steps: string[];
  currentStep: number;
  completedSteps?: number[];
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  steps,
  currentStep,
  completedSteps = []
}) => {
  return (
    <Box sx={{ width: '100%', maxWidth: 400 }}>
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index);
        const isCurrent = index === currentStep;
        const isUpcoming = index > currentStep;

        return (
          <Box key={step} sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: isCompleted
                    ? 'success.main'
                    : isCurrent
                    ? 'primary.main'
                    : 'grey.300',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}
              >
                {isCompleted ? '✓' : index + 1}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: isCompleted
                    ? 'success.main'
                    : isCurrent
                    ? 'primary.main'
                    : isUpcoming
                    ? 'text.secondary'
                    : 'text.primary',
                  fontWeight: isCurrent ? 600 : 400
                }}
              >
                {step}
              </Typography>
            </Box>
            {isCurrent && (
              <LinearProgress
                sx={{ ml: 3, width: 'calc(100% - 24px)', height: 2 }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
};

// Inline loading state for buttons and small components
interface InlineLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  size?: 'small' | 'medium';
  color?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  loading,
  children,
  size = 'small',
  color = 'inherit'
}) => {
  if (!loading) return <>{children}</>;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <CircularProgress
        size={size === 'small' ? 16 : 20}
        sx={{ color }}
      />
      {children}
    </Box>
  );
};