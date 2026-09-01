'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Car, CheckCircle2, FileText, Loader2, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { driverRegisterSchema, type DriverRegisterInput } from '@/lib/validation/driver';

const VEHICLE_TYPES: Array<{ value: DriverRegisterInput['vehicle']['type']; label: string; icon: string }> = [
  { value: 'SEDAN', label: 'Sedan', icon: '🚗' },
  { value: 'SUV', label: 'SUV', icon: '🚙' },
  { value: 'HATCHBACK', label: 'Hatchback', icon: '🚘' },
  { value: 'AUTO', label: 'Auto (3-Wheeler)', icon: '🛺' },
  { value: 'BIKE', label: 'Bike', icon: '🏍️' },
];

export function DriverRegisterForm(): React.ReactElement {
  const router = useRouter();
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DriverRegisterInput>({
    resolver: zodResolver(driverRegisterSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      licenseNumber: '',
      licenseFrontUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600',
      licenseBackUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600',
      vehicle: {
        make: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        licensePlate: '',
        type: 'SEDAN',
      },
    },
  });

  const selectedVehicleType = watch('vehicle.type');

  const onSubmit = async (values: DriverRegisterInput): Promise<void> => {
    try {
      const res = await fetch('/api/auth/driver-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || json?.error) {
        toast.error('Registration failed', {
          description: json?.error?.message ?? 'Please verify your details and try again.',
        });
        return;
      }

      setSuccess(true);
      toast.success('Registration submitted!', {
        description: 'Your application is now under admin review.',
      });
    } catch (err) {
      toast.error('Network error', {
        description: err instanceof Error ? err.message : 'Please check your connection.',
      });
    }
  };

  if (success) {
    return (
      <Card className="border-ryda-accent/40 bg-ryda-elevated/80 p-6 text-center">
        <CardContent className="space-y-4 pt-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ryda-accent/15 text-ryda-accent">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="font-display text-2xl font-bold text-ryda-text">Application Submitted!</h2>
          <p className="text-sm text-ryda-muted">
            Thank you for registering to drive with Ryda in Bhopal. An admin will verify your driving license and vehicle registration.
          </p>
          <div className="rounded-lg border border-ryda-border bg-ryda-bg/50 p-4 text-xs text-ryda-muted">
            Once approved, you can log in at <span className="font-mono text-ryda-accent">/login</span> to go online and accept rides.
          </div>
          <Button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full bg-ryda-accent text-ryda-bg hover:bg-ryda-accent-dim"
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* 1. Personal Information */}
      <div className="space-y-3 rounded-xl border border-ryda-border bg-ryda-elevated/40 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ryda-accent">
          <User className="h-4 w-4" />
          <span>1. Personal Information</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" placeholder="Imran" {...register('firstName')} />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" placeholder="Khan" {...register('lastName')} />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="imran@example.com" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Phone (+91 format)</Label>
            <Input id="phone" placeholder="+919826001234" {...register('phone')} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="At least 8 characters" {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
      </div>

      {/* 2. License Details */}
      <div className="space-y-3 rounded-xl border border-ryda-border bg-ryda-elevated/40 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ryda-accent">
          <FileText className="h-4 w-4" />
          <span>2. Driving License</span>
        </div>
        <div className="space-y-1">
          <Label htmlFor="licenseNumber">Driving License Number</Label>
          <Input id="licenseNumber" placeholder="MP04-20220019281" {...register('licenseNumber')} />
          {errors.licenseNumber && <p className="text-xs text-destructive">{errors.licenseNumber.message}</p>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="licenseFrontUrl">License Front Photo URL</Label>
            <Input id="licenseFrontUrl" placeholder="https://..." {...register('licenseFrontUrl')} />
            {errors.licenseFrontUrl && <p className="text-xs text-destructive">{errors.licenseFrontUrl.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="licenseBackUrl">License Back Photo URL</Label>
            <Input id="licenseBackUrl" placeholder="https://..." {...register('licenseBackUrl')} />
            {errors.licenseBackUrl && <p className="text-xs text-destructive">{errors.licenseBackUrl.message}</p>}
          </div>
        </div>
      </div>

      {/* 3. Vehicle Information */}
      <div className="space-y-3 rounded-xl border border-ryda-border bg-ryda-elevated/40 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ryda-accent">
          <Car className="h-4 w-4" />
          <span>3. Vehicle Information</span>
        </div>

        {/* Vehicle Type Selection */}
        <div className="space-y-1.5">
          <Label>Vehicle Type</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {VEHICLE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setValue('vehicle.type', t.value, { shouldValidate: true })}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs transition-all ${
                  selectedVehicleType === t.value
                    ? 'border-ryda-accent bg-ryda-accent/15 text-ryda-text font-medium ring-1 ring-ryda-accent'
                    : 'border-ryda-border bg-ryda-bg/40 text-ryda-muted hover:border-ryda-accent/40'
                }`}
              >
                <span className="text-base">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="vehicleMake">Make (Manufacturer)</Label>
            <Input id="vehicleMake" placeholder="Maruti Suzuki / Hyundai / Tata" {...register('vehicle.make')} />
            {errors.vehicle?.make && <p className="text-xs text-destructive">{errors.vehicle.make.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="vehicleModel">Model</Label>
            <Input id="vehicleModel" placeholder="Dzire / WagonR / Creta" {...register('vehicle.model')} />
            {errors.vehicle?.model && <p className="text-xs text-destructive">{errors.vehicle.model.message}</p>}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="vehicleYear">Year</Label>
            <Input
              id="vehicleYear"
              type="number"
              placeholder="2022"
              {...register('vehicle.year', { valueAsNumber: true })}
            />
            {errors.vehicle?.year && <p className="text-xs text-destructive">{errors.vehicle.year.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="vehicleColor">Color</Label>
            <Input id="vehicleColor" placeholder="White / Silver / Black" {...register('vehicle.color')} />
            {errors.vehicle?.color && <p className="text-xs text-destructive">{errors.vehicle.color.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="licensePlate">License Plate</Label>
            <Input id="licensePlate" placeholder="MP04 AB 1234" {...register('vehicle.licensePlate')} />
            {errors.vehicle?.licensePlate && (
              <p className="text-xs text-destructive">{errors.vehicle.licensePlate.message}</p>
            )}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-ryda-accent text-ryda-bg hover:bg-ryda-accent-dim py-6 text-base font-semibold"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Submitting Application…
          </>
        ) : (
          <>
            <ShieldCheck className="mr-2 h-5 w-5" />
            Submit Driver Application
          </>
        )}
      </Button>
    </form>
  );
}
