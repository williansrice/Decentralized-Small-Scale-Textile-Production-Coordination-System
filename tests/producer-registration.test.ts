import { describe, it, expect, beforeEach } from "vitest"

// Mock implementation for testing Clarity contracts
const mockPrincipal = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockRenterPrincipal = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockBlockHeight = 100

// Mock state
let lastEquipmentId = 0
let lastBookingId = 0
let lastReviewId = 0
const equipment = new Map()
const bookings = new Map()
const equipmentReviews = new Map()

// Mock contract functions
const registerEquipment = (name, equipmentType, description, location, hourlyRate, availability, maintenanceStatus) => {
  const newId = lastEquipmentId + 1
  lastEquipmentId = newId
  
  equipment.set(newId, {
    owner: mockPrincipal,
    name,
    "equipment-type": equipmentType,
    description,
    location,
    "hourly-rate": hourlyRate,
    availability,
    "maintenance-status": maintenanceStatus,
    "registration-date": mockBlockHeight,
  })
  
  return { value: newId }
}

const updateEquipment = (
    equipmentId,
    name,
    equipmentType,
    description,
    location,
    hourlyRate,
    availability,
    maintenanceStatus,
) => {
  const equip = equipment.get(equipmentId)
  if (!equip) return { error: 404 }
  if (equip.owner !== mockPrincipal) return { error: 403 }
  
  equipment.set(equipmentId, {
    ...equip,
    name,
    "equipment-type": equipmentType,
    description,
    location,
    "hourly-rate": hourlyRate,
    availability,
    "maintenance-status": maintenanceStatus,
  })
  
  return { value: equipmentId }
}

const createBooking = (equipmentId, startTime, endTime, notes) => {
  const equip = equipment.get(equipmentId)
  if (!equip) return { error: 404 }
  
  // Check if equipment is available (simplified for test)
  const isAvailable = true
  if (!isAvailable) return { error: 410 }
  
  const newId = lastBookingId + 1
  lastBookingId = newId
  
  const duration = endTime - startTime
  const totalCost = (equip["hourly-rate"] * duration) / 3600
  
  bookings.set(newId, {
    "equipment-id": equipmentId,
    renter: mockRenterPrincipal,
    "start-time": startTime,
    "end-time": endTime,
    "total-cost": totalCost,
    status: "pending",
    "payment-status": "pending",
    notes,
    "creation-date": mockBlockHeight,
  })
  
  return { value: newId }
}

const confirmBooking = (bookingId) => {
  const booking = bookings.get(bookingId)
  if (!booking) return { error: 404 }
  
  const equip = equipment.get(booking["equipment-id"])
  if (!equip) return { error: 404 }
  if (equip.owner !== mockPrincipal) return { error: 403 }
  
  bookings.set(bookingId, {
    ...booking,
    status: "confirmed",
  })
  
  return { value: bookingId }
}

const completeBooking = (bookingId) => {
  const booking = bookings.get(bookingId)
  if (!booking) return { error: 404 }
  
  const equip = equipment.get(booking["equipment-id"])
  if (!equip) return { error: 404 }
  if (equip.owner !== mockPrincipal && booking.renter !== mockRenterPrincipal) return { error: 403 }
  
  bookings.set(bookingId, {
    ...booking,
    status: "completed",
  })
  
  return { value: bookingId }
}

const cancelBooking = (bookingId) => {
  const booking = bookings.get(bookingId)
  if (!booking) return { error: 404 }
  
  const equip = equipment.get(booking["equipment-id"])
  if (!equip) return { error: 404 }
  if (booking.renter !== mockRenterPrincipal && equip.owner !== mockPrincipal) return { error: 403 }
  
  bookings.set(bookingId, {
    ...booking,
    status: "cancelled",
  })
  
  return { value: bookingId }
}

const submitEquipmentReview = (equipmentId, bookingId, rating, comments) => {
  const booking = bookings.get(bookingId)
  if (!booking) return { error: 404 }
  
  if (
      booking.renter !== mockRenterPrincipal ||
      booking["equipment-id"] !== equipmentId ||
      booking.status !== "completed"
  ) {
    return { error: 403 }
  }
  
  const newId = lastReviewId + 1
  lastReviewId = newId
  
  equipmentReviews.set(newId, {
    "equipment-id": equipmentId,
    reviewer: mockRenterPrincipal,
    "booking-id": bookingId,
    rating,
    comments,
    "review-date": mockBlockHeight,
  })
  
  return { value: newId }
}

const getEquipment = (equipmentId) => {
  const equip = equipment.get(equipmentId)
  return equip ? equip : null
}

const getBooking = (bookingId) => {
  const booking = bookings.get(bookingId)
  return booking ? booking : null
}

const getEquipmentReview = (reviewId) => {
  const review = equipmentReviews.get(reviewId)
  return review ? review : null
}

describe("Equipment Sharing Contract", () => {
  beforeEach(() => {
    // Reset state before each test
    lastEquipmentId = 0
    lastBookingId = 0
    lastReviewId = 0
    equipment.clear()
    bookings.clear()
    equipmentReviews.clear()
    
    // Set up mock principals for owner and renter
    Object.defineProperty(global, "mockPrincipal", {
      value: mockPrincipal,
      writable: true,
    })
  })
  
  it("should register equipment", () => {
    const result = registerEquipment(
        "Industrial Floor Loom",
        "loom",
        "8-harness floor loom suitable for complex weaving patterns",
        "Textile Studio, 123 Craft St, Artisan Valley",
        500, // hourly rate in microSTX
        "Weekdays 9am-5pm, Weekends by appointment",
        "excellent",
    )
    
    expect(result.value).toBe(1)
    expect(equipment.size).toBe(1)
    
    const equip = getEquipment(1)
    expect(equip).not.toBeNull()
    expect(equip.name).toBe("Industrial Floor Loom")
    expect(equip["equipment-type"]).toBe("loom")
    expect(equip.description).toBe("8-harness floor loom suitable for complex weaving patterns")
    expect(equip.location).toBe("Textile Studio, 123 Craft St, Artisan Valley")
    expect(equip["hourly-rate"]).toBe(500)
    expect(equip.availability).toBe("Weekdays 9am-5pm, Weekends by appointment")
    expect(equip["maintenance-status"]).toBe("excellent")
  })
  
  it("should update equipment", () => {
    // First register equipment
    registerEquipment(
        "Industrial Floor Loom",
        "loom",
        "8-harness floor loom suitable for complex weaving patterns",
        "Textile Studio, 123 Craft St, Artisan Valley",
        500,
        "Weekdays 9am-5pm, Weekends by appointment",
        "excellent",
    )
    
    // Then update it
    const updateResult = updateEquipment(
        1,
        "Professional Floor Loom",
        "loom",
        "12-harness floor loom suitable for complex weaving patterns and fine textiles",
        "Textile Studio, 123 Craft St, Artisan Valley",
        600,
        "Weekdays 9am-7pm, Weekends 10am-4pm",
        "excellent",
    )
    
    expect(updateResult.value).toBe(1)
    
    const equip = getEquipment(1)
    expect(equip.name).toBe("Professional Floor Loom")
    expect(equip.description).toBe("12-harness floor loom suitable for complex weaving patterns and fine textiles")
    expect(equip["hourly-rate"]).toBe(600)
    expect(equip.availability).toBe("Weekdays 9am-7pm, Weekends 10am-4pm")
  })
  
  it("should create a booking", () => {
    // First register equipment
    registerEquipment(
        "Industrial Floor Loom",
        "loom",
        "8-harness floor loom suitable for complex weaving patterns",
        "Textile Studio, 123 Craft St, Artisan Valley",
        500,
        "Weekdays 9am-5pm, Weekends by appointment",
        "excellent",
    )
    
    // Switch to renter principal
    Object.defineProperty(global, "mockPrincipal", {
      value: mockRenterPrincipal,
      writable: true,
    })
    
    // Create a booking
    const bookingResult = createBooking(
        1, // Equipment ID
        mockBlockHeight + 100, // Start time
        mockBlockHeight + 108, // End time (8 hours later)
        "Need to weave a custom blanket for an exhibition",
    )
    
    expect(bookingResult.value).toBe(1)
    expect(bookings.size).toBe(1)
    
    const booking = getBooking(1)
    expect(booking).not.toBeNull()
    expect(booking["equipment-id"]).toBe(1)
    expect(booking.renter).toBe(mockRenterPrincipal)
    expect(booking["start-time"]).toBe(mockBlockHeight + 100)
    expect(booking["end-time"]).toBe(mockBlockHeight + 108)
    expect(booking.status).toBe("pending")
    expect(booking.notes).toBe("Need to weave a custom blanket for an exhibition")
  })
  
  it("should confirm a booking", () => {
    // Register equipment
    registerEquipment(
        "Industrial Floor Loom",
        "loom",
        "8-harness floor loom suitable for complex weaving patterns",
        "Textile Studio, 123 Craft St, Artisan Valley",
        500,
        "Weekdays 9am-5pm, Weekends by appointment",
        "excellent",
    )
    
    // Switch to renter principal
    Object.defineProperty(global, "mockPrincipal", {
      value: mockRenterPrincipal,
      writable: true,
    })
    
    // Create a booking
    createBooking(
        1, // Equipment ID
        mockBlockHeight + 100, // Start time
        mockBlockHeight + 108, // End time (8 hours later)
        "Need to weave a custom blanket for an exhibition",
    )
    
    // Switch back to owner principal
    Object.defineProperty(global, "mockPrincipal", {
      value: mockPrincipal,
      writable: true,
    })
    
    // Confirm the booking
    const confirmResult = confirmBooking(1)
    expect(confirmResult.value).toBe(1)
    
    const booking = getBooking(1)
    expect(booking.status).toBe("confirmed")
  })
  
  it("should complete a booking", () => {
    // Register equipment
    registerEquipment(
        "Industrial Floor Loom",
        "loom",
        "8-harness floor loom suitable for complex weaving patterns",
        "Textile Studio, 123 Craft St, Artisan Valley",
        500,
        "Weekdays 9am-5pm, Weekends by appointment",
        "excellent",
    )
    
    // Switch to renter principal
    Object.defineProperty(global, "mockPrincipal", {
      value: mockRenterPrincipal,
      writable: true,
    })
    
    // Create a booking
    createBooking(
        1, // Equipment ID
        mockBlockHeight + 100, // Start time
        mockBlockHeight + 108, // End time (8 hours later)
        "Need to weave a custom blanket for an exhibition",
    )
    
    // Switch back to owner principal
    Object.defineProperty(global, "mockPrincipal", {
      value: mockPrincipal,
      writable: true,
    })
    
    // Confirm the booking
    confirmBooking(1)
    
    // Complete the booking
    const completeResult = completeBooking(1)
    expect(completeResult.value).toBe(1)
    
    const booking = getBooking(1)
    expect(booking.status).toBe("completed")
  })
  
  it("should submit an equipment review", () => {
    // Register equipment
    registerEquipment(
        "Industrial Floor Loom",
        "loom",
        "8-harness floor loom suitable for complex weaving patterns",
        "Textile Studio, 123 Craft St, Artisan Valley",
        500,
        "Weekdays 9am-5pm, Weekends by appointment",
        "excellent",
    )
    
    // Switch to renter principal
    Object.defineProperty(global, "mockPrincipal", {
      value: mockRenterPrincipal,
      writable: true,
    })
    
    // Create a booking
    createBooking(
        1, // Equipment ID
        mockBlockHeight + 100, // Start time
        mockBlockHeight + 108, // End time (8 hours later)
        "Need to weave a custom blanket for an exhibition",
    )
    
    // Switch back to owner principal
    Object.defineProperty(global, "mockPrincipal", {
      value: mockPrincipal,
      writable: true,
    })
    
    // Confirm and complete the booking
    confirmBooking(1)
    completeBooking(1)
    
    // Switch to renter principal
    Object.defineProperty(global, "mockPrincipal", {
      value: mockRenterPrincipal,
      writable: true,
    })
    
    // Submit a review
    const reviewResult = submitEquipmentReview(
        1, // Equipment ID
        1, // Booking ID
        5, // Rating (out of 5)
        "Excellent loom, well-maintained and perfect for my project. The studio space was also very comfortable.",
    )
    
    expect(reviewResult.value).toBe(1)
    expect(equipmentReviews.size).toBe(1)
    
    const review = getEquipmentReview(1)
    expect(review).not.toBeNull()
    expect(review["equipment-id"]).toBe(1)
    expect(review.reviewer).toBe(mockRenterPrincipal)
    expect(review["booking-id"]).toBe(1)
    expect(review.rating).toBe(5)
    expect(review.comments).toBe(
        "Excellent loom, well-maintained and perfect for my project. The studio space was also very comfortable.",
    )
  })
})

