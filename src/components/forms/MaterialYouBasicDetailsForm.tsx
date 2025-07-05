'use client';

import { useState } from 'react';
import { ListingFormData } from '@/app/sell/page';
import { Button, Input, Textarea, Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui';
import { Car, MapPin, DollarSign, Sparkles } from 'lucide-react';

interface MaterialYouBasicDetailsFormProps {
  data: ListingFormData;
  updateData: (data: Partial<ListingFormData>) => void;
  onNext: () => void;
  errors: Record<string, string>;
}

export default function MaterialYouBasicDetailsForm({ 
  data, 
  updateData, 
  onNext 
}: MaterialYouBasicDetailsFormProps) {
  const [localData, setLocalData] = useState({
    title: data.title,
    make: data.make,
    model: data.model,
    year: data.year,
    price: data.price,
    location: data.location,
    description: data.description,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | number) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!localData.title.trim()) {
      errors.title = 'Title is required';
    } else if (localData.title.length < 10) {
      errors.title = 'Title must be at least 10 characters';
    }

    if (!localData.make.trim()) {
      errors.make = 'Make is required';
    }

    if (!localData.model.trim()) {
      errors.model = 'Model is required';
    }

    if (!localData.year || localData.year < 1900 || localData.year > new Date().getFullYear() + 1) {
      errors.year = 'Please enter a valid year';
    }

    if (!localData.price || localData.price <= 0) {
      errors.price = 'Price must be greater than 0';
    }

    if (!localData.location.trim()) {
      errors.location = 'Location is required';
    }

    if (!localData.description.trim()) {
      errors.description = 'Description is required';
    } else if (localData.description.length < 50) {
      errors.description = 'Description must be at least 50 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      updateData(localData);
      onNext();
    }
  };

  // Auto-generate title when make, model, year change
  const generateTitle = () => {
    if (localData.make && localData.model && localData.year) {
      const generatedTitle = `${localData.year} ${localData.make} ${localData.model}`;
      setLocalData(prev => ({ ...prev, title: generatedTitle }));
    }
  };

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  return (
    <section className="space-y-6" aria-labelledby="basic-details-heading">
      {/* Form Status Live Region */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {hasValidationErrors ? 
          `Form has ${Object.keys(validationErrors).length} validation errors. Please review and correct the highlighted fields.` : 
          'Basic details form ready for input'}
      </div>

      {/* Header */}
      <Card variant="filled">
        <CardHeader>
          <CardTitle level={1} id="basic-details-heading" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-md-sys-primary rounded-xl flex items-center justify-center">
              <Car className="h-6 w-6 text-md-sys-on-primary" aria-hidden="true" />
            </div>
            Basic Details
          </CardTitle>
          <CardDescription>
            Tell us about your car and set your asking price. Make sure to provide accurate information to attract serious buyers. All fields marked with an asterisk (*) are required.
          </CardDescription>
        </CardHeader>
      </Card>

      <form noValidate aria-labelledby="basic-details-heading">
        {/* Vehicle Information */}
        <fieldset>
          <legend className="sr-only">Vehicle Information</legend>
          
          <Card>
            <CardContent className="space-y-6">
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                role="group"
                aria-labelledby="vehicle-info-heading"
              >
                <h2 id="vehicle-info-heading" className="sr-only">Vehicle Information</h2>
                
                {/* Make */}
                <Input
                  label="Make *"
                  value={localData.make}
                  onChange={(e) => handleInputChange('make', e.target.value)}
                  error={validationErrors.make}
                  helperText="Vehicle manufacturer (e.g., Honda, Toyota, BMW)"
                  required
                  aria-describedby="make-help"
                  leadingIcon={<Car aria-hidden="true" />}
                />
                <div id="make-help" className="sr-only">
                  Enter the manufacturer or brand of your vehicle
                </div>

                {/* Model */}
                <Input
                  label="Model *"
                  value={localData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  error={validationErrors.model}
                  helperText="Specific model name (e.g., Civic, Supra, M3)"
                  required
                  aria-describedby="model-help"
                />
                <div id="model-help" className="sr-only">
                  Enter the specific model name of your vehicle
                </div>

                {/* Year */}
                <Input
                  type="number"
                  label="Year *"
                  value={localData.year}
                  onChange={(e) => handleInputChange('year', parseInt(e.target.value) || 0)}
                  min={1900}
                  max={new Date().getFullYear() + 1}
                  error={validationErrors.year}
                  helperText={`Model year (${1900} - ${new Date().getFullYear() + 1})`}
                  required
                  aria-describedby="year-help"
                />
                <div id="year-help" className="sr-only">
                  Enter the model year of your vehicle, between 1900 and {new Date().getFullYear() + 1}
                </div>

                {/* Price */}
                <Input
                  type="number"
                  label="Asking Price *"
                  value={localData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  min={0}
                  step={100}
                  error={validationErrors.price}
                  helperText="Enter your desired selling price in USD"
                  required
                  aria-describedby="price-help"
                  leadingIcon={<DollarSign aria-hidden="true" />}
                />
                <div id="price-help" className="sr-only">
                  Enter your asking price in US dollars. This will be displayed prominently in your listing.
                </div>
              </div>

              {/* Title */}
              <section aria-labelledby="title-section-heading">
                <h3 id="title-section-heading" className="sr-only">Listing Title</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-md-label-large text-md-sys-on-surface-variant">
                      Listing Title *
                    </span>
                    <Button
                      type="button"
                      variant="text"
                      size="sm"
                      onClick={generateTitle}
                      icon={<Sparkles aria-hidden="true" />}
                      iconPosition="left"
                      aria-describedby="auto-generate-help"
                      className="focus-visible:ring-2 focus-visible:ring-md-sys-primary/50 focus-visible:ring-offset-2 focus:outline-none transition-all duration-200"
                    >
                      Auto-generate
                    </Button>
                    <div id="auto-generate-help" className="sr-only">
                      Automatically generate a title using the make, model, and year you've entered. This will overwrite any existing title.
                    </div>
                  </div>
                  <Input
                    label="Title *"
                    value={localData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    error={validationErrors.title}
                    helperText="This will be the main headline for your listing (minimum 10 characters)"
                    maxLength={100}
                    required
                    aria-describedby="title-help title-counter"
                  />
                  <div id="title-help" className="sr-only">
                    Enter a descriptive title for your vehicle listing. This is what potential buyers will see first.
                  </div>
                  <div 
                    id="title-counter" 
                    className="sr-only"
                    aria-live="polite"
                  >
                    {localData.title.length} of 100 characters used
                  </div>
                </div>
              </section>

              {/* Location */}
              <section aria-labelledby="location-section-heading">
                <h3 id="location-section-heading" className="sr-only">Vehicle Location</h3>
                <Input
                  label="Location *"
                  value={localData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  error={validationErrors.location}
                  helperText="City, State or ZIP code where the vehicle is located"
                  required
                  aria-describedby="location-help"
                  leadingIcon={<MapPin aria-hidden="true" />}
                />
                <div id="location-help" className="sr-only">
                  Enter the geographic location where your vehicle is available for viewing and purchase
                </div>
              </section>

              {/* Description */}
              <section aria-labelledby="description-section-heading">
                <h3 id="description-section-heading" className="sr-only">Vehicle Description</h3>
                <Textarea
                  label="Description *"
                  value={localData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  error={validationErrors.description}
                  helperText="Describe your car's condition, modifications, history, and what makes it special (minimum 50 characters)"
                  maxLength={2000}
                  rows={6}
                  required
                  showCounter
                  aria-describedby="description-help description-counter"
                />
                <div id="description-help" className="sr-only">
                  Provide a detailed description of your vehicle including its condition, any modifications, maintenance history, and unique features. This helps buyers understand what makes your car special.
                </div>
                <div 
                  id="description-counter" 
                  className="sr-only"
                  aria-live="polite"
                >
                  {localData.description.length} of 2000 characters used
                </div>
              </section>
            </CardContent>
          </Card>
        </fieldset>

        {/* Navigation */}
        <Card variant="outlined">
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle level={3} id="navigation-heading">Ready to continue?</CardTitle>
                <CardDescription>
                  Next, we'll gather detailed vehicle specifications
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={handleNext}
                size="lg"
                variant="filled"
                aria-describedby="next-button-help"
                className="focus-visible:ring-2 focus-visible:ring-md-sys-primary/50 focus-visible:ring-offset-2 focus:outline-none transition-all duration-200"
              >
                Next: Vehicle Specs
              </Button>
              <div id="next-button-help" className="sr-only">
                Proceed to the next step to enter detailed vehicle specifications. All required fields must be completed and valid before continuing.
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </section>
  );
} 