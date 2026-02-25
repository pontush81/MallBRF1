import { differenceInDays, getISOWeek } from 'date-fns';

// Pricing constants
export const PRICING = {
  LOW_SEASON_RATE: 400,
  HIGH_SEASON_RATE: 600,
  TENNIS_WEEK_RATE: 800,
  PARKING_RATE: 75,
  HIGH_SEASON_WEEKS: [24, 32] as const,   // start, end (inclusive)
  TENNIS_WEEKS: [28, 29] as const,
} as const;

export type SeasonType = 'low' | 'high' | 'tennis';

export interface BookingPriceBreakdown {
  nights: number;
  weekNumber: number;
  seasonType: SeasonType;
  seasonLabel: string;
  nightlyRate: number;
  apartmentSubtotal: number;
  parkingRate: number;
  parkingSubtotal: number;
  grandTotal: number;
}

export const getSeasonType = (weekNumber: number): SeasonType => {
  if (weekNumber >= PRICING.TENNIS_WEEKS[0] && weekNumber <= PRICING.TENNIS_WEEKS[1]) {
    return 'tennis';
  }
  if (weekNumber >= PRICING.HIGH_SEASON_WEEKS[0] && weekNumber <= PRICING.HIGH_SEASON_WEEKS[1]) {
    return 'high';
  }
  return 'low';
};

export const getNightlyRate = (weekNumber: number): number => {
  const season = getSeasonType(weekNumber);
  switch (season) {
    case 'tennis': return PRICING.TENNIS_WEEK_RATE;
    case 'high': return PRICING.HIGH_SEASON_RATE;
    default: return PRICING.LOW_SEASON_RATE;
  }
};

export const getNightlyRateFromWeekString = (weekStr: string): number => {
  const weekNumber = parseInt(weekStr.replace('v.', ''), 10);
  if (isNaN(weekNumber)) return PRICING.LOW_SEASON_RATE;
  return getNightlyRate(weekNumber);
};

export const getSeasonLabel = (season: SeasonType): string => {
  switch (season) {
    case 'tennis': return 'Tennisveckor';
    case 'high': return 'Högsäsong';
    default: return 'Lågsäsong';
  }
};

export const calculateBookingPrice = (
  startDate: Date,
  endDate: Date,
  parking: boolean
): BookingPriceBreakdown => {
  const nights = differenceInDays(endDate, startDate);
  const weekNumber = getISOWeek(startDate);
  const seasonType = getSeasonType(weekNumber);
  const nightlyRate = getNightlyRate(weekNumber);

  const apartmentSubtotal = nights * nightlyRate;
  const parkingRate = PRICING.PARKING_RATE;
  const parkingSubtotal = parking ? nights * parkingRate : 0;

  return {
    nights,
    weekNumber,
    seasonType,
    seasonLabel: getSeasonLabel(seasonType),
    nightlyRate,
    apartmentSubtotal,
    parkingRate,
    parkingSubtotal,
    grandTotal: apartmentSubtotal + parkingSubtotal,
  };
};

export const calculateBookingPriceFromStrings = (
  startDateStr: string,
  endDateStr: string,
  parking: boolean
): BookingPriceBreakdown => {
  return calculateBookingPrice(new Date(startDateStr), new Date(endDateStr), parking);
};

export const calculateTotalRevenue = (
  bookings: Array<{ startDate?: string; endDate?: string; parking?: boolean }>
): {
  apartmentRevenue: number;
  parkingRevenue: number;
  totalRevenue: number;
  totalNights: number;
} => {
  let apartmentRevenue = 0;
  let parkingRevenue = 0;
  let totalNights = 0;

  for (const booking of bookings) {
    if (!booking.startDate || !booking.endDate) continue;
    const breakdown = calculateBookingPriceFromStrings(
      booking.startDate,
      booking.endDate,
      booking.parking ?? false
    );
    apartmentRevenue += breakdown.apartmentSubtotal;
    parkingRevenue += breakdown.parkingSubtotal;
    totalNights += breakdown.nights;
  }

  return {
    apartmentRevenue,
    parkingRevenue,
    totalRevenue: apartmentRevenue + parkingRevenue,
    totalNights,
  };
};
