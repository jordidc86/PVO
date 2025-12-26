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
      flightID: `FLT-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      preparedBy: '',
      aircraftRegistration: '',
      aircraftType: '',
      massDeterminationMethod: 'declared',
      flightDate: new Date().toISOString().split('T')[0],
      pilotName: '',
      pilotLicense: '',
      weatherSource: 'OpenMeteo API + Visual Observation',
      weatherObsInSitu: '',
      airspaceAffected: 'Segovia CTR/LEST Area',
      notamsChecked: false,
      notamReference: '',
      frequenciesATS: 'Madrid Info: 124.925',
      alternativePlan: 'Cancel flight / Landing in designated safe area',
      alternativeCriteria: 'Wind > 15kt / Low clouds < 1000ft',
      meteoMinimaVFR: false,
      afmLimitationsCheck: false,
      takeOffConditionsOK: false,
      landingConditionsOK: false,
      pilotDeclarationAlcoholDrugs: false,
      pilotDeclarationRest: false,
      pilotDeclarationPreFlight: false,
      noSmoking: false,
      noWeapons: false,
      passengers: [{ name: '', weight: 0, hasSpecialNeeds: false }],
      clothingLuggageIncluded: false,
      passengerBriefingCompleted: false,
      dangerousGoodsBriefing: false,
      fuelTotalLiters: 0,
      fuelEstimatedConsumptionLiters: 0,
      fuelReserveCriterion: '30min',
      fuelReserveJustification: '',
      fuelConsumptionSource: 'Manufacturer Datasheet',
      riskCheckPowerLines: false,
      riskCheckSolarCells: false,
      riskCheckWildlifeAreas: false,
      riskCheckCityCenterNoWind: false,
      landingOptionsTypical: 'Villacastín area, open fields North of Segovia',
      landingOptionsAvoid: 'Forest areas East, urban center',
      atsFplStatus: 'no',
    },
  });


  const { fields, append, remove } = useFieldArray({
    control,
    name: 'passengers',
  });

  const watchedValues = watch();
  const selectedAircraft = AIRCRAFT_FLEET.find(a => a.registration === watchedValues.aircraftRegistration);

  // Calculate performance metrics
  const calculatedLift = (watchedValues.temperatureCelsius || watchedValues.temperatureCelsius === 0) && selectedAircraft
    ? calculateLift(selectedAircraft.volume_cubic_feet, watchedValues.temperatureCelsius, 1000)
    : 0;

  const fuelWeightKg = fuelLitersToKg(watchedValues.fuelTotalLiters || 0);
  const totalPassengerWeight = (watchedValues.passengers || []).reduce((sum, p) => sum + (p.weight || 0), 0);
  const clothingWeight = watchedValues.clothingLuggageIncluded ? (watchedValues.passengers?.length || 0) * 3 : 0;
  const trafficLoad = totalPassengerWeight + clothingWeight;

  const takeOffMass = selectedAircraft
    ? selectedAircraft.empty_weight_kg + fuelWeightKg + trafficLoad
    : 0;

  const mtomKg = selectedAircraft?.mtom_kg || 0;
  const isTOMValid = mtomKg > 0 ? takeOffMass <= mtomKg : true;

  const availablePayload = selectedAircraft
    ? calculateAvailablePayload(calculatedLift, selectedAircraft.empty_weight_kg, fuelWeightKg)
    : 0;

  const loadWeightStatus = trafficLoad <= availablePayload;

  const fuelReserveMinutes = calculateFuelReserve(
    watchedValues.fuelTotalLiters || 0,
    watchedValues.fuelEstimatedConsumptionLiters || 0
  );
  const fuelReserveSufficient = isFuelReserveSufficient(fuelReserveMinutes, watchedValues.fuelReserveCriterion);

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
      // Generate summary text
      const summary = generateFlightPlanSummary(data);

      // Copy to clipboard
      await navigator.clipboard.writeText(summary);

      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      alert('Error generating flight plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateFlightPlanSummary = (data: FlightPlanFormData): string => {
    const totalPaxWeight = data.passengers.reduce((sum, p) => sum + p.weight, 0);
    const clothingWeight = data.clothingLuggageIncluded ? data.passengers.length * 3 : 0;

    return `
OPERATIONAL FLIGHT PLAN
========================

AIRCRAFT INFORMATION
--------------------
Registration: ${data.aircraftRegistration || 'N/A'}
Type: ${data.aircraftType || 'N/A'}

FLIGHT DETAILS
--------------
Date: ${data.flightDate}
Pilot: ${data.pilotName}
License: ${data.pilotLicense || 'N/A'}

PILOT DECLARATION
-----------------
✓ No alcohol or drugs consumed
✓ Adequate rest as per EASA regulations
✓ Pre-flight inspection completed

WEATHER CONDITIONS
------------------
Source: OpenMeteo API (Segovia: 40.9429°N, 4.1088°W)
Temperature: ${data.temperatureCelsius}°C
QNH: ${data.qnhHpa || 'N/A'} hPa
Surface Wind: ${data.windSurfaceSpeed || 'N/A'} km/h @ ${data.windSurfaceDirection || 'N/A'}°
Wind @ 1000m: ${data.windAltitude1000mSpeed || 'N/A'} km/h @ ${data.windAltitude1000mDirection || 'N/A'}°
Wind @ 2000m: ${data.windAltitude2000mSpeed || 'N/A'} km/h @ ${data.windAltitude2000mDirection || 'N/A'}°

PERFORMANCE CALCULATIONS
------------------------
Calculated Lift: ${calculatedLift.toFixed(2)} kg
Available Payload: ${availablePayload.toFixed(2)} kg

PASSENGER MANIFEST
------------------
${data.passengers.map((p, i) => `${i + 1}. ${p.name} - ${p.weight} kg`).join('\n')}

Total Passenger Weight: ${totalPaxWeight} kg
Clothing/Luggage Weight Included: ${data.clothingLuggageIncluded ? 'YES (+' + clothingWeight + 'kg)' : 'NO'}
Total Weight: ${totalPaxWeight + clothingWeight} kg

FUEL MANAGEMENT
---------------
Total Fuel: ${data.fuelTotalLiters} L
Estimated Consumption: ${data.fuelEstimatedConsumptionLiters} L
Reserve: ${fuelReserveMinutes} minutes
Reserve Sufficient (≥30 min): ${fuelReserveSufficient ? 'YES ✓' : 'NO ✗'}

========================
Generated: ${new Date().toISOString()}
    `.trim();
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
          {/* Section 1: Identification & Preparation */}
          <section className="card">
            <h2 className="section-title">1. Identification & Preparation</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="label">Flight ID</label>
                <input {...register('flightID')} className="input" placeholder="FLT-2025-XXX" />
              </div>
              <div>
                <label className="label">Prepared By</label>
                <input {...register('preparedBy')} className="input" placeholder="Name of person preparing" />
                {errors.preparedBy && <p className="error">{errors.preparedBy.message}</p>}
              </div>
              <div>
                <label className="label">Flight Date</label>
                <input type="date" {...register('flightDate')} className="input" />
                {errors.flightDate && <p className="error">{errors.flightDate.message}</p>}
              </div>
              <div>
                <label className="label">ATS FPL Status</label>
                <select {...register('atsFplStatus')} className="input">
                  <option value="yes">Presented</option>
                  <option value="no">Not Presented</option>
                  <option value="not_required">Not Required</option>
                </select>
              </div>
            </div>

            {watchedValues.atsFplStatus === 'yes' && (
              <div className="mt-4">
                <label className="label">FPL Reference</label>
                <input {...register('atsFplRef')} className="input" placeholder="e.g. LEST1234" />
              </div>
            )}

            {watchedValues.atsFplStatus === 'no' && (
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Alerting Responsible Person</label>
                  <input {...register('alertingResponsiblePerson')} className="input" placeholder="Name/Contact" />
                </div>
                <div className="flex items-center gap-2 mt-8">
                  <input type="checkbox" {...register('alertingOverdueProcedure')} id="alertingOverdue" className="w-5 h-5" />
                  <label htmlFor="alertingOverdue" className="cursor-pointer">Overdue procedure briefed</label>
                </div>
              </div>
            )}
          </section>

          {/* Section 2: Aircraft & Mass Identification */}
          <section className="card">
            <h2 className="section-title">2. Aircraft & Mass System</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="label">Registration</label>
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
                      {aircraft.registration} ({aircraft.model})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Determination Method</label>
                <input className="input" value="Declared (Standard)" readOnly />
              </div>
              <div>
                <label className="label">MTOM (kg)</label>
                <input className="input" value={selectedAircraft?.mtom_kg || 0} readOnly />
              </div>
            </div>

            {selectedAircraft && (
              <div className="mt-4 p-4 bg-input-bg/30 rounded-lg border border-input-border grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                <div><span className="text-foreground/50">S/N:</span> {selectedAircraft.serialNumber}</div>
                <div><span className="text-foreground/50">Volume:</span> {selectedAircraft.volume_cubic_feet}ft³</div>
                <div className="col-span-2"><span className="text-foreground/50">Config:</span> {selectedAircraft.envelope} / {selectedAircraft.basket}</div>
              </div>
            )}
          </section>

          {/* Section 3: Pilot & Legal Declarations */}
          <section className="card">
            <h2 className="section-title">3. Pilot & Operational Declaration</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Pilot-in-Command</label>
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
                    <option key={pilot.id} value={pilot.name}>{pilot.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">License Number</label>
                <input {...register('pilotLicense')} className="input" readOnly placeholder="Auto-filled" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
              {[
                { id: 'pilotDeclarationAlcoholDrugs', label: 'No Alcohol/Drugs' },
                { id: 'pilotDeclarationRest', label: 'Adequate Rest' },
                { id: 'pilotDeclarationPreFlight', label: 'Pre-flight Inspection OK' },
                { id: 'noSmoking', label: 'No Smoking in/around balloon' },
                { id: 'noWeapons', label: 'No Weapons on board' },
                { id: 'meteoMinimaVFR', label: 'Meteo >= VFR Minima' },
                { id: 'afmLimitationsCheck', label: 'Within AFM Limitations' },
                { id: 'takeOffConditionsOK', label: 'Take-off Area OK' },
                { id: 'landingConditionsOK', label: 'Landing Forecast OK' }
              ].map(item => (
                <label key={item.id} className="flex items-center gap-3 p-2 bg-input-bg/40 rounded hover:bg-input-bg/60 cursor-pointer transition-colors text-sm">
                  <input type="checkbox" {...register(item.id as any)} className="w-4 h-4" />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Section 4: Aeronautical & Weather Info */}
          <section className="card">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <h2 className="section-title mb-0">4. Aeronautical & Weather Information</h2>
              <button type="button" onClick={handleFetchWeather} disabled={isLoadingWeather} className="btn-secondary whitespace-nowrap">
                {isLoadingWeather ? 'Loading...' : '🌤️ Fetch Live Weather'}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Weather Source(s)</label>
                <input {...register('weatherSource')} className="input" placeholder="e.g. OpenMeteo, AEMET, Windy" />
              </div>
              <div>
                <label className="label">In Situ Observation</label>
                <input {...register('weatherObsInSitu')} className="input" placeholder="Visibility, clouds, actual wind" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="label">Temp (°C)</label>
                <input type="number" step="0.1" {...register('temperatureCelsius', { valueAsNumber: true })} className="input" />
              </div>
              <div>
                <label className="label">QNH (hPa)</label>
                <input type="number" {...register('qnhHpa', { valueAsNumber: true })} className="input" />
              </div>
              <div className="lg:col-span-2">
                <label className="label">Frequencies / ATS Info</label>
                <input {...register('frequenciesATS')} className="input" placeholder="e.g. Segovia Info 118.0, Madrid Info 124.9" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Airspace Affected</label>
                <input {...register('airspaceAffected')} className="input" placeholder="e.g. Segovia CTR, LER-56" />
              </div>
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 mb-2 label cursor-pointer">
                  <input type="checkbox" {...register('notamsChecked')} className="w-5 h-5" />
                  <span>NOTAMs Checked</span>
                </label>
                <input {...register('notamReference')} className="input" placeholder="Reference or valid until" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
              <h3 className="col-span-full text-sm font-bold opacity-70">Plan B: Alternative Course of Action</h3>
              <div>
                <label className="label">Alternative Plan</label>
                <textarea {...register('alternativePlan')} className="input text-sm h-20" placeholder="Where to go if main zone is blocked" />
              </div>
              <div>
                <label className="label">Evaluation Criteria</label>
                <textarea {...register('alternativeCriteria')} className="input text-sm h-20" placeholder="Minimums or triggers for Plan B" />
              </div>
            </div>
          </section>

          {/* Section 5: Mass & Performance */}
          <section className="card">
            <h2 className="section-title">5. Mass & Performance Verification</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="stat-card">
                <div className="stat-label">Empty Mass</div>
                <div className="stat-value text-sm">{selectedAircraft?.empty_weight_kg || 0} kg</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Fuel Mass</div>
                <div className="stat-value text-sm">{fuelWeightKg.toFixed(1)} kg</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Take-Off Mass (TOM)</div>
                <div className={`stat-value text-lg ${isTOMValid ? 'text-success' : 'text-danger'}`}>
                  {takeOffMass.toFixed(1)} kg
                </div>
                <div className="text-[10px] opacity-70">Limit (MTOM): {mtomKg} kg</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Calculated Lift @ 100°C</div>
                <div className="stat-value text-lg text-accent">{calculatedLift.toFixed(1)} kg</div>
              </div>
            </div>

            <div className="stat-card bg-primary/10 border-primary/20 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="stat-label">Payload Margin</div>
                  <div className={`text-2xl font-bold ${loadWeightStatus ? 'text-success' : 'text-danger'}`}>
                    {(availablePayload - trafficLoad).toFixed(1)} kg
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs opacity-60">Available Payload: {availablePayload.toFixed(1)} kg</div>
                  <div className="text-xs opacity-60">Traffic Load: {trafficLoad} kg</div>
                </div>
              </div>
              {!loadWeightStatus && <p className="text-danger text-xs font-bold mt-2">⚠️ OVERLOAD: Reduced life expectancy of envelope or safety risk!</p>}
              {!isTOMValid && <p className="text-danger text-xs font-bold mt-1">⚠️ EXCEEDS MTOM: Restricted by AFM!</p>}
            </div>
          </section>

          {/* Section 6: Passenger Manifest & Briefing */}
          <section className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="section-title mb-0">6. Passenger Manifest</h2>
              <button type="button" onClick={() => append({ name: '', weight: 0, hasSpecialNeeds: false })} className="btn-secondary text-xs">
                + Add Passenger
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="grid md:grid-cols-12 gap-3 items-end p-3 bg-input-bg/20 rounded border border-input-border/30">
                  <div className="md:col-span-6">
                    <label className="text-[10px] uppercase opacity-50 block mb-1">Full Name</label>
                    <input {...register(`passengers.${index}.name`)} className="input text-sm" placeholder="Passenger name" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] uppercase opacity-50 block mb-1">Weight (kg)</label>
                    <input type="number" {...register(`passengers.${index}.weight`, { valueAsNumber: true })} className="input text-sm text-center" />
                  </div>
                  <div className="md:col-span-3 flex items-center h-full gap-2">
                    <input type="checkbox" {...register(`passengers.${index}.hasSpecialNeeds`)} className="w-4 h-4" />
                    <span className="text-[10px] uppercase opacity-70">Special Needs</span>
                  </div>
                  <div className="md:col-span-1">
                    <button type="button" onClick={() => remove(index)} className="w-full text-danger hover:text-white hover:bg-danger rounded p-1 transition-colors">✕</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer label text-sm">
                  <input type="checkbox" {...register('clothingLuggageIncluded')} className="w-4 h-4" />
                  <span>Clothing (+3kg/pax)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer label text-sm">
                  <input type="checkbox" {...register('passengerBriefingCompleted')} className="w-4 h-4" />
                  <span>✅ Passenger Briefing Completed</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer label text-sm">
                  <input type="checkbox" {...register('dangerousGoodsBriefing')} className="w-4 h-4" />
                  <span>✅ DG / Prohibited Items Screened</span>
                </label>
              </div>
              <div className="text-right">
                <div className="text-xs opacity-50">Total Traffic Load</div>
                <div className={`text-xl font-bold ${loadWeightStatus ? 'text-accent' : 'text-danger'}`}>{trafficLoad} kg</div>
              </div>
            </div>
          </section>

          {/* Section 7: Fuel & Consumables */}
          <section className="card">
            <h2 className="section-title">7. Fuel Management & Reservas</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Total On Board (L)</label>
                <input type="number" step="0.5" {...register('fuelTotalLiters', { valueAsNumber: true })} className="input" />
              </div>
              <div>
                <label className="label">Est. Consumption for 1 hour flight (L)</label>
                <input type="number" step="0.5" {...register('fuelEstimatedConsumptionLiters', { valueAsNumber: true })} className="input" />
              </div>
            </div>

            <div className={`p-4 rounded-lg border flex items-center justify-between ${fuelReserveSufficient ? 'bg-success/10 border-success text-success' : 'bg-danger/10 border-danger text-danger'}`}>
              <div>
                <div className="font-bold flex items-center gap-2">
                  {fuelReserveSufficient ? '✅' : '❌'} Fuel Reserve: {fuelReserveMinutes} minutes
                </div>
                <p className="text-xs opacity-80">Required minimum: 30 minutes</p>
              </div>
              <div className="text-sm font-medium">
                {fuelReserveSufficient ? 'Requirement satisfied' : 'WARNING: Insufficient reserve'}
              </div>
            </div>
          </section>

          {/* Section 8: Risk Assessment */}
          <section className="card">
            <h2 className="section-title">8. Risk Assessment & Special Factors</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { id: 'riskCheckPowerLines', label: '⚡ Power Lines' },
                { id: 'riskCheckSolarCells', label: '☀️ Solar Cells' },
                { id: 'riskCheckWildlifeAreas', label: '🦒 Wildlife Areas' },
                { id: 'riskCheckCityCenterNoWind', label: '🏙️ City Center without Wind' }
              ].map(item => (
                <label key={item.id} className="flex flex-col items-center justify-center p-3 rounded-lg border border-input-border/30 bg-input-bg/10 hover:bg-primary/10 cursor-pointer transition-all text-center">
                  <input type="checkbox" {...register(item.id as any)} className="w-5 h-5 mb-2" />
                  <span className="text-[10px] font-bold">{item.label}</span>
                </label>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">Risk Mitigation / Specific Notes</label>
                <input {...register('specialRiskNotes')} className="input" placeholder="Obstacles, hunters, landing constraints..." />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label text-success/80">Typical Landing Zones</label>
                  <input {...register('landingOptionsTypical')} className="input" placeholder="Safe fields, accessible zones" />
                </div>
                <div>
                  <label className="label text-danger/80">Areas to Avoid</label>
                  <input {...register('landingOptionsAvoid')} className="input" placeholder="Protected areas, forest, urban" />
                </div>
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="sticky bottom-6 flex flex-col gap-4">
            <button
              type="submit"
              disabled={isSubmitting || !loadWeightStatus || !fuelReserveSufficient || !isTOMValid}
              className={`w-full py-4 rounded-xl text-lg font-bold shadow-2xl transition-all ${(loadWeightStatus && fuelReserveSufficient && isTOMValid)
                ? 'bg-primary text-white hover:scale-[1.02] active:scale-95'
                : 'bg-foreground/20 text-foreground/40 cursor-not-allowed'
                }`}
            >
              {isSubmitting ? 'Generating...' : '✈️ Generate EASA Operational Flight Plan'}
            </button>
            <p className="text-center text-[10px] opacity-50 uppercase tracking-widest">
              Part-BOP COMPLIANT | Voyager Balloons European Region
            </p>
          </div>

          {submitSuccess && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 p-6 bg-success/90 backdrop-blur-md border border-white/20 rounded-2xl text-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
              <div className="flex items-center gap-3">
                <span className="text-3xl">✓</span>
                <div>
                  <div className="font-bold">EASA OFP COMPLETED</div>
                  <div className="text-sm opacity-90">Part-BOP documented & copied to clipboard.</div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
