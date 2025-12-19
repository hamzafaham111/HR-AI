"""
API endpoints for meeting and scheduling functionality.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import json

from app.services.meeting_service import MeetingService
from app.models.mongodb_models import MeetingStatus, SlotSelectionType, MeetingType
from app.api.auth import get_current_user
from app.models.mongodb_models import UserDocument
from app.core.dependencies import get_meeting_service
from app.core.database import get_database

router = APIRouter()

# Protected routes (require authentication)
# Create a request model for meeting creation
class CreateMeetingRequest(BaseModel):
    title: str
    description: Optional[str] = None
    duration: int = 30
    meeting_type: str = "meeting"
    timezone: str = "UTC"
    max_participants: int = 1
    is_public: bool = False
    requires_approval: bool = False
    allow_cancellation: bool = True
    start_date: str  # Will be converted to date
    end_date: str    # Will be converted to date
    buffer_time_before: int = 0
    buffer_time_after: int = 0

@router.post("/")
async def create_meeting(
    meeting_data: CreateMeetingRequest,
    current_user = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Create a new meeting with time slots."""
    try:
        # Convert string dates to datetime objects
        from datetime import datetime
        start_date_obj = datetime.strptime(meeting_data.start_date, "%Y-%m-%d").date()
        end_date_obj = datetime.strptime(meeting_data.end_date, "%Y-%m-%d").date()
        
        start_datetime = datetime.combine(start_date_obj, datetime.min.time())
        end_datetime = datetime.combine(end_date_obj, datetime.min.time())
        
        # Validate meeting_type
        try:
            meeting_type_enum = MeetingType(meeting_data.meeting_type.lower())
        except ValueError:
            meeting_type_enum = MeetingType.MEETING
        
        # Create meeting data
        meeting_data_dict = {
            'title': meeting_data.title,
            'description': meeting_data.description,
            'user_id': current_user.id,  # Access the id attribute of UserDocument
            'duration': meeting_data.duration,
            'meeting_type': meeting_type_enum,
            'timezone': meeting_data.timezone,
            'slot_selection_type': SlotSelectionType.SINGLE,
            'max_participants': meeting_data.max_participants,
            'allow_guest_booking': meeting_data.is_public,  # Map is_public to allow_guest_booking
            'require_approval': meeting_data.requires_approval,  # Map requires_approval to require_approval
            'start_date': start_datetime,
            'end_date': end_datetime,
            'buffer_time_before': meeting_data.buffer_time_before,
            'buffer_time_after': meeting_data.buffer_time_after,
            'is_public': meeting_data.is_public,
            'requires_approval': meeting_data.requires_approval,
            'allow_cancellation': meeting_data.allow_cancellation,
            'status': MeetingStatus.DRAFT
        }
        
        # Create meeting
        meeting = await meeting_service.create_meeting(meeting_data_dict)
        
        return {
            "success": True,
            "message": "Meeting created successfully",
            "data": {
                "meeting_id": str(meeting.id),
                "public_link": getattr(meeting, 'public_link', None)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create meeting: {str(e)}"
        )

@router.get("/")
async def get_my_meetings(
    current_user = Depends(get_current_user),
    database = Depends(get_database)
):
    """Get all meetings organized by the current user."""
    try:
        # Create repository and service locally like the resume bank API
        repository = MeetingRepository(database)
        meeting_service = MeetingService(repository)
        
        meetings = await meeting_service.get_meetings_by_user(current_user.id)
        
        formatted_meetings = []
        for meeting in meetings:
            try:
                # Safely handle status parsing
                if hasattr(meeting, 'status'):
                    if hasattr(meeting.status, 'value'):
                        status_value = meeting.status.value
                    else:
                        status_value = str(meeting.status)
                else:
                    status_value = "unknown"
                
                # Safely handle other fields
                meeting_link = getattr(meeting, 'public_link', None)
                duration = getattr(meeting, 'duration', 30)
                created_at = meeting.created_at.isoformat() if meeting.created_at else None
                
                # Calculate actual booking count
                booking_count = await meeting_service.get_meeting_bookings_count(str(meeting.id))
                
                formatted_meetings.append({
                    "id": str(meeting.id),
                    "title": meeting.title,
                    "description": meeting.description,
                    "meeting_link": meeting_link,
                    "duration_minutes": duration,
                    "status": status_value,
                    "created_at": created_at,
                    "total_bookings": booking_count
                })
            except Exception as e:
                # Log error and continue with other meetings
                continue
        
        return {
            "success": True,
            "data": formatted_meetings
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch meetings: {str(e)}"
        )

@router.get("/{meeting_id}")
async def get_meeting_details(
    meeting_id: str,
    current_user = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Get detailed information about a specific meeting."""
    try:
        # Get meeting by ID
        meeting = await meeting_service.get_meeting_by_id(meeting_id)
        
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting not found"
            )
        
        # Check if user is the organizer
        if meeting.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Get all slots and bookings for this meeting
        all_slots = await meeting_service.get_all_slots_for_meeting(meeting_id)
        bookings = await meeting_service.get_meeting_bookings(meeting_id)
        
        # Format slots data
        formatted_slots = []
        for slot in all_slots:
            # Find booking for this slot
            slot_booking = next((b for b in bookings if str(b.slot_id) == str(slot.id)), None)
            
            formatted_slots.append({
                "id": str(slot.id),
                "start_time": slot.start_time.isoformat(),
                "end_time": slot.end_time.isoformat(),
                "is_available": not slot.is_booked,
                "is_booked": slot.is_booked,
                "formatted_time": f"{slot.start_time.strftime('%I:%M %p')} - {slot.end_time.strftime('%I:%M %p')}",
                "formatted_date": slot.start_time.strftime('%B %d, %Y'),
                "booking": {
                    "id": str(slot_booking.id),
                    "participant_name": slot_booking.participant_name,
                    "participant_email": slot_booking.participant_email,
                    "participant_phone": slot_booking.participant_phone,
                    "status": slot_booking.status,
                    "created_at": slot_booking.created_at.isoformat()
                } if slot_booking else None
            })
        
        # Format bookings data
        formatted_bookings = []
        for booking in bookings:
            formatted_bookings.append({
                "id": str(booking.id),
                "participant_name": booking.participant_name,
                "participant_email": booking.participant_email,
                "participant_phone": booking.participant_phone,
                "notes": booking.notes,
                "status": booking.status,
                "created_at": booking.created_at.isoformat(),
                "updated_at": booking.updated_at.isoformat()
            })
        
        # Return meeting details with slots and bookings
        return {
            "success": True,
            "data": {
                "id": str(meeting.id),
                "title": meeting.title,
                "description": meeting.description,
                "meeting_type": meeting.meeting_type.value if hasattr(meeting.meeting_type, 'value') else str(meeting.meeting_type),
                "duration": meeting.duration,
                "timezone": meeting.timezone,
                "status": meeting.status.value if hasattr(meeting.status, 'value') else str(meeting.status),
                "start_date": meeting.start_date.isoformat() if meeting.start_date else None,
                "end_date": meeting.end_date.isoformat() if meeting.end_date else None,
                "max_participants": meeting.max_participants,
                "is_public": meeting.is_public,
                "public_link": meeting.public_link,
                "requires_approval": meeting.requires_approval,
                "allow_cancellation": meeting.allow_cancellation,
                "buffer_time_before": meeting.buffer_time_before,
                "buffer_time_after": meeting.buffer_time_after,
                "created_at": meeting.created_at.isoformat() if meeting.created_at else None,
                "updated_at": meeting.updated_at.isoformat() if meeting.updated_at else None,
                "slots": formatted_slots,
                "bookings": formatted_bookings
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch meeting details: {str(e)}"
        )

@router.put("/{meeting_id}")
async def update_meeting(
    meeting_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    duration: Optional[int] = None,
    timezone: Optional[str] = None,
    max_participants: Optional[int] = None,
    allow_guest_booking: Optional[bool] = None,
    require_approval: Optional[bool] = None,
    current_user = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Update meeting details."""
    try:
        # Check if user is the organizer
        meeting = await meeting_service.get_meeting_by_id(meeting_id)
        
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting not found"
            )
        
        if meeting.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Prepare update data
        update_data = {}
        if title is not None:
            update_data['title'] = title
        if description is not None:
            update_data['description'] = description
        if duration is not None:
            update_data['duration'] = duration
        if timezone is not None:
            update_data['timezone'] = timezone
        if max_participants is not None:
            update_data['max_participants'] = max_participants
        if allow_guest_booking is not None:
            update_data['allow_guest_booking'] = allow_guest_booking
        if require_approval is not None:
            update_data['require_approval'] = require_approval
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        # Update meeting
        updated_meeting = await meeting_service.update_meeting(meeting_id, update_data)
        
        return {
            "success": True,
            "message": "Meeting updated successfully",
            "data": {
                "id": updated_meeting.id,
                "title": updated_meeting.title,
                "updated_at": updated_meeting.updated_at.isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update meeting: {str(e)}"
        )

# New workflow endpoints
@router.post("/{meeting_id}/open")
async def open_meeting(
    meeting_id: str,
    current_user = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Open a draft meeting to make it publicly bookable."""
    try:
        # Get meeting by ID
        meeting = await meeting_service.get_meeting_by_id(meeting_id)
        
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting not found"
            )
        
        # Check if user is the organizer
        if meeting.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Check if meeting is in draft status
        if meeting.status != MeetingStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft meetings can be opened"
            )
        
        # Open the meeting
        updated_meeting = await meeting_service.open_meeting(meeting_id)
        
        if not updated_meeting:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to open meeting"
            )
        
        return {
            "success": True,
            "message": "Meeting opened successfully",
            "data": {
                "meeting_id": str(updated_meeting.id),
                "status": updated_meeting.status.value,
                "public_link": getattr(updated_meeting, 'public_link', None)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to open meeting: {str(e)}"
        )

@router.post("/bookings/{booking_id}/approve")
async def approve_booking(
    booking_id: str,
    current_user: UserDocument = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Approve a pending booking."""
    try:
        booking = await meeting_service.meeting_repository.get_booking_by_id(booking_id)
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
        
        meeting = await meeting_service.get_meeting_by_id(str(booking.meeting_id))
        if str(meeting.user_id) != str(current_user.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        updated_booking = await meeting_service.approve_booking(booking_id)
        if not updated_booking:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Booking cannot be approved")
        
        return {
            "success": True,
            "message": "Booking approved successfully",
            "data": {
                "booking_id": str(updated_booking.id),
                "status": updated_booking.status.value,
                "meeting_id": str(updated_booking.meeting_id)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to approve booking: {str(e)}")

@router.post("/bookings/{booking_id}/reject")
async def reject_booking(
    booking_id: str,
    reason: Optional[str] = None,
    current_user: UserDocument = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Reject a pending booking."""
    try:
        booking = await meeting_service.meeting_repository.get_booking_by_id(booking_id)
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
        
        meeting = await meeting_service.get_meeting_by_id(str(booking.meeting_id))
        if str(meeting.user_id) != str(current_user.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        updated_booking = await meeting_service.reject_booking(booking_id, reason)
        if not updated_booking:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Booking cannot be rejected")
        
        return {
            "success": True,
            "message": "Booking rejected successfully",
            "data": {
                "booking_id": str(updated_booking.id),
                "status": updated_booking.status.value,
                "reason": reason
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to reject booking: {str(e)}")

@router.put("/bookings/{booking_id}/approve")
async def approve_booking(
    booking_id: str,
    current_user = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Approve a pending booking."""
    try:
        booking = await meeting_service.approve_booking(booking_id)
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found or cannot be approved"
            )
        
        return {
            "success": True,
            "message": "Booking approved successfully",
            "data": {
                "booking_id": str(booking.id),
                "status": booking.status.value
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve booking: {str(e)}"
        )

@router.put("/bookings/{booking_id}/reject")
async def reject_booking(
    booking_id: str,
    current_user = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Reject a pending or approved booking."""
    try:
        booking = await meeting_service.reject_booking(booking_id)
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found or cannot be rejected"
            )
        
        return {
            "success": True,
            "message": "Booking rejected successfully",
            "data": {
                "booking_id": str(booking.id),
                "status": booking.status.value
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reject booking: {str(e)}"
        )

@router.put("/bookings/{booking_id}/complete")
async def complete_booking(
    booking_id: str,
    current_user = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Mark an approved booking as completed."""
    try:
        booking = await meeting_service.complete_booking(booking_id)
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found or cannot be completed"
            )
        
        return {
            "success": True,
            "message": "Booking marked as completed",
            "data": {
                "booking_id": str(booking.id),
                "status": booking.status.value
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete booking: {str(e)}"
        )

@router.post("/{meeting_id}/start")
async def start_meeting(
    meeting_id: str,
    current_user: UserDocument = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Start a scheduled meeting."""
    try:
        meeting = await meeting_service.get_meeting_by_id(meeting_id)
        if not meeting:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
        
        if str(meeting.user_id) != str(current_user.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        updated_meeting = await meeting_service.start_meeting(meeting_id)
        if not updated_meeting:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Meeting cannot be started")
        
        return {
            "success": True,
            "message": "Meeting started successfully",
            "data": {
                "id": str(updated_meeting.id),
                "status": updated_meeting.status.value
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to start meeting: {str(e)}")

@router.post("/{meeting_id}/complete")
async def complete_meeting(
    meeting_id: str,
    current_user: UserDocument = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Complete a meeting."""
    try:
        meeting = await meeting_service.get_meeting_by_id(meeting_id)
        if not meeting:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
        
        if str(meeting.user_id) != str(current_user.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        updated_meeting = await meeting_service.complete_meeting(meeting_id)
        if not updated_meeting:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Meeting cannot be completed")
        
        return {
            "success": True,
            "message": "Meeting completed successfully",
            "data": {
                "id": str(updated_meeting.id),
                "status": updated_meeting.status.value
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to complete meeting: {str(e)}")

@router.post("/{meeting_id}/cancel")
async def cancel_meeting(
    meeting_id: str,
    reason: Optional[str] = None,
    current_user: UserDocument = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Cancel a meeting."""
    try:
        meeting = await meeting_service.get_meeting_by_id(meeting_id)
        if not meeting:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
        
        if str(meeting.user_id) != str(current_user.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        updated_meeting = await meeting_service.cancel_meeting(meeting_id, reason)
        if not updated_meeting:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Meeting cannot be cancelled")
        
        return {
            "success": True,
            "message": "Meeting cancelled successfully",
            "data": {
                "id": str(updated_meeting.id),
                "status": updated_meeting.status.value,
                "reason": reason
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to cancel meeting: {str(e)}")

@router.get("/status/{status}")
async def get_meetings_by_status(
    status: str,
    current_user: UserDocument = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Get meetings by specific status."""
    try:
        # Convert string to enum
        try:
            status_enum = MeetingStatus(status.lower())
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")
        
        meetings = await meeting_service.get_meetings_by_status(str(current_user.id), status_enum)
        
        formatted_meetings = []
        for meeting in meetings:
            formatted_meetings.append({
                "id": str(meeting.id),
                "title": meeting.title,
                "description": meeting.description,
                "status": meeting.status.value,
                "duration": meeting.duration,
                "timezone": meeting.timezone,
                "start_date": meeting.start_date.isoformat() if meeting.start_date else None,
                "end_date": meeting.end_date.isoformat() if meeting.end_date else None,
                "created_at": meeting.created_at.isoformat() if meeting.created_at else None,
                "public_link": meeting.public_link
            })
        
        return {
            "success": True,
            "data": {
                "status": status_enum.value,
                "meetings": formatted_meetings,
                "count": len(formatted_meetings)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to get meetings: {str(e)}")

@router.delete("/{meeting_id}")
async def delete_meeting(
    meeting_id: str,
    current_user = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Delete a meeting."""
    try:
        # Check if user is the organizer
        meeting = await meeting_service.get_meeting_by_id(meeting_id)
        
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting not found"
            )
        
        if meeting.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Delete meeting
        success = await meeting_service.delete_meeting(meeting_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete meeting"
            )
        
        return {
            "success": True,
            "message": "Meeting deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete meeting: {str(e)}"
        )

@router.get("/{meeting_id}/bookings")
async def get_meeting_bookings(
    meeting_id: str,
    current_user = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Get all bookings for a meeting."""
    try:
        # Check if user is the organizer
        meeting = await meeting_service.get_meeting_by_id(meeting_id)
        
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting not found"
            )
        
        if meeting.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Get bookings
        bookings = await meeting_service.get_meeting_bookings(meeting_id)
        
        return {
            "success": True,
            "data": [
                {
                    "id": booking.id,
                    "participant_name": booking.participant_name,
                    "participant_email": booking.participant_email,
                    "participant_phone": booking.participant_phone,
                    "slot_start_time": booking.slot.start_time.isoformat(),
                    "slot_end_time": booking.slot.end_time.isoformat(),
                    "status": booking.status,
                    "created_at": booking.created_at.isoformat()
                }
                for booking in bookings
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch bookings: {str(e)}"
        )

# Public routes (no authentication required)
@router.get("/public/test")
async def test_public_endpoint():
    """Test public endpoint."""
    return {"message": "Public endpoint is working"}

@router.get("/public/{meeting_link}")
async def get_public_meeting_info(
    meeting_link: str,
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Get public meeting information for booking."""
    try:
        # First try to get meeting by public_link, then by ID if that fails
        meeting = await meeting_service.get_meeting_by_public_link(meeting_link)
        
        # If not found by public_link, try to get by ID
        if not meeting:
            meeting = await meeting_service.get_meeting_by_id(meeting_link)
        
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting not found"
            )
        
        # Check if meeting is open for bookings
        if meeting.status != MeetingStatus.OPEN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This meeting is not open for bookings"
            )
        
        # Get available slots for this meeting
        available_slots = await meeting_service.get_available_slots(str(meeting.id))
        
        # Convert slots to frontend-friendly format
        slots_data = []
        for slot in available_slots:
            slots_data.append({
                "id": str(slot.id),
                "start_time": slot.start_time.isoformat(),
                "end_time": slot.end_time.isoformat(),
                "is_available": not slot.is_booked,
                "formatted_time": f"{slot.start_time.strftime('%I:%M %p')} - {slot.end_time.strftime('%I:%M %p')}",
                "formatted_date": slot.start_time.strftime('%B %d, %Y')
            })
        
        return {
            "success": True,
            "data": {
                "meeting": {
                    "id": str(meeting.id),
                    "title": meeting.title,
                    "description": meeting.description,
                    "duration_minutes": meeting.duration,
                    "timezone": meeting.timezone,
                    "slot_selection_type": meeting.slot_selection_type.value if hasattr(meeting.slot_selection_type, 'value') else 'single',
                    "max_participants": meeting.max_participants,
                    "allow_guest_booking": meeting.is_public
                },
                "available_slots": slots_data
            }
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

from pydantic import BaseModel

class BookMeetingSlotRequest(BaseModel):
    slot_id: str
    participant_name: str
    participant_email: str
    participant_phone: Optional[str] = None
    notes: Optional[str] = None

@router.post("/public/{meeting_link}/book")
async def book_meeting_slot(
    meeting_link: str,
    booking_data: BookMeetingSlotRequest,
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Book a meeting slot (public endpoint)."""
    try:
        # First try to get meeting by public_link, then by ID if that fails
        meeting = await meeting_service.get_meeting_by_public_link(meeting_link)
        
        # If not found by public_link, try to get by ID
        if not meeting:
            meeting = await meeting_service.get_meeting_by_id(meeting_link)
        
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting not found"
            )
        
        if not meeting.allow_guest_booking:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Guest booking not allowed for this meeting"
            )
        
        # Check if meeting is open for bookings
        if meeting.status != MeetingStatus.OPEN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This meeting is not open for bookings"
            )
        
        # Book the slot
        participant_data = {
            'participant_name': booking_data.participant_name,
            'participant_email': booking_data.participant_email,
            'participant_phone': booking_data.participant_phone,
            'notes': booking_data.notes
        }
        
        booking = await meeting_service.book_meeting_slot(
            booking_data.slot_id, 
            participant_data
        )
        
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Slot not available or invalid"
            )
        
        # Get slot information for the response
        slot = await meeting_service.meeting_repository.get_slot_by_id(booking_data.slot_id)
        
        return {
            "success": True,
            "message": "Slot booked successfully",
            "data": {
                "booking_id": str(booking.id),
                "booking_token": booking.booking_token,
                "meeting_title": meeting.title,
                "slot_start_time": slot.start_time.isoformat() if slot else None,
                "slot_end_time": slot.end_time.isoformat() if slot else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to book slot: {str(e)}"
        )

@router.post("/public/booking/{booking_token}/cancel")
async def cancel_public_booking(
    booking_token: str,
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Cancel a public booking."""
    try:
        success = await meeting_service.cancel_booking(booking_token)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        return {
            "success": True,
            "message": "Booking cancelled successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel booking: {str(e)}"
        )

@router.get("/dashboard/stats")
async def get_meeting_dashboard_stats(
    current_user = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Get meeting dashboard statistics."""
    try:
        dashboard_data = meeting_service.get_organizer_dashboard_data(current_user.id)
        
        return {
            "success": True,
            "data": dashboard_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard data: {str(e)}"
        )

@router.post("/{meeting_id}/generate-slots")
async def generate_meeting_slots(
    meeting_id: str,
    slot_config: Dict[str, Any],
    current_user: UserDocument = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Generate time slots for an existing meeting."""
    try:
        # Check if user owns the meeting
        meeting = await meeting_service.get_meeting_by_id(meeting_id)
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting not found"
            )
        
        if str(meeting.user_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only generate slots for your own meetings"
            )
        
        # Generate slots
        slots = await meeting_service.generate_slots_for_meeting(meeting_id, slot_config)
        
        return {
            "success": True,
            "message": f"Generated {len(slots)} time slots",
            "data": {
                "meeting_id": meeting_id,
                "slots_count": len(slots),
                "slots": [
                    {
                        "id": str(slot.id),
                        "start_time": slot.start_time.isoformat(),
                        "end_time": slot.end_time.isoformat(),
                        "is_booked": slot.is_booked
                    }
                    for slot in slots
                ]
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate slots: {str(e)}"
        )


@router.get("/{meeting_id}/slots")
async def get_meeting_slots(
    meeting_id: str,
    current_user: UserDocument = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Get all slots for a meeting (HR view)."""
    try:
        # Check if user owns the meeting
        meeting = await meeting_service.get_meeting_by_id(meeting_id)
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting not found"
            )
        
        if str(meeting.user_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view slots for your own meetings"
            )
        
        # Get all slots
        all_slots = await meeting_service.get_available_slots(meeting_id)
        
        # Get bookings for this meeting
        bookings = await meeting_service.get_meeting_bookings(meeting_id)
        
        # Group slots by date
        slots_by_date = {}
        for slot in all_slots:
            date_key = slot.start_time.strftime("%Y-%m-%d")
            if date_key not in slots_by_date:
                slots_by_date[date_key] = []
            
            # Find booking for this slot
            booking = next((b for b in bookings if str(b.slot_id) == str(slot.id)), None)
            
            slot_data = {
                "id": str(slot.id),
                "start_time": slot.start_time.isoformat(),
                "end_time": slot.end_time.isoformat(),
                "is_booked": slot.is_booked,
                "formatted_time": f"{slot.start_time.strftime('%I:%M %p')} - {slot.end_time.strftime('%I:%M %p')}",
                "formatted_date": slot.start_time.strftime('%B %d, %Y'),
                "booking": {
                    "id": str(booking.id),
                    "participant_name": booking.participant_name,
                    "participant_email": booking.participant_email,
                    "status": booking.status,
                    "created_at": booking.created_at.isoformat()
                } if booking else None
            }
            
            slots_by_date[date_key].append(slot_data)
        
        return {
            "success": True,
            "data": {
                "meeting": {
                    "id": str(meeting.id),
                    "title": meeting.title,
                    "duration": meeting.duration,
                    "timezone": meeting.timezone
                },
                "slots_by_date": slots_by_date,
                "statistics": {
                    "total_slots": len(all_slots),
                    "booked_slots": len([s for s in all_slots if s.is_booked]),
                    "available_slots": len([s for s in all_slots if not s.is_booked])
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get meeting slots: {str(e)}"
        )

@router.post("/{meeting_id}/close")
async def close_meeting(
    meeting_id: str,
    current_user = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Close an open meeting to stop accepting new bookings."""
    try:
        # Get meeting by ID
        meeting = await meeting_service.get_meeting_by_id(meeting_id)
        
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting not found"
            )
        
        # Check if user is the organizer
        if meeting.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Check if meeting is in open status
        if meeting.status != MeetingStatus.OPEN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only open meetings can be closed"
            )
        
        # Close the meeting
        updated_meeting = await meeting_service.close_meeting(meeting_id)
        
        if not updated_meeting:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to close meeting"
            )
        
        return {
            "success": True,
            "message": "Meeting closed successfully",
            "data": {
                "meeting_id": str(updated_meeting.id),
                "status": updated_meeting.status.value
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to close meeting: {str(e)}"
        )
