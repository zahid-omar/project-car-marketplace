'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import AppLayout from '@/components/AppLayout'
import { Button } from '@/components/ui'
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon'

export default function HomePage() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  
  return (
    <AppLayout showNavigation={true} className="bg-md-sys-surface">
      <div className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-md-sys-surface py-20 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-md-sys-primary-container/30 to-md-sys-secondary-container/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center p-4 bg-md-sys-primary-container rounded-3xl mb-8 shadow-md-elevation-1">
                <MaterialYouIcon name="car" className="w-12 h-12 text-md-sys-on-primary-container" />
              </div>
              <h1 className="text-md-display-large font-black text-md-sys-on-surface mb-6" style={{fontWeight: 900}}>
                Buy & Sell Modified Cars
              </h1>
              <p className="text-md-title-large text-md-sys-on-surface mb-8 max-w-3xl mx-auto leading-relaxed">
                The dedicated marketplace for automotive enthusiasts. Find unique project cars,
                custom builds, and connect with fellow car enthusiasts nationwide.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="filled" 
                  size="lg"
                  onClick={() => router.push('/browse')}
                  className="w-full sm:w-56 shadow-md-elevation-2 hover:shadow-md-elevation-3"
                  icon={<MaterialYouIcon name="search" className="w-5 h-5" />}
                  iconPosition="right"
                >
                  Browse Cars
                </Button>
                <Button 
                  variant="outlined" 
                  size="lg"
                  onClick={() => router.push('/sell')}
                  className="w-full sm:w-56 shadow-md-elevation-1 hover:shadow-md-elevation-2"
                  icon={<MaterialYouIcon name="trending-up" className="w-5 h-5" />}
                  iconPosition="right"
                >
                  Sell Your Car
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 lg:py-24 bg-md-sys-surface-container-low">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-md-headline-large font-black text-md-sys-on-surface mb-4" style={{fontWeight: 900}}>
                Why Choose Our Platform?
              </h2>
              <p className="text-md-title-medium text-md-sys-on-surface max-w-2xl mx-auto">
                Built specifically for modified car enthusiasts, by enthusiasts.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<MaterialYouIcon name="settings" className="w-8 h-8" />}
                title="Modification Tracking"
                description="Detailed documentation of mods, upgrades, and custom work done to each vehicle."
                gradient="from-md-sys-primary-container to-md-sys-primary-container/70"
              />
              <FeatureCard
                icon={<MaterialYouIcon name="search" className="w-8 h-8" />}
                title="Advanced Search"
                description="Find exactly what you're looking for with filters designed for modified cars."
                gradient="from-md-sys-secondary-container to-md-sys-secondary-container/70"
              />
              <FeatureCard
                icon={<MaterialYouIcon name="message" className="w-8 h-8" />}
                title="Secure Messaging"
                description="Communicate safely with buyers and sellers without sharing personal information."
                gradient="from-md-sys-tertiary-container to-md-sys-tertiary-container/70"
              />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 lg:py-20 bg-md-sys-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-md-display-medium font-black text-md-sys-primary mb-2">10K+</div>
                <div className="text-md-body-large text-md-sys-on-surface">Active Listings</div>
              </div>
              <div className="text-center">
                <div className="text-md-display-medium font-black text-md-sys-primary mb-2">25K+</div>
                <div className="text-md-body-large text-md-sys-on-surface">Registered Users</div>
              </div>
              <div className="text-center">
                <div className="text-md-display-medium font-black text-md-sys-primary mb-2">50K+</div>
                <div className="text-md-body-large text-md-sys-on-surface">Cars Sold</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-20 bg-md-sys-surface-container">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <div className="bg-md-sys-primary-container rounded-3xl p-8 lg:p-12 shadow-md-elevation-2">
              <h2 className="text-md-headline-medium font-black text-md-sys-on-primary-container mb-4" style={{fontWeight: 900}}>
                Ready to Get Started?
              </h2>
              <p className="text-md-body-large text-md-sys-on-primary-container mb-8">
                Join thousands of automotive enthusiasts buying and selling modified cars.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="filled"
                  size="lg"
                  onClick={() => router.push('/signup')}
                  className="w-full sm:w-56 shadow-md-elevation-2 hover:shadow-md-elevation-3"
                  icon={<MaterialYouIcon name="arrow-right" className="w-5 h-5" />}
                  iconPosition="right"
                >
                  Get Started
                </Button>
                <Button 
                  variant="outlined"
                  size="lg"
                  onClick={() => router.push('/browse')}
                  className="w-full sm:w-56 shadow-md-elevation-1 hover:shadow-md-elevation-2 bg-md-sys-surface/50 hover:bg-md-sys-surface/70"
                  icon={<MaterialYouIcon name="eye" className="w-5 h-5" />}
                  iconPosition="right"
                >
                  Browse First
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}

function FeatureCard({ icon, title, description, gradient }: FeatureCardProps) {
  return (
    <div className="bg-md-sys-surface-container rounded-3xl p-8 hover:bg-md-sys-surface-container-high transition-all duration-300 shadow-md-elevation-1 hover:shadow-md-elevation-2 hover:scale-105 group">
      <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 text-md-sys-on-primary-container shadow-md-elevation-1 group-hover:shadow-md-elevation-2 transition-all duration-300`}>
        {icon}
      </div>
      <h3 className="text-md-title-large font-semibold text-md-sys-on-surface mb-3 text-center">
        {title}
      </h3>
      <p className="text-md-body-medium text-md-sys-on-surface text-center leading-relaxed">
        {description}
      </p>
    </div>
  );
} 