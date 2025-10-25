// app/services/driver.service.ts

import { Driver } from '../types';

export const driverService = {
  fetchDetails: async (driverId: string): Promise<Driver | null> => {
    try {
      const response = await fetch(`/api/drivers/${driverId}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      const driver = data.driver;
      
      if (!driver) return null;
      
      return {
        id: driver._id || driver.id,
        name: driver.fullName || driver.name || 
              `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 'Driver',
        email: driver.email,
        phone: driver.phone || driver.phoneNumber || '',
        licenseNumber: driver.driverLicense || driver.licenseNumber,
        vehicleNumber: driver.licensePlate || driver.vehicle?.number || 
                      driver.vehicleNumber || 'N/A',
        vehicleType: driver.vehicle?.type || driver.vehicleType || 'Car',
        vehicleColor: driver.vehicle?.color || driver.vehicleColor || 'Unknown',
        vehicleModel: driver.vehicleModel || driver.vehicle?.model || 'Unknown',
        vehicleBrand: driver.vehicle?.brand || driver.vehicleBrand || 'Unknown',
        vehicleYear: driver.vehicle?.year || driver.vehicleYear,
        rating: typeof driver.rating === 'number' ? driver.rating : 4.5,
        totalRides: driver.totalRides || driver.completedRides || 0,
        profileImage: driver.profileImage || driver.avatar,
        isAvailable: driver.isAvailable,
        currentLocation: driver.currentLocation,
        coords: driver.currentLocation?.coordinates || [0, 0] as [number, number],
        status: 'accepted' as const,
        estimatedArrival: driver.estimatedArrival
      };
    } catch (error) {
      console.error('Error fetching driver:', error);
      return null;
    }
  }
};