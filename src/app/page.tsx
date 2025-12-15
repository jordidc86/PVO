'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FlightPlanFormData, flightPlanSchema, Passenger } from '@/lib/schemas';
import { calculateLift, calculateAvailablePayload, calculateFuelReserve, isFuelReserveSufficient, fuelLitersToKg } from '@/lib/calculations';
import { fetchSegoviaWeather } from '@/lib/weather';
import { PILOTS, validatePilot } from '@/lib/pilots';
import { AIRCRAFT_FLEET } from '@/lib/aircraft';

export default function FlightPlanPage() {
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue, control } = useForm<FlightPlanFormData>({
    resolver: zodResolver(flightPlanSchema),
    defaultValues: {
      aircraftRegistration: '',
      aircraftType: '',
      flightDate: '',
      pilotDeclarationAlcoholDrugs: false,
      pilotDeclarationRest: false,
      pilotDeclarationPreFlight: false,
      passengers: [{ name: '', weight: 0 }],
      clothingLuggageIncluded: false,
      fuelTotalLiters: 0,
      fuelEstimatedConsumptionLiters: 0,
    },
  });


  const { fields, append, remove } = useFieldArray({
    control,
    name: 'passengers',
  });

  const watchedValues = watch();
  const selectedAircraft = AIRCRAFT_FLEET.find(a => a.registration === watchedValues.aircraftRegistration);

  // Calculate performance metrics
  const calculatedLift = watchedValues.temperatureCelsius && selectedAircraft
    ? calculateLift(selectedAircraft.volume_cubic_feet, watchedValues.temperatureCelsius, 1000)
    : 0;

  const fuelWeightKg = fuelLitersToKg(watchedValues.fuelTotalLiters || 0);
  const availablePayload = selectedAircraft
    ? calculateAvailablePayload(calculatedLift, selectedAircraft.empty_weight_kg, fuelWeightKg)
    : 0;

  const totalPassengerWeight = (watchedValues.passengers || []).reduce((sum, p) => sum + (p.weight || 0), 0);
  const clothingWeight = watchedValues.clothingLuggageIncluded ? (watchedValues.passengers?.length || 0) * 3 : 0;
  const totalWeight = totalPassengerWeight + clothingWeight;

  const fuelReserveMinutes = calculateFuelReserve(
    watchedValues.fuelTotalLiters || 0,
    watchedValues.fuelEstimatedConsumptionLiters || 0
  );
  const fuelReserveSufficient = isFuelReserveSufficient(fuelReserveMinutes);

  const loadWeightStatus = totalWeight <= availablePayload;

  const handleFetchWeather = async () => {
    setIsLoadingWeather(true);
    try {
      const weather = await fetchSegoviaWeather();
      setValue('temperatureCelsius', weather.surface.temperature);
      setValue('qnhHpa', weather.surface.pressure);
      setValue('windSurfaceSpeed', Math.round(weather.surface.windSpeed));
      setValue('windSurfaceDirection', Math.round(weather.surface.windDirection));
      setValue('windAltitude1000mSpeed', Math.round(weather.windsAloft[0]?.speed_kmh || 0));
      setValue('windAltitude1000mDirection', Math.round(weather.windsAloft[0]?.direction || 0));
      setValue('windAltitude2000mSpeed', Math.round(weather.windsAloft[1]?.speed_kmh || 0));
      setValue('windAltitude2000mDirection', Math.round(weather.windsAloft[1]?.direction || 0));
    } catch (error) {
      alert('Error fetching weather data');
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const onSubmit = async (data: FlightPlanFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/flight-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          calculatedLift,
          availablePayload,
          fuelReserveMinutes,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit');

      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      alert('Error submitting flight plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
            Operational Flight Plan
          </h1>
          <p className="text-foreground/70">EASA Balloon Flight Planning - Segovia</p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Aircraft Selection */}
          <section className="card">
            <h2 className="section-title">Aircraft Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Aircraft Registration</label>
                <select
                  {...register('aircraftRegistration')}
                  className="input"
                  onChange={(e) => {
                    const aircraft = AIRCRAFT_FLEET.find(a => a.registration === e.target.value);
                    if (aircraft) {
                      setValue('aircraftRegistration', aircraft.registration);
                      setValue('aircraftType', aircraft.model as any);
                    }
                  }}
                >
                  <option value="">Select Aircraft</option>
                  {AIRCRAFT_FLEET.map(aircraft => (
                    <option key={aircraft.registration} value={aircraft.registration}>
                      {aircraft.registration} - {aircraft.model}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Model</label>
                <input {...register('aircraftType')} className="input" placeholder="Auto-filled" readOnly />
              </div>
            </div>

            {/* Equipment Details */}
            {watchedValues.aircraftRegistration && (() => {
              const aircraft = AIRCRAFT_FLEET.find(a => a.registration === watchedValues.aircraftRegistration);
              if (aircraft) {
                return (
                  <div className="mt-4 p-4 bg-input-bg/50 rounded-lg border border-input-border">
                    <h3 className="font-bold text-accent mb-2">Equipment Configuration</h3>
                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                      <div><span className="text-foreground/60">Serial Number:</span> {aircraft.serialNumber}</div>
                      <div><span className="text-foreground/60">Volume:</span> {aircraft.volume_cubic_feet.toLocaleString()} ft³</div>
                      <div><span className="text-foreground/60">Envelope:</span> {aircraft.envelope}</div>
                      <div><span className="text-foreground/60">Basket:</span> {aircraft.basket}</div>
                      <div><span className="text-foreground/60">Burner:</span> {aircraft.burner}</div>
                      <div><span className="text-foreground/60">Cylinders:</span> {aircraft.cylinders}</div>
                      <div className="md:col-span-2"><span className="text-foreground/60">Empty Weight:</span> <span className="font-bold text-accent">{aircraft.empty_weight_kg} kg</span></div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </section>

          {/* Flight Details */}
          <section className="card">
            <h2 className="section-title">Flight Details</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="label">Flight Date</label>
                <input type="date" {...register('flightDate')} className="input" />
                {errors.flightDate && <p className="error">{errors.flightDate.message}</p>}
              </div>
              <div>
                <label className="label">Pilot</label>
                <select
                  {...register('pilotName')}
                  className="input"
                  onChange={(e) => {
                    const pilot = PILOTS.find(p => p.name === e.target.value);
                    if (pilot) {
                      setValue('pilotName', pilot.name);
                      setValue('pilotLicense', pilot.licenseNumber);
                    }
                  }}
                >
                  <option value="">Select Pilot</option>
                  {PILOTS.map(pilot => (
                    <option key={pilot.id} value={pilot.name}>
                      {pilot.name} {!pilot.isValid && '⚠️'}
                    </option>
                  ))}
                </select>
                {errors.pilotName && <p className="error">{errors.pilotName.message}</p>}
                {watchedValues.pilotName && (() => {
                  const selectedPilot = PILOTS.find(p => p.name === watchedValues.pilotName);
                  if (selectedPilot) {
                    const validation = validatePilot(selectedPilot);
                    if (validation.warnings.length > 0) {
                      return (
                        <div className="mt-2 p-2 bg-warning/20 border border-warning rounded text-sm">
                          <div className="font-bold">⚠️ Warnings:</div>
                          {validation.warnings.map((w, i) => <div key={i}>• {w}</div>)}
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
              </div>
              <div>
                <label className="label">License</label>
                <input {...register('pilotLicense')} className="input" placeholder="Auto-filled" readOnly />
              </div>
            </div>
          </section>

          {/* Pilot Declaration */}
          <section className="card">
            <h2 className="section-title">Pilot Pre-Flight Declaration</h2>
            <p className="text-sm text-foreground/70 mb-4">
              As Pilot-in-Command, I declare that:
            </p>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer p-3 bg-input-bg/50 rounded-lg border border-input-border hover:border-primary transition-colors">
                <input
                  type="checkbox"
                  {...register('pilotDeclarationAlcoholDrugs')}
                  className="w-5 h-5 mt-0.5"
                />
                <div>
                  <div className="font-medium">No Alcohol or Drugs</div>
                  <div className="text-sm text-foreground/60">I have not consumed alcohol or drugs that may affect my ability to operate the aircraft safely</div>
                </div>
              </label>
              {errors.pilotDeclarationAlcoholDrugs && <p className="error">{errors.pilotDeclarationAlcoholDrugs.message}</p>}

              <label className="flex items-start gap-3 cursor-pointer p-3 bg-input-bg/50 rounded-lg border border-input-border hover:border-primary transition-colors">
                <input
                  type="checkbox"
                  {...register('pilotDeclarationRest')}
                  className="w-5 h-5 mt-0.5"
                />
                <div>
                  <div className="font-medium">Adequate Rest</div>
                  <div className="text-sm text-foreground/60">I have had adequate rest as required by EASA regulations and am fit to fly</div>
                </div>
              </label>
              {errors.pilotDeclarationRest && <p className="error">{errors.pilotDeclarationRest.message}</p>}

              <label className="flex items-start gap-3 cursor-pointer p-3 bg-input-bg/50 rounded-lg border border-input-border hover:border-primary transition-colors">
                <input
                  type="checkbox"
                  {...register('pilotDeclarationPreFlight')}
                  className="w-5 h-5 mt-0.5"
                />
                <div>
                  <div className="font-medium">Pre-Flight Inspection Completed</div>
                  <div className="text-sm text-foreground/60">I have completed the mandatory pre-flight inspection and the aircraft is airworthy</div>
                </div>
              </label>
              {errors.pilotDeclarationPreFlight && <p className="error">{errors.pilotDeclarationPreFlight.message}</p>}
            </div>
          </section>

          {/* Weather */}
          <section className="card">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="section-title mb-0">Weather Data</h2>
                <p className="text-sm text-foreground/60 mt-1">Source: OpenMeteo API (Segovia: 40.9429°N, 4.1088°W)</p>
              </div>
              <button
                type="button"
                onClick={handleFetchWeather}
                disabled={isLoadingWeather}
                className="btn-secondary"
              >
                {isLoadingWeather ? 'Loading...' : '🌤️ Fetch Live Weather'}
              </button>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="label">Temperature (°C)</label>
                <input type="number" step="0.1" {...register('temperatureCelsius', { valueAsNumber: true })} className="input" />
                {errors.temperatureCelsius && <p className="error">{errors.temperatureCelsius.message}</p>}
              </div>
              <div>
                <label className="label">QNH (hPa)</label>
                <input type="number" {...register('qnhHpa', { valueAsNumber: true })} className="input" />
              </div>
              <div>
                <label className="label">Wind Surface (km/h)</label>
                <input type="number" {...register('windSurfaceSpeed', { valueAsNumber: true })} className="input" />
              </div>
              <div>
                <label className="label">Direction (°)</label>
                <input type="number" {...register('windSurfaceDirection', { valueAsNumber: true })} className="input" />
              </div>
            </div>
            <div className="grid md:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="label">Wind @ 1000m (km/h)</label>
                <input type="number" {...register('windAltitude1000mSpeed', { valueAsNumber: true })} className="input" />
              </div>
              <div>
                <label className="label">Direction (°)</label>
                <input type="number" {...register('windAltitude1000mDirection', { valueAsNumber: true })} className="input" />
              </div>
              <div>
                <label className="label">Wind @ 2000m (km/h)</label>
                <input type="number" {...register('windAltitude2000mSpeed', { valueAsNumber: true })} className="input" />
              </div>
              <div>
                <label className="label">Direction (°)</label>
                <input type="number" {...register('windAltitude2000mDirection', { valueAsNumber: true })} className="input" />
              </div>
            </div>
          </section>

          {/* Performance Calculations */}
          <section className="card bg-gradient-to-br from-card-bg to-primary/5">
            <h2 className="section-title">Performance Calculations</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="stat-card">
                <div className="stat-label">Calculated Lift</div>
                <div className="stat-value">{calculatedLift.toFixed(1)} kg</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Balloon Empty Weight</div>
                <div className="stat-value">{selectedAircraft?.empty_weight_kg || 0} kg</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Available Payload</div>
                <div className={`stat-value ${loadWeightStatus ? 'text-success' : 'text-danger'}`}>
                  {availablePayload.toFixed(1)} kg
                </div>
              </div>
            </div>
          </section>

          {/* Passengers */}
          <section className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="section-title mb-0">Passenger Manifest</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    alert('Google Calendar integration requires OAuth2 setup. See documentation for configuration instructions.');
                  }}
                  className="btn-secondary"
                >
                  📅 Import from Calendar
                </button>
                <button type="button" onClick={() => append({ name: '', weight: 0 })} className="btn-secondary">
                  + Add Passenger
                </button>
              </div>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="grid md:grid-cols-3 gap-4 mb-3">
                <div className="md:col-span-2">
                  <label className="label">Name</label>
                  <input {...register(`passengers.${index}.name`)} className="input" placeholder="Passenger name" />
                  {errors.passengers?.[index]?.name && <p className="error">{errors.passengers[index]?.name?.message}</p>}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="label">Weight (kg)</label>
                    <input type="number" {...register(`passengers.${index}.weight`, { valueAsNumber: true })} className="input" />
                    {errors.passengers?.[index]?.weight && <p className="error">{errors.passengers[index]?.weight?.message}</p>}
                  </div>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="btn-danger mt-6">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="mt-4 p-4 bg-input-bg rounded-lg border border-input-border">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('clothingLuggageIncluded')} className="w-5 h-5" />
                <span>Include clothing & luggage weight (+3kg per passenger)</span>
              </label>
              <div className="mt-2 text-sm text-foreground/70">
                Total Weight: <span className={`font-bold ${loadWeightStatus ? 'text-success' : 'text-danger'}`}>
                  {totalWeight} kg
                </span> / {availablePayload.toFixed(1)} kg available
              </div>
            </div>
          </section>

          {/* Fuel */}
          <section className="card">
            <h2 className="section-title">Fuel Management</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Total Fuel (Liters)</label>
                <input type="number" step="0.1" {...register('fuelTotalLiters', { valueAsNumber: true })} className="input" />
                {errors.fuelTotalLiters && <p className="error">{errors.fuelTotalLiters.message}</p>}
              </div>
              <div>
                <label className="label">Estimated Consumption (Liters)</label>
                <input type="number" step="0.1" {...register('fuelEstimatedConsumptionLiters', { valueAsNumber: true })} className="input" />
                {errors.fuelEstimatedConsumptionLiters && <p className="error">{errors.fuelEstimatedConsumptionLiters.message}</p>}
              </div>
            </div>
            <div className={`mt-4 p-4 rounded-lg border-2 ${fuelReserveSufficient ? 'bg-success/10 border-success' : 'bg-danger/10 border-danger'}`}>
              <div className="font-bold text-lg">
                {fuelReserveSufficient ? '✓' : '✗'} Fuel Reserve: {fuelReserveMinutes} minutes
              </div>
              <div className="text-sm mt-1">
                {fuelReserveSufficient ? 'Reserve meets EASA requirement (≥30 min)' : 'WARNING: Reserve below 30 minutes!'}
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex gap-4">
            <button type="submit" disabled={isSubmitting || !loadWeightStatus || !fuelReserveSufficient} className="btn-primary flex-1">
              {isSubmitting ? 'Submitting...' : '✈️ Submit Flight Plan'}
            </button>
          </div>

          {submitSuccess && (
            <div className="p-4 bg-success/20 border-2 border-success rounded-lg text-center">
              ✓ Flight plan submitted successfully! Email sent to info@voyagerballoons.com
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
