"""
MongoDB repository for meeting operations.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.mongodb_models import (
    MeetingDocument, MeetingSlotDocument, MeetingBookingDocument, MeetingTemplateDocument,
    MeetingStatus, BookingStatus
)


class MeetingRepository:
    """Repository for meeting operations using MongoDB."""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        self.database = database
        self.meetings = database.meetings
        self.meeting_slots = database.meeting_slots
        self.meeting_bookings = database.meeting_bookings
        self.meeting_templates = database.meeting_templates
    
    async def create_meeting(self, meeting_data: Dict[str, Any]) -> MeetingDocument:
        """Create a new meeting."""
        meeting = MeetingDocument(**meeting_data)
        result = await self.meetings.insert_one(meeting.model_dump(by_alias=True))
        meeting.id = result.inserted_id
        return meeting
    
    async def get_meeting_by_id(self, meeting_id: str) -> Optional[MeetingDocument]:
        """Get a meeting by ID."""
        if not ObjectId.is_valid(meeting_id):
            return None
        
        meeting_data = await self.meetings.find_one({"_id": ObjectId(meeting_id)})
        if meeting_data:
            return MeetingDocument(**meeting_data)
        return None
    
    async def get_meetings_by_user(self, user_id: str, limit: int = 100) -> List[MeetingDocument]:
        """Get all meetings for a specific user."""
        if not ObjectId.is_valid(user_id):
            return []
        
        # Try both ObjectId and string queries to handle data inconsistency
        user_id_obj = ObjectId(user_id)
        
        # First try with ObjectId
        cursor = self.meetings.find({"user_id": user_id_obj}).limit(limit)
        meetings = []
        async for meeting_data in cursor:
            try:
                meetings.append(MeetingDocument(**meeting_data))
            except Exception as e:
                # Log error and continue with other meetings
                continue
        
        # If no results, try with string
        if not meetings:
            cursor = self.meetings.find({"user_id": user_id}).limit(limit)
            async for meeting_data in cursor:
                try:
                    meetings.append(MeetingDocument(**meeting_data))
                except Exception as e:
                    # Log error and continue with other meetings
                    continue
        
        return meetings
    
    async def update_meeting(self, meeting_id: str, update_data: Dict[str, Any]) -> Optional[MeetingDocument]:
        """Update a meeting."""
        if not ObjectId.is_valid(meeting_id):
            return None
        
        update_data["updated_at"] = datetime.now()
        result = await self.meetings.update_one(
            {"_id": ObjectId(meeting_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return await self.get_meeting_by_id(meeting_id)
        return None
    
    async def delete_meeting(self, meeting_id: str) -> bool:
        """Delete a meeting and all related data."""
        if not ObjectId.is_valid(meeting_id):
            return False
        
        # Delete meeting
        meeting_result = await self.meetings.delete_one({"_id": ObjectId(meeting_id)})
        
        # Delete related slots
        await self.meeting_slots.delete_many({"meeting_id": ObjectId(meeting_id)})
        
        # Delete related bookings
        await self.meeting_bookings.delete_many({"meeting_id": ObjectId(meeting_id)})
        
        return meeting_result.deleted_count > 0
    
    async def get_meetings_by_status(self, user_id: str, status: MeetingStatus) -> List[MeetingDocument]:
        """Get meetings by specific status."""
        if not ObjectId.is_valid(user_id):
            return []
        
        user_id_obj = ObjectId(user_id)
        cursor = self.meetings.find({"user_id": user_id_obj, "status": status})
        meetings = []
        async for meeting_data in cursor:
            try:
                meetings.append(MeetingDocument(**meeting_data))
            except Exception as e:
                # Log error and continue with other meetings
                continue
        return meetings
    
    async def get_booking_by_id(self, booking_id: str) -> Optional[MeetingBookingDocument]:
        """Get a booking by ID."""
        if not ObjectId.is_valid(booking_id):
            return None
        
        booking_data = await self.meeting_bookings.find_one({"_id": ObjectId(booking_id)})
        if booking_data:
            return MeetingBookingDocument(**booking_data)
        return None
    
    async def get_pending_bookings(self, user_id: str) -> List[MeetingBookingDocument]:
        """Get all pending bookings for a user's meetings."""
        if not ObjectId.is_valid(user_id):
            return []
        
        user_id_obj = ObjectId(user_id)
        
        # First get all meetings by this user
        user_meetings = await self.get_meetings_by_user(user_id)
        meeting_ids = [str(meeting.id) for meeting in user_meetings]
        
        if not meeting_ids:
            return []
        
        # Get all pending bookings for these meetings
        cursor = self.meeting_bookings.find({
            "meeting_id": {"$in": [ObjectId(mid) for mid in meeting_ids]},
            "status": BookingStatus.PENDING
        })
        
        bookings = []
        async for booking_data in cursor:
            try:
                bookings.append(MeetingBookingDocument(**booking_data))
            except Exception as e:
                # Log error and continue with other bookings
                continue
        
        return bookings
    
    async def free_slot(self, slot_id: str) -> bool:
        """Free up a slot by removing booking reference."""
        if not ObjectId.is_valid(slot_id):
            return False
        
        result = await self.meeting_slots.update_one(
            {"_id": ObjectId(slot_id)},
            {
                "$set": {
                    "is_booked": False,
                    "booking_id": None
                }
            }
        )
        
        return result.modified_count > 0
    
    async def get_meeting_by_public_link(self, public_link: str) -> Optional[MeetingDocument]:
        """Get a meeting by its public link."""
        meeting_data = await self.meetings.find_one({"public_link": public_link})
        if meeting_data:
            return MeetingDocument(**meeting_data)
        return None
    
    # Meeting Slots
    async def create_meeting_slots(self, slots_data: List[Dict[str, Any]]) -> List[MeetingSlotDocument]:
        """Create multiple meeting slots."""
        slots = [MeetingSlotDocument(**slot_data) for slot_data in slots_data]
        slot_docs = [slot.model_dump(by_alias=True) for slot in slots]
        
        result = await self.meeting_slots.insert_many(slot_docs)
        
        # Update slot IDs
        for i, slot in enumerate(slots):
            slot.id = result.inserted_ids[i]
        
        return slots
    
    async def create_meeting_slot(self, slot_data: Dict[str, Any]) -> MeetingSlotDocument:
        """Create a new meeting slot."""
        slot = MeetingSlotDocument(**slot_data)
        result = await self.meeting_slots.insert_one(slot.model_dump(by_alias=True))
        slot.id = result.inserted_id
        return slot
    
    async def get_available_slots(self, meeting_id: str) -> List[MeetingSlotDocument]:
        """Get available slots for a meeting."""
        if not ObjectId.is_valid(meeting_id):
            return []
        
        cursor = self.meeting_slots.find({
            "meeting_id": ObjectId(meeting_id),
            "is_booked": False
        })
        
        slots = []
        async for slot_data in cursor:
            slots.append(MeetingSlotDocument(**slot_data))
        return slots
    
    async def get_all_slots_for_meeting(self, meeting_id: str) -> List[MeetingSlotDocument]:
        """Get all slots for a meeting (both available and booked)."""
        if not ObjectId.is_valid(meeting_id):
            return []
        
        cursor = self.meeting_slots.find({"meeting_id": ObjectId(meeting_id)})
        
        slots = []
        async for slot_data in cursor:
            slots.append(MeetingSlotDocument(**slot_data))
        return slots
    
    async def get_slot_by_id(self, slot_id: str) -> Optional[MeetingSlotDocument]:
        """Get a slot by ID."""
        if not ObjectId.is_valid(slot_id):
            return None
        
        slot_data = await self.meeting_slots.find_one({"_id": ObjectId(slot_id)})
        if slot_data:
            return MeetingSlotDocument(**slot_data)
        return None
    
    async def book_slot(self, slot_id: str, booking_data: Dict[str, Any]) -> Optional[MeetingBookingDocument]:
        """Book a meeting slot."""
        if not ObjectId.is_valid(slot_id):
            return None
        
        # Create booking
        booking = MeetingBookingDocument(**booking_data)
        result = await self.meeting_bookings.insert_one(booking.model_dump(by_alias=True))
        booking.id = result.inserted_id
        
        # Update slot as booked
        await self.meeting_slots.update_one(
            {"_id": ObjectId(slot_id)},
            {
                "$set": {
                    "is_booked": True,
                    "booking_id": booking.id
                }
            }
        )
        
        return booking
    
    async def get_meeting_bookings(self, meeting_id: str) -> List[MeetingBookingDocument]:
        """Get all bookings for a meeting."""
        if not ObjectId.is_valid(meeting_id):
            return []
        
        cursor = self.meeting_bookings.find({"meeting_id": ObjectId(meeting_id)})
        bookings = []
        async for booking_data in cursor:
            try:
                bookings.append(MeetingBookingDocument(**booking_data))
            except Exception as e:
                # Log error and continue with other bookings
                continue
        
        return bookings
    
    async def get_meeting_bookings_count(self, meeting_id: str) -> int:
        """Get the count of bookings for a meeting."""
        if not ObjectId.is_valid(meeting_id):
            return 0
        
        count = await self.meeting_bookings.count_documents({"meeting_id": ObjectId(meeting_id)})
        return count
    
    async def create_booking(self, booking_data: Dict[str, Any]) -> MeetingBookingDocument:
        """Create a new booking."""
        booking = MeetingBookingDocument(**booking_data)
        result = await self.meeting_bookings.insert_one(booking.model_dump(by_alias=True))
        booking.id = result.inserted_id
        return booking
    
    async def update_booking_status(self, booking_id: str, status: str) -> Optional[MeetingBookingDocument]:
        """Update booking status."""
        if not ObjectId.is_valid(booking_id):
            return None
        
        result = await self.meeting_bookings.update_one(
            {"_id": ObjectId(booking_id)},
            {
                "$set": {
                    "status": status,
                    "updated_at": datetime.now()
                }
            }
        )
        
        if result.modified_count > 0:
            booking_data = await self.meeting_bookings.find_one({"_id": ObjectId(booking_id)})
            return MeetingBookingDocument(**booking_data)
        return None
    
    async def cancel_booking(self, booking_id: str) -> bool:
        """Cancel a booking and free up the slot."""
        if not ObjectId.is_valid(booking_id):
            return False
        
        # Get booking to find slot ID
        booking_data = await self.meeting_bookings.find_one({"_id": ObjectId(booking_id)})
        if not booking_data:
            return False
        
        # Update slot as available
        slot_result = await self.meeting_slots.update_one(
            {"_id": ObjectId(booking_data["slot_id"])},
            {
                "$set": {
                    "is_booked": False,
                    "booking_id": None
                }
            }
        )
        
        # Delete booking
        booking_result = await self.meeting_bookings.delete_one({"_id": ObjectId(booking_id)})
        
        return slot_result.modified_count > 0 and booking_result.deleted_count > 0
    
    # Meeting Templates
    async def create_meeting_template(self, template_data: Dict[str, Any]) -> MeetingTemplateDocument:
        """Create a new meeting template."""
        template = MeetingTemplateDocument(**template_data)
        result = await self.meeting_templates.insert_one(template.model_dump(by_alias=True))
        template.id = result.inserted_id
        return template
    
    async def get_meeting_templates_by_user(self, user_id: str) -> List[MeetingTemplateDocument]:
        """Get all meeting templates for a user."""
        if not ObjectId.is_valid(user_id):
            return []
        
        # Try both ObjectId and string queries to handle data inconsistency
        user_id_obj = ObjectId(user_id)
        
        # First try with ObjectId
        cursor = self.meeting_templates.find({"user_id": user_id_obj})
        templates = []
        async for template_data in cursor:
            templates.append(MeetingTemplateDocument(**template_data))
        
        # If no results, try with string
        if not templates:
            cursor = self.meeting_templates.find({"user_id": user_id})
            async for template_data in cursor:
                templates.append(MeetingTemplateDocument(**template_data))
        
        return templates
    
    async def delete_meeting_template(self, template_id: str) -> bool:
        """Delete a meeting template."""
        if not ObjectId.is_valid(template_id):
            return False
        
        result = await self.meeting_templates.delete_one({"_id": ObjectId(template_id)})
        return result.deleted_count > 0
    
    # Utility methods
    async def get_upcoming_meetings(self, user_id: str, days: int = 7) -> List[MeetingDocument]:
        """Get upcoming meetings for a user within specified days."""
        if not ObjectId.is_valid(user_id):
            return []
        
        start_date = datetime.now()
        end_date = start_date + timedelta(days=days)
        
        # Try both ObjectId and string queries to handle data inconsistency
        user_id_obj = ObjectId(user_id)
        
        # First try with ObjectId
        cursor = self.meetings.find({
            "user_id": user_id_obj,
            "start_date": {"$gte": start_date, "$lte": end_date},
            "status": {"$in": ["scheduled", "in_progress"]}
        }).sort("start_date", 1)
        
        meetings = []
        async for meeting_data in cursor:
            meetings.append(MeetingDocument(**meeting_data))
        
        # If no results, try with string
        if not meetings:
            cursor = self.meetings.find({
                "user_id": user_id,
                "start_date": {"$gte": start_date, "$lte": end_date},
                "status": {"$in": ["scheduled", "in_progress"]}
            }).sort("start_date", 1)
            
            async for meeting_data in cursor:
                meetings.append(MeetingDocument(**meeting_data))
        
        return meetings
    
    async def search_meetings(self, user_id: str, query: str) -> List[MeetingDocument]:
        """Search meetings by title or description."""
        if not ObjectId.is_valid(user_id):
            return []
        
        # Try both ObjectId and string queries to handle data inconsistency
        user_id_obj = ObjectId(user_id)
        
        # First try with ObjectId
        cursor = self.meetings.find({
            "user_id": user_id_obj,
            "$or": [
                {"title": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}}
            ]
        })
        
        meetings = []
        async for meeting_data in cursor:
            meetings.append(MeetingDocument(**meeting_data))
        
        # If no results, try with string
        if not meetings:
            cursor = self.meetings.find({
                "user_id": user_id,
                "$or": [
                    {"title": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}}
                ]
            })
            
            async for meeting_data in cursor:
                meetings.append(MeetingDocument(**meeting_data))
        
        return meetings
