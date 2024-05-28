import { ContentCopy } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import React from 'react';

export type ClipboardCopyButtonProps = {
  text: string;
  className?: string;
};

export const ClipboardCopyButton: React.FC<ClipboardCopyButtonProps> = ({ text, className }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
  };
  return (
    <>
      <IconButton className={className} size="small">
        <ContentCopy onClick={copyToClipboard} />
      </IconButton>
    </>
  );
};
