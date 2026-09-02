'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type DriverRegisterInput, driverRegisterSchema } from '@/lib/validation/driver';
import { zodResolver } from '@hookform/resolvers/zod';
import { Car, CheckCircle2, FileText, Loader2, ShieldCheck, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

const VEHICLE_TYPES: Array<{
  value: DriverRegisterInput['vehicle']['type'];
  label: string;
  icon: string;
}> = [
  { value: 'BIKE', label: 'Bike', icon: '🏍️' },
  { value: 'AUTO', label: 'Auto (3-Wheeler)', icon: '🛺' },
  { value: 'SEDAN', label: 'Sedan Economy', icon: '🚗' },
  { value: 'SUV', label: 'SUV XL', icon: '🚙' },
  { value: 'HATCHBACK', label: 'Hatchback', icon: '🚘' },
];

export function DriverRegisterForm(): React.ReactElement {
  const router = useRouter();
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
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
        type: 'BIKE',
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
        const errorMsg = json?.error?.message ?? 'Please verify your details and try again.';
        toast.error('Registration failed', {
          description: errorMsg,
        });

        // Set field errors if provided
        if (json?.error?.details?.fieldErrors) {
          const fe = json.error.details.fieldErrors;
          Object.keys(fe).forEach((key) => {
            setError(key as any, { message: fe[key][0] });
          });
        }
        return;
      }

      setSuccess(true);
      toast.success('Registration submitted!', {
        description: 'Your application is now submitted and active.',
      });
    } catch (err) {
      toast.error('Network error', {
        description: err instanceof Error ? err.message : 'Please check your connection.',
      });
    }
  };

  if (success) {
    return (
      <Card className="border-ryda-accent/40 bg-ryda-elevated/80 p-6 text-center shadow-xl">
        <CardContent className="space-y-4 pt-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="font-display text-2xl font-bold text-ryda-text">Application Submitted!</h2>
          <p className="text-sm text-ryda-muted">
            Thank you for registering to drive with Ryda in Bhopal. Your captain account has been
            recorded.
          </p>
          <div className="rounded-2xl border border-ryda-border bg-ryda-surface p-4 text-xs text-ryda-muted">
            You can now log in at <span className="font-bold text-ryda-accent-dim">/login</span> to
            access your <span className="font-bold text-ryda-text">Captain Portal</span>.
          </div>
          <Button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full bg-ryda-accent text-white font-bold hover:bg-ryda-accent-dim py-3 rounded-xl shadow-md"
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
      <div className="space-y-3 rounded-2xl border border-ryda-border bg-ryda-surface p-5 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-bold text-ryda-accent">
          <User className="h-4 w-4" />
          <span>1. Personal Information</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" placeholder="Shivam" {...register('firstName')} />
            {errors.firstName && (
              <p className="text-xs text-rose-500">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" placeholder="Kumar" {...register('lastName')} />
            {errors.lastName && <p className="text-xs text-rose-500">{errors.lastName.message}</p>}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="shivam@example.com"
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Mobile Number</Label>
            <Input id="phone" placeholder="9826001234 or +919826001234" {...register('phone')} />
            {errors.phone && <p className="text-xs text-rose-500">{errors.phone.message}</p>}
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters (1 letter + 1 number)"
            {...register('password')}
          />
          {errors.password && <p className="text-xs text-rose-500">{errors.password.message}</p>}
        </div>
      </div>

      {/* 2. License Details */}
      <div className="space-y-3 rounded-2xl border border-ryda-border bg-ryda-surface p-5 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-bold text-ryda-accent">
          <FileText className="h-4 w-4" />
          <span>2. Driving License</span>
        </div>
        <div className="space-y-1">
          <Label htmlFor="licenseNumber">Driving License Number</Label>
          <Input id="licenseNumber" placeholder="MP0420230012345" {...register('licenseNumber')} />
          {errors.licenseNumber && (
            <p className="text-xs text-rose-500">{errors.licenseNumber.message}</p>
          )}
        </div>
      </div>

      {/* 3. Vehicle Information */}
      <div className="space-y-3 rounded-2xl border border-ryda-border bg-ryda-surface p-5 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-bold text-ryda-accent">
          <Car className="h-4 w-4" />
          <span>3. Vehicle Information</span>
        </div>

        {/* Vehicle type selector */}
        <div className="space-y-1.5">
          <Label>Vehicle Type</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {VEHICLE_TYPES.map((vt) => {
              const active = selectedVehicleType === vt.value;
              return (
                <button
                  type="button"
                  key={vt.value}
                  onClick={() => setValue('vehicle.type', vt.value, { shouldValidate: true })}
                  className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'border-ryda-accent bg-ryda-accent/10 text-ryda-accent-dim shadow-xs ring-1 ring-ryda-accent'
                      : 'border-ryda-border bg-ryda-elevated/40 text-ryda-text hover:bg-ryda-elevated'
                  }`}
                >
                  <span className="text-base">{vt.icon}</span>
                  <span className="truncate">{vt.label}</span>
                </button>
              );
            })}
          </div>
          {errors.vehicle?.type && (
            <p className="text-xs text-rose-500">{errors.vehicle.type.message}</p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="make">Brand / Make</Label>
            <Input id="make" placeholder="e.g. Bajaj, Maruti, Hero" {...register('vehicle.make')} />
            {errors.vehicle?.make && (
              <p className="text-xs text-rose-500">{errors.vehicle.make.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              placeholder="e.g. Pulsar, Dzire, Splendor"
              {...register('vehicle.model')}
            />
            {errors.vehicle?.model && (
              <p className="text-xs text-rose-500">{errors.vehicle.model.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="licensePlate">Vehicle Number Plate</Label>
            <Input
              id="licensePlate"
              placeholder="MP04BC1234"
              {...register('vehicle.licensePlate')}
            />
            {errors.vehicle?.licensePlate && (
              <p className="text-xs text-rose-500">{errors.vehicle.licensePlate.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="color">Color</Label>
            <Input id="color" placeholder="Black / White" {...register('vehicle.color')} />
            {errors.vehicle?.color && (
              <p className="text-xs text-rose-500">{errors.vehicle.color.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="year">Manufacturing Year</Label>
            <Input
              id="year"
              type="number"
              placeholder="2022"
              {...register('vehicle.year', { valueAsNumber: true })}
            />
            {errors.vehicle?.year && (
              <p className="text-xs text-rose-500">{errors.vehicle.year.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-ryda-muted">
        <ShieldCheck className="mt-0.5 h-4 w-4 text-ryda-accent shrink-0" />
        <span>
          By submitting this application, you agree to Ryda&apos;s captain partner terms and safety
          policies in Bhopal.
        </span>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-ryda-accent text-white font-bold hover:bg-ryda-accent-dim py-4 rounded-2xl text-base shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting application…
          </>
        ) : (
          'Submit Captain Application'
        )}
      </Button>
    </form>
  );
}
