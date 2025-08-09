import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from '../../components/ui/FileUpload';

// Mock the API call - resumeAPI removed, using mock function instead
const mockUploadResume = jest.fn();
jest.mock('../../services/api/api', () => ({
  // resumeAPI removed - functionality moved to resume bank
}));

describe('FileUpload Component', () => {
  const mockOnUpload = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders file upload area', () => {
    render(
      <FileUpload
        onUpload={mockOnUpload}
        onError={mockOnError}
        acceptedFileTypes={['.pdf']}
        maxSize={10 * 1024 * 1024}
      />
    );

    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
    expect(screen.getByText(/or click to browse/i)).toBeInTheDocument();
  });

  it('accepts PDF files', () => {
    render(
      <FileUpload
        onUpload={mockOnUpload}
        onError={mockOnError}
        acceptedFileTypes={['.pdf']}
        maxSize={10 * 1024 * 1024}
      />
    );

    const fileInput = screen.getByTestId('file-input');
    expect(fileInput).toHaveAttribute('accept', '.pdf');
  });

  it('shows loading state during upload', async () => {
    // Mock implementation removed - functionality moved to resume bank
    // This test would need to be updated to work with the new resume bank flow

    render(
      <FileUpload
        onUpload={mockOnUpload}
        onError={mockOnError}
        acceptedFileTypes={['.pdf']}
        maxSize={10 * 1024 * 1024}
      />
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-input');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    });
  });

  it('calls onUpload when file is successfully uploaded', async () => {
    // Mock implementation removed - functionality moved to resume bank
    // This test would need to be updated to work with the new resume bank flow

    render(
      <FileUpload
        onUpload={mockOnUpload}
        onError={mockOnError}
        acceptedFileTypes={['.pdf']}
        maxSize={10 * 1024 * 1024}
      />
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-input');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith({ id: '123', status: 'completed' });
    });
  });

  it('calls onError when upload fails', async () => {
    // Mock implementation removed - functionality moved to resume bank
    // This test would need to be updated to work with the new resume bank flow

    render(
      <FileUpload
        onUpload={mockOnUpload}
        onError={mockOnError}
        acceptedFileTypes={['.pdf']}
        maxSize={10 * 1024 * 1024}
      />
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-input');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Upload failed');
    });
  });

  it('rejects files that are too large', async () => {
    render(
      <FileUpload
        onUpload={mockOnUpload}
        onError={mockOnError}
        acceptedFileTypes={['.pdf']}
        maxSize={1024} // 1KB limit
      />
    );

    // Create a file larger than 1KB
    const largeContent = 'x'.repeat(2000);
    const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-input');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(expect.stringContaining('too large'));
    });
  });

  it('rejects files with wrong type', async () => {
    render(
      <FileUpload
        onUpload={mockOnUpload}
        onError={mockOnError}
        acceptedFileTypes={['.pdf']}
        maxSize={10 * 1024 * 1024}
      />
    );

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByTestId('file-input');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(expect.stringContaining('file type'));
    });
  });
}); 