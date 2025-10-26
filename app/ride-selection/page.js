"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Car,
  Clock,
  CreditCard,
  MapPin,
  MoreHorizontal,
  BikeIcon as Motorcycle,
  Star,
  User,
} from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMobile } from "@/hooks/use-mobile"
import dynamic from 'next/dynamic'

const MapWithNoSSR = dynamic(
  () => import('@/app/components/MapView'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-gray-200 flex items-center justify-center">
        <motion.div
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFD331]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        />
      </div>
    )
  }
)

const rideOptions = [
  {
    id: "standard",
    name: "Ryda Standard",
    icon: Car,
    price: "₹149",
    time: "12 min",
    description: "Affordable rides for everyday use",
    capacity: "4",
    rating: "4.8",
  },
  {
    id: "premium",
    name: "Ryda Premium",
    icon: Car,
    price: "₹249",
    time: "10 min",
    description: "Comfortable rides with top-rated drivers",
    capacity: "4",
    rating: "4.9",
  },
  {
    id: "bike",
    name: "Ryda Bike",
    icon: Motorcycle,
    price: "₹99",
    time: "8 min",
    description: "Quick rides to beat the traffic",
    capacity: "1",
    rating: "4.7",
  },
]

export default function RideSelectionPage() {
  const isMobile = useMobile()
  const [mapLoaded, setMapLoaded] = useState(false)
  const [selectedRide, setSelectedRide] = useState(rideOptions[0].id)

  const pickupLocation = [23.2599, 77.4126] // SBI Bank Square, Bhopal
  const dropoffLocation = [23.2659, 77.4036] // CTO Colony, Bhopal

  useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoaded(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex flex-col h-screen">
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-black text-white p-4 z-10"
      >
        <div className="container mx-auto flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
          <div className="mx-auto flex items-center gap-2">
            <span className="font-medium">Choose a ride</span>
          </div>
          <Button variant="ghost" size="icon" className="text-white">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </motion.header>

      <Tabs defaultValue="ride" className="w-full flex flex-col flex-1">
        <div className="px-4 pt-4 bg-white">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="ride">Ride</TabsTrigger>
            <TabsTrigger value="reserve">Reserve</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="ride" className="flex-1 flex flex-col m-0 p-0" style={{ minHeight: "90vh" }}>
          <div className="relative flex-1 bg-gray-200" style={{ minHeight: "40vh" }}>
            {!mapLoaded ? (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFD331]"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                />
              </motion.div>
            ) : (
              <>
                <div className="h-full w-full relative">
                  <MapWithNoSSR 
                    pickupLocation={pickupLocation}
                    dropoffLocation={dropoffLocation}
                  />
                </div>

                <motion.div
                  className="absolute top-4 left-0 right-0 mx-auto w-[90%] max-w-md bg-white rounded-lg shadow-lg p-3"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-[#FFD331]"></div>
                      <div className="w-0.5 h-10 bg-gray-300"></div>
                      <div className="w-3 h-3 rounded-full bg-black"></div>
                    </div>
                    <div className="flex-1">
                      <div className="mb-2">
                        <p className="font-medium">S B I Bank Square</p>
                        <p className="text-xs text-gray-500">Shahid Nagar Colony, Kohefiza, Bhopal</p>
                      </div>
                      <div>
                        <p className="font-medium">CTO Colony</p>
                        <p className="text-xs text-gray-500">Bairagarh, Bhopal, Madhya Pradesh</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </div>

          <motion.div
            className="bg-white rounded-t-3xl shadow-lg -mt-4 z-10"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto my-3"></div>
            <div className="px-4 pb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Choose a ride</h2>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Now</span>
                </div>
              </div>

              <div className="space-y-3">
                {rideOptions.map((option, index) => (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <Card
                      className={`cursor-pointer border-2 transition-all ${
                        selectedRide === option.id ? "border-[#FFD331]" : "border-transparent"
                      }`}
                      onClick={() => setSelectedRide(option.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-2 rounded-full ${
                              selectedRide === option.id ? "bg-[#FFD331]" : "bg-gray-100"
                            }`}
                          >
                            <option.icon className="h-6 w-6" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium">{option.name}</h3>
                                <p className="text-xs text-gray-500">{option.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{option.price}</p>
                                <p className="text-xs text-gray-500">{option.time}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{option.capacity}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-[#FFD331]" />
                                <span>{option.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <span className="text-sm">Cash</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-sm">
                    Change
                  </Button>
                </div>

                <Button className="w-full bg-[#FFD331] hover:bg-[#e6be2c] text-black font-semibold h-14 text-lg">
                  Book {selectedRide === "bike" ? "Bike" : "Car"}
                </Button>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="reserve" className="flex-1 flex flex-col m-0 p-0">
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <p className="text-gray-500">Schedule a ride for later</p>
            <Button variant="outline" className="mt-4">
              Set pickup time
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}