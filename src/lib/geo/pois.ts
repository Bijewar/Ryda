/**
 * Bhopal Points of Interest (POIs) — shared between client UI components,
 * autocomplete, seed scripts, and simulation helpers.
 */
export const BHOPAL_POIS: ReadonlyArray<{
  name: string;
  landmark?: string;
  lng: number;
  lat: number;
}> = [
  {
    name: 'Raja Bhoj Airport (BHO)',
    landmark: 'Gandhi Nagar, Airport Road',
    lng: 77.3377,
    lat: 23.2875,
  },
  {
    name: 'MP Nagar Zone 1',
    landmark: 'Commercial Hub, Near Chetak Bridge',
    lng: 77.4321,
    lat: 23.2419,
  },
  { name: 'MP Nagar Zone 2', landmark: 'Coaching & Business Center', lng: 77.4365, lat: 23.238 },
  { name: 'DB City Mall', landmark: 'Arera Hills, MP Nagar', lng: 77.433, lat: 23.2325 },
  { name: 'New Market', landmark: 'TT Nagar, Shopping District', lng: 77.4036, lat: 23.2347 },
  {
    name: 'Rani Kamlapati Railway Station (RKMP)',
    landmark: 'Habibganj, World Class Station',
    lng: 77.442,
    lat: 23.2185,
  },
  {
    name: 'Bhopal Junction Railway Station',
    landmark: 'Old City, Platform 1 & 6',
    lng: 77.4111,
    lat: 23.2667,
  },
  { name: 'AIIMS Bhopal', landmark: 'Saket Nagar, Hospital Complex', lng: 77.46, lat: 23.208 },
  {
    name: 'Upper Lake (Bhojtal / VIP Road)',
    landmark: 'Boat Club & Lake View',
    lng: 77.385,
    lat: 23.245,
  },
  { name: 'Van Vihar National Park', landmark: 'Lake View Road', lng: 77.368, lat: 23.229 },
  { name: 'Aura Mall', landmark: 'Gulmohar, Trilanga', lng: 77.438, lat: 23.189 },
  {
    name: 'Arera Colony (E-1 to E-8)',
    landmark: 'Residential & Food Street',
    lng: 77.4483,
    lat: 23.2128,
  },
  { name: 'Bittan Market', landmark: 'E-5 Arera Colony, Haat Bazar', lng: 77.435, lat: 23.215 },
  { name: '10 No. Market', landmark: 'E-4 Arera Colony', lng: 77.43, lat: 23.22 },
  { name: 'Shahpura Lake', landmark: 'Chinar Park, Sector B', lng: 77.442, lat: 23.196 },
  { name: 'Kolar Road', landmark: 'Sarvadharma, D-Kolar', lng: 77.428, lat: 23.185 },
  { name: 'MANIT Bhopal', landmark: 'Maulana Azad NIT Campus', lng: 77.408, lat: 23.216 },
  { name: 'IISER Bhopal', landmark: 'Bhauri Bypass Campus', lng: 77.276, lat: 23.284 },
  { name: 'BHEL Bhopal', landmark: 'Govindpura, Industrial Area', lng: 77.473, lat: 23.273 },
  {
    name: 'Bairagarh (Sant Hirdaram Nagar)',
    landmark: 'Cloth Market & Station',
    lng: 77.34,
    lat: 23.278,
  },
  { name: 'Lalghati Square', landmark: 'VIP Road Junction & Halalpura', lng: 77.362, lat: 23.279 },
  {
    name: 'ISBT Bhopal',
    landmark: 'Inter-State Bus Terminal, Hoshangabad Rd',
    lng: 77.449,
    lat: 23.231,
  },
  { name: 'Ashoka Garden', landmark: '80 Feet Road, Prabhat Square', lng: 77.428, lat: 23.262 },
  { name: 'Ayodhya Bypass', landmark: 'Minal Residency, JK Road', lng: 77.482, lat: 23.268 },
];
