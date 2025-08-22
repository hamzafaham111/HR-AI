"""
Meeting service for business logic operations.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import uuid
from bson import ObjectId
from app.repositories.meeting_repository import MeetingRepository
from app.models.mongodb_models import MeetingDocument, MeetingSlotDocument, MeetingBookingDocument
from app.models.mongodb_models import MeetingType, MeetingStatus, SlotSelectionType, BookingStatus
from app.core.database import get_database

logger = logging.getLogger(__name__)

class MeetingService:
    """Service for meeting business logic."""
    
    def __init__(self, meeting_repository: MeetingRepository):
        self.meeting_repository = meeting_repository
    
    async def create_meeting(self, meeting_data: Dict[str, Any]) -> MeetingDocument:
        """Create a new meeting with slots."""
        # Generate public link if meeting is public
        if meeting_data.get("is_public", False):
            meeting_data["public_link"] = str(uuid.uuid4())
        
        # Create the meeting
        meeting = await self.meeting_repository.create_meeting(meeting_data)
        
        # Generate time slots if this is a public meeting
        if meeting_data.get("is_public", False):
            await self._generate_time_slots_for_meeting(meeting.id, meeting_data)
        
        return meeting
    
    async def get_meeting_by_id(self, meeting_id: str) -> Optional[MeetingDocument]:
        """Get a meeting by ID."""
        return await self.meeting_repository.get_meeting_by_id(meeting_id)
    
    async def get_meetings_by_user(self, user_id: str, limit: int = 100) -> List[MeetingDocument]:
        """Get all meetings for a specific user."""
        return await self.meeting_repository.get_meetings_by_user(user_id, limit)
    
    async def update_meeting(self, meeting_id: str, update_data: Dict[str, Any]) -> Optional[MeetingDocument]:
        """Update a meeting."""
        return await self.meeting_repository.update_meeting(meeting_id, update_data)
    
    async def delete_meeting(self, meeting_id: str) -> bool:
        """Delete a meeting and all related data."""
        return await self.meeting_repository.delete_meeting(meeting_id)
    
    async def get_meeting_by_public_link(self, public_link: str) -> Optional[MeetingDocument]:
        """Get a meeting by its public link."""
        return await self.meeting_repository.get_meeting_by_public_link(public_link)
    
    async def get_available_slots(self, meeting_id: str) -> List[MeetingSlotDocument]:
        """Get available slots for a meeting."""
        return await self.meeting_repository.get_available_slots(meeting_id)
    
    async def get_all_slots_for_meeting(self, meeting_id: str) -> List[MeetingSlotDocument]:
        """Get all slots for a meeting (both available and booked)."""
        return await self.meeting_repository.get_all_slots_for_meeting(meeting_id)
    
    async def book_meeting_slot(self, slot_id: str, booking_data: Dict[str, Any]) -> Optional[MeetingBookingDocument]:
        """Book a meeting slot."""
        # First, get the slot to find the meeting_id
        slot = await self.meeting_repository.get_slot_by_id(slot_id)
        if not slot:
            return None
        
        # Add required fields to booking data
        complete_booking_data = {
            **booking_data,
            "meeting_id": slot.meeting_id,
            "slot_id": ObjectId(slot_id)
        }
        
        return await self.meeting_repository.book_slot(slot_id, complete_booking_data)
    
    async def get_meeting_bookings(self, meeting_id: str) -> List[MeetingBookingDocument]:
        """Get all bookings for a meeting."""
        return await self.meeting_repository.get_meeting_bookings(meeting_id)
    
    async def get_meeting_bookings_count(self, meeting_id: str) -> int:
        """Get the count of bookings for a meeting."""
        return await self.meeting_repository.get_meeting_bookings_count(meeting_id)
    
    async def update_booking_status(self, booking_id: str, status: str) -> Optional[MeetingBookingDocument]:
        """Update booking status."""
        return await self.meeting_repository.update_booking_status(booking_id, status)
    
    async def cancel_booking(self, booking_id: str) -> bool:
        """Cancel a booking and free up the slot."""
        return await self.meeting_repository.cancel_booking(booking_id)
    
    async def create_meeting_template(self, template_data: Dict[str, Any]) -> Any:
        """Create a meeting template."""
        return await self.meeting_repository.create_meeting_template(template_data)
    
    async def get_meeting_templates_by_user(self, user_id: str) -> List[Any]:
        """Get all meeting templates for a user."""
        return await self.meeting_repository.get_meeting_templates_by_user(user_id)
    
    async def delete_meeting_template(self, template_id: str) -> bool:
        """Delete a meeting template."""
        return await self.meeting_repository.delete_meeting_template(template_id)
    
    async def get_upcoming_meetings(self, user_id: str, days: int = 7) -> List[MeetingDocument]:
        """Get upcoming meetings for a user within specified days."""
        return await self.meeting_repository.get_upcoming_meetings(user_id, days)
    
    async def search_meetings(self, user_id: str, query: str) -> List[MeetingDocument]:
        """Search meetings by title or description."""
        return await self.meeting_repository.search_meetings(user_id, query)
    
    # New workflow methods
    async def open_meeting(self, meeting_id: str) -> Optional[MeetingDocument]:
        """Open a draft meeting to make it publicly bookable."""
        meeting = await self.get_meeting_by_id(meeting_id)
        if not meeting or meeting.status != MeetingStatus.DRAFT:
            return None
        
        update_data = {"status": MeetingStatus.OPEN}
        return await self.update_meeting(meeting_id, update_data)
    
    async def close_meeting(self, meeting_id: str) -> Optional[MeetingDocument]:
        """Close an open meeting to stop accepting new bookings."""
        meeting = await self.get_meeting_by_id(meeting_id)
        if not meeting or meeting.status != MeetingStatus.OPEN:
            return None
        
        update_data = {"status": MeetingStatus.CLOSED}
        return await self.update_meeting(meeting_id, update_data)
    
    async def approve_booking(self, booking_id: str) -> Optional[MeetingBookingDocument]:
        """Approve a pending booking and schedule the meeting."""
        booking = await self.meeting_repository.get_booking_by_id(booking_id)
        if not booking or booking.status != BookingStatus.PENDING:
            return None
        
        # Update booking status to approved
        updated_booking = await self.update_booking_status(booking_id, BookingStatus.APPROVED)
        
        # Update meeting status to scheduled
        await self.update_meeting(str(booking.meeting_id), {"status": MeetingStatus.SCHEDULED})
        
        return updated_booking
    
    async def reject_booking(self, booking_id: str, reason: str = None) -> Optional[MeetingBookingDocument]:
        """Reject a pending booking."""
        booking = await self.meeting_repository.get_booking_by_id(booking_id)
        if not booking or booking.status not in [BookingStatus.PENDING, BookingStatus.APPROVED]:
            return None
        
        # Update booking status to rejected
        updated_booking = await self.update_booking_status(booking_id, BookingStatus.REJECTED)
        
        return updated_booking

    async def complete_booking(self, booking_id: str) -> Optional[MeetingBookingDocument]:
        """Mark an approved booking as completed."""
        booking = await self.meeting_repository.get_booking_by_id(booking_id)
        if not booking or booking.status != BookingStatus.APPROVED:
            return None
        
        # Update booking status to completed
        updated_booking = await self.update_booking_status(booking_id, BookingStatus.COMPLETED)
        
        return updated_booking
    
    async def start_meeting(self, meeting_id: str) -> Optional[MeetingDocument]:
        """Mark a meeting as in progress."""
        meeting = await self.get_meeting_by_id(meeting_id)
        if not meeting or meeting.status != MeetingStatus.SCHEDULED:
            return None
        
        update_data = {"status": MeetingStatus.IN_PROGRESS}
        return await self.update_meeting(meeting_id, update_data)
    
    async def complete_meeting(self, meeting_id: str) -> Optional[MeetingDocument]:
        """Mark a meeting as completed."""
        meeting = await self.get_meeting_by_id(meeting_id)
        if not meeting or meeting.status not in [MeetingStatus.SCHEDULED, MeetingStatus.IN_PROGRESS]:
            return None
        
        update_data = {"status": MeetingStatus.COMPLETED}
        return await self.update_meeting(meeting_id, update_data)
    
    async def cancel_meeting(self, meeting_id: str, reason: str = None) -> Optional[MeetingDocument]:
        """Cancel a scheduled meeting."""
        meeting = await self.get_meeting_by_id(meeting_id)
        if not meeting or meeting.status not in [MeetingStatus.SCHEDULED, MeetingStatus.PENDING]:
            return None
        
        update_data = {"status": MeetingStatus.CANCELLED}
        if reason:
            update_data["cancellation_reason"] = reason
        
        # Cancel all associated bookings
        bookings = await self.get_meeting_bookings(meeting_id)
        for booking in bookings:
            if booking.status == BookingStatus.APPROVED:
                await self.update_booking_status(str(booking.id), BookingStatus.CANCELLED)
        
        return await self.update_meeting(meeting_id, update_data)
    
    async def mark_no_show(self, meeting_id: str) -> Optional[MeetingDocument]:
        """Mark a meeting as no-show."""
        meeting = await self.get_meeting_by_id(meeting_id)
        if not meeting or meeting.status != MeetingStatus.SCHEDULED:
            return None
        
        update_data = {"status": MeetingStatus.NO_SHOW}
        return await self.update_meeting(meeting_id, update_data)
    
    async def get_meetings_by_status(self, user_id: str, status: MeetingStatus) -> List[MeetingDocument]:
        """Get meetings by specific status."""
        return await self.meeting_repository.get_meetings_by_status(user_id, status)
    
    async def generate_slots_for_meeting(self, meeting_id: str, slot_config: Dict[str, Any]) -> List[MeetingSlotDocument]:
        """Generate time slots for a meeting based on configuration."""
        meeting = await self.get_meeting_by_id(meeting_id)
        if not meeting:
            raise ValueError("Meeting not found")
        
        slots = await self._generate_time_slots(
            meeting_id=meeting_id,
            start_date=meeting.start_date,
            end_date=meeting.end_date,
            duration_minutes=meeting.duration,
            slot_config=slot_config
        )
        
        # Save all slots to database
        created_slots = []
        for slot_data in slots:
            slot = await self.meeting_repository.create_meeting_slot(slot_data)
            created_slots.append(slot)
        
        return created_slots
    
    # Private helper methods
    async def _generate_time_slots_for_meeting(self, meeting_id: str, meeting_data: Dict[str, Any]):
        """Generate default time slots for a public meeting."""
        # Default configuration: generate slots for next 30 days, 9 AM to 5 PM
        start_date = datetime.now()
        end_date = start_date + timedelta(days=30)
        
        # Generate slots every hour from 9 AM to 5 PM
        slot_config = {
            "start_hour": 9,
            "end_hour": 17,
            "slot_interval_minutes": 60,
            "days_of_week": [0, 1, 2, 3, 4],  # Monday to Friday
            "timezone": meeting_data.get("timezone", "UTC")
        }
        
        await self.generate_slots_for_meeting(meeting_id, slot_config)
    
    async def _generate_time_slots(
        self, 
        meeting_id: str, 
        start_date: datetime, 
        end_date: datetime, 
        duration_minutes: int,
        slot_config: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate time slots for a meeting period."""
        slots = []
        current_date = start_date.date()
        end_date_only = end_date.date()
        
        start_hour = slot_config.get("start_hour", 9)
        end_hour = slot_config.get("end_hour", 17)
        slot_interval = slot_config.get("slot_interval_minutes", 60)
        days_of_week = slot_config.get("days_of_week", [0, 1, 2, 3, 4])  # Monday to Friday
        
        while current_date <= end_date_only:
            # Check if this day of week is allowed
            if current_date.weekday() in days_of_week:
                current_time = datetime.combine(current_date, datetime.min.time().replace(hour=start_hour))
                
                while current_time.hour < end_hour:
                    slot_end = current_time + timedelta(minutes=duration_minutes)
                    
                    # Create slot data
                    slot_data = {
                        "meeting_id": meeting_id,
                        "start_time": current_time,
                        "end_time": slot_end,
                        "is_booked": False,
                        "created_at": datetime.now()
                    }
                    slots.append(slot_data)
                    
                    # Move to next slot
                    current_time += timedelta(minutes=slot_interval)
            
            # Move to next day
            current_date += timedelta(days=1)
        
        return slots
