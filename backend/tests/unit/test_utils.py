"""
Unit tests for utility functions.
"""

import pytest
from unittest.mock import Mock, patch
from app.utils.pdf_processor import PDFProcessor
from app.utils.email_service import send_welcome_email, send_password_reset_email


class TestPDFProcessor:
    """Test cases for PDF processing utilities."""

    @pytest.mark.asyncio
    async def test_process_pdf_valid_file(self):
        """Test processing a valid PDF file."""
        # Mock file
        mock_file = Mock()
        mock_file.filename = "test.pdf"
        mock_file.read.return_value = b"PDF content"
        
        with patch.object(PDFProcessor, '_extract_text_from_pdf', return_value="Extracted text"):
            text, filename = await PDFProcessor.process_pdf(mock_file)
            
            assert text == "Extracted text"
            assert filename == "test.pdf"

    @pytest.mark.asyncio
    async def test_process_pdf_invalid_file_type(self):
        """Test processing a file with invalid type."""
        mock_file = Mock()
        mock_file.filename = "test.txt"
        
        with pytest.raises(Exception):
            await PDFProcessor.process_pdf(mock_file)

    @pytest.mark.asyncio
    async def test_process_pdf_empty_content(self):
        """Test processing a PDF with no text content."""
        mock_file = Mock()
        mock_file.filename = "test.pdf"
        mock_file.read.return_value = b"PDF content"
        
        with patch.object(PDFProcessor, '_extract_text_from_pdf', return_value=""):
            with pytest.raises(Exception):
                await PDFProcessor.process_pdf(mock_file)

    def test_extract_text_from_pdf(self):
        """Test text extraction from PDF bytes."""
        pdf_content = b"PDF content"
        
        with patch('PyPDF2.PdfReader') as mock_reader:
            mock_page = Mock()
            mock_page.extract_text.return_value = "Extracted text"
            mock_reader.return_value.pages = [mock_page]
            
            result = PDFProcessor._extract_text_from_pdf(pdf_content)
            assert result == "Extracted text\n"

    def test_validate_pdf_content(self):
        """Test PDF content validation."""
        # Valid content
        assert PDFProcessor.validate_pdf_content("Valid PDF content") is True
        
        # Empty content
        assert PDFProcessor.validate_pdf_content("") is False
        
        # Content with only whitespace
        assert PDFProcessor.validate_pdf_content("   \n\t   ") is False


class TestEmailService:
    """Test cases for email service utilities."""

    def test_send_welcome_email_success(self):
        """Test successful welcome email sending."""
        with patch('app.utils.email_service.logger') as mock_logger:
            result = send_welcome_email("test@example.com", "Test User")
            
            assert result is True
            mock_logger.info.assert_called_once()

    def test_send_welcome_email_failure(self):
        """Test welcome email sending failure."""
        with patch('app.utils.email_service.logger') as mock_logger:
            with patch('app.utils.email_service.logger.info', side_effect=Exception("Email error")):
                result = send_welcome_email("test@example.com", "Test User")
                
                assert result is False
                mock_logger.error.assert_called_once()

    def test_send_password_reset_email_success(self):
        """Test successful password reset email sending."""
        with patch('app.utils.email_service.logger') as mock_logger:
            result = send_password_reset_email("test@example.com", "reset_token_123")
            
            assert result is True
            mock_logger.info.assert_called()

    def test_send_password_reset_email_failure(self):
        """Test password reset email sending failure."""
        with patch('app.utils.email_service.logger') as mock_logger:
            with patch('app.utils.email_service.logger.info', side_effect=Exception("Email error")):
                result = send_password_reset_email("test@example.com", "reset_token_123")
                
                assert result is False
                mock_logger.error.assert_called_once() 